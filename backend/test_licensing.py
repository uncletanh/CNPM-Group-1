"""Kiem thu Freemium + License Key: RBAC Admin, generate/revoke key, upgrade,
rate limit chong brute-force, quota + watermark cua Embed API."""
from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core import security
from app.db.session import SessionLocal
from app.main import app
from app.models.license import LicenseKey
from app.models.user import User
from app.models.workspace import Workspace


def run_licensing_test() -> None:
    client = TestClient(app)
    db = SessionLocal()

    admin = User(
        email=f"admin-{uuid4()}@example.com",
        hashed_password=security.get_password_hash("admin-password"),
        role="ADMIN",
    )
    plain_user = User(
        email=f"user-{uuid4()}@example.com",
        hashed_password=security.get_password_hash("user-password"),
        role="USER",
    )
    rate_limit_user = User(
        email=f"ratelimit-{uuid4()}@example.com",
        hashed_password=security.get_password_hash("user-password"),
        role="USER",
    )
    db.add_all([admin, plain_user, rate_limit_user])
    db.commit()
    for user in (admin, plain_user, rate_limit_user):
        db.refresh(user)

    admin_headers = {"Authorization": f"Bearer {security.create_access_token(admin.id)}"}
    user_headers = {"Authorization": f"Bearer {security.create_access_token(plain_user.id)}"}
    ratelimit_headers = {
        "Authorization": f"Bearer {security.create_access_token(rate_limit_user.id)}"
    }

    workspace = Workspace(name=f"Licensing Test {uuid4()}", owner_id=plain_user.id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    created_key_ids: list[int] = []
    staff_id: int | None = None
    try:
        # --- Nguoi dung thuong khong vao duoc Admin Dashboard API ---
        assert client.get("/api/v1/admin/users", headers=user_headers).status_code == 403
        assert client.post(
            "/api/v1/admin/license-keys", json={"count": 1}, headers=user_headers
        ).status_code == 403
        assert client.post(
            "/api/v1/admin/staff",
            json={"email": f"staff-{uuid4()}@example.com", "password": "staff-password"},
            headers=user_headers,
        ).status_code == 403

        # --- Admin sinh key: dung thuat toan CSPRNG, khong theo quy luat doan duoc ---
        generated = client.post(
            "/api/v1/admin/license-keys", json={"count": 3}, headers=admin_headers
        )
        assert generated.status_code == 201, generated.text
        keys = generated.json()
        assert len(keys) == 3
        for key_row in keys:
            assert key_row["status"] == "AVAILABLE"
            assert key_row["key"].startswith("NOVA-")
            created_key_ids.append(key_row["id"])

        listed = client.get("/api/v1/admin/license-keys", headers=admin_headers)
        assert listed.status_code == 200, listed.text
        listed_keys = {row["id"] for row in listed.json()}
        assert set(created_key_ids).issubset(listed_keys)

        # --- Admin tao tai khoan Staff ---
        staff_email = f"staff-{uuid4()}@example.com"
        staff_created = client.post(
            "/api/v1/admin/staff",
            json={"email": staff_email, "password": "staff-password"},
            headers=admin_headers,
        )
        assert staff_created.status_code == 201, staff_created.text
        assert staff_created.json()["role"] == "STAFF"
        staff_id = staff_created.json()["id"]
        staff_headers = {"Authorization": f"Bearer {security.create_access_token(staff_id)}"}
        # STAFF khong phai ADMIN -> van khong vao duoc Admin Dashboard.
        assert client.get("/api/v1/admin/users", headers=staff_headers).status_code == 403

        # --- Nguoi dung nhap key hop le -> len PRO, key thanh USED ---
        first_key = keys[0]["key"]
        upgraded = client.put(
            "/api/v1/users/me/upgrade", json={"key": first_key}, headers=user_headers
        )
        assert upgraded.status_code == 200, upgraded.text
        assert upgraded.json()["plan"] == "PRO"

        # --- Dung lai key da USED -> tu choi (khong doan mo hinh, chi doi chieu DB) ---
        reuse = client.put(
            "/api/v1/users/me/upgrade", json={"key": first_key}, headers=user_headers
        )
        assert reuse.status_code == 400, reuse.text

        # --- Admin revoke 1 key con AVAILABLE -> khong the kich hoat duoc nua ---
        second_key = keys[1]
        revoked = client.post(
            f"/api/v1/admin/license-keys/{second_key['id']}/revoke", headers=admin_headers
        )
        assert revoked.status_code == 200, revoked.text
        assert revoked.json()["status"] == "REVOKED"
        revoked_attempt = client.put(
            "/api/v1/users/me/upgrade",
            json={"key": second_key["key"]},
            headers=ratelimit_headers,
        )
        assert revoked_attempt.status_code == 400, revoked_attempt.text

        # --- Admin doi plan thu cong khong can key ---
        plan_update = client.put(
            f"/api/v1/admin/users/{plain_user.id}/plan",
            json={"plan": "FREE"},
            headers=admin_headers,
        )
        assert plan_update.status_code == 200, plan_update.text
        assert plan_update.json()["plan"] == "FREE"

        # --- Rate limit chong brute-force: da goi 1 lan (revoked_attempt) o tren,
        # con toi da 4 lan nua trong 60s truoc khi bi 429 ---
        for _ in range(4):
            resp = client.put(
                "/api/v1/users/me/upgrade",
                json={"key": "NOVA-0000-0000-0000-0000"},
                headers=ratelimit_headers,
            )
            assert resp.status_code == 400, resp.text
        blocked = client.put(
            "/api/v1/users/me/upgrade",
            json={"key": "NOVA-0000-0000-0000-0000"},
            headers=ratelimit_headers,
        )
        assert blocked.status_code == 429, blocked.text

        # --- Embed API: workspace cua chu FREE dat gioi han -> 403, watermark=True ---
        db.refresh(workspace)
        widget_headers = {"X-Widget-Token": workspace.widget_token}
        config_before = client.get(
            f"/api/v1/chat/{workspace.id}/widget-config", headers=widget_headers
        )
        assert config_before.status_code == 200, config_before.text
        assert config_before.json()["watermark"] is True

        workspace.message_count = 50
        workspace.message_count_period = datetime.utcnow().strftime("%Y-%m")
        db.commit()
        over_quota = client.post(
            f"/api/v1/chat/{workspace.id}",
            json={"message": "Xin chao", "top_k": 1},
            headers=widget_headers,
        )
        assert over_quota.status_code == 403, over_quota.text
        assert "hạn mức" in over_quota.json()["detail"]

        # Test trong dashboard (JWT owner) khong bi tinh vao quota FREE.
        dashboard_test = client.post(
            f"/api/v1/chat/{workspace.id}",
            json={"message": "Xin chao", "top_k": 1},
            headers=user_headers,
        )
        assert dashboard_test.status_code == 200, dashboard_test.text

        # --- Nang cap workspace owner len PRO -> bo qua quota, an watermark ---
        plain_user.plan = "PRO"
        db.commit()
        config_after = client.get(
            f"/api/v1/chat/{workspace.id}/widget-config", headers=widget_headers
        )
        assert config_after.json()["watermark"] is False
        unblocked = client.post(
            f"/api/v1/chat/{workspace.id}",
            json={"message": "Xin chao", "top_k": 1},
            headers=widget_headers,
        )
        assert unblocked.status_code == 200, unblocked.text

        print("[SUCCESS] Freemium/License Key/RBAC Admin/Embed quota+watermark test passed.")
    finally:
        db.query(LicenseKey).filter(LicenseKey.id.in_(created_key_ids)).delete(
            synchronize_session=False
        )
        db.delete(workspace)
        if staff_id:
            staff_user = db.query(User).filter(User.id == staff_id).first()
            if staff_user:
                db.delete(staff_user)
        db.delete(admin)
        db.delete(plain_user)
        db.delete(rate_limit_user)
        db.commit()
        db.close()


if __name__ == "__main__":
    run_licensing_test()
