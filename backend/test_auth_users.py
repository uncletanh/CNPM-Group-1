"""Kiem thu luong Auth (register/login) va Users (me, doi mat khau, RBAC danh sach)."""
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core import security
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User


def run_auth_users_test() -> None:
    client = TestClient(app)
    email = f"auth-{uuid4()}@example.com"
    password = "matkhau-manh-123"

    created_ids = []
    db = SessionLocal()
    try:
        # --- Register: happy path ---
        res = client.post(
            "/api/v1/auth/register", json={"email": email, "password": password}
        )
        assert res.status_code == 200, res.text
        assert res.json()["email"] == email
        assert res.json()["role"] == "USER"

        # --- Register: email trung lap -> 400 ---
        dup = client.post(
            "/api/v1/auth/register", json={"email": email, "password": password}
        )
        assert dup.status_code == 400, dup.text

        # --- Login: sai mat khau -> 400 ---
        bad = client.post(
            "/api/v1/auth/login", json={"email": email, "password": "sai-mat-khau-99"}
        )
        assert bad.status_code == 400, bad.text

        # --- Login: email khong ton tai -> cung 400, cung message voi truong hop sai mat
        # khau (khong duoc phan biet de tranh lo email nao da dang ky) ---
        unknown = client.post(
            "/api/v1/auth/login",
            json={"email": f"khong-ton-tai-{uuid4()}@example.com", "password": "bat-ky"},
        )
        assert unknown.status_code == 400, unknown.text
        assert unknown.json()["detail"] == bad.json()["detail"]

        # --- Login: happy path -> token ---
        ok = client.post(
            "/api/v1/auth/login", json={"email": email, "password": password}
        )
        assert ok.status_code == 200, ok.text
        token = ok.json()["access_token"]
        assert ok.json()["token_type"] == "bearer"
        headers = {"Authorization": f"Bearer {token}"}

        # --- GET /users/me ---
        me = client.get("/api/v1/users/me", headers=headers)
        assert me.status_code == 200, me.text
        assert me.json()["email"] == email

        # --- Doi mat khau: sai mat khau hien tai -> 400 ---
        wrong = client.put(
            "/api/v1/users/me/password",
            headers=headers,
            json={"current_password": "khong-dung", "new_password": "mat-khau-moi-123"},
        )
        assert wrong.status_code == 400, wrong.text

        # --- Doi mat khau: happy path ---
        changed = client.put(
            "/api/v1/users/me/password",
            headers=headers,
            json={"current_password": password, "new_password": "mat-khau-moi-123"},
        )
        assert changed.status_code == 200, changed.text

        # --- GET /users/ voi vai tro agent -> 403 ---
        forbidden = client.get("/api/v1/users/", headers=headers)
        assert forbidden.status_code == 403, forbidden.text

        # --- Admin xem duoc danh sach tai khoan ---
        admin = User(
            email=f"admin-{uuid4()}@example.com",
            hashed_password=security.get_password_hash(password),
            role="ADMIN",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        created_ids.append(admin.id)
        admin_token = security.create_access_token(subject=admin.id)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        listed = client.get("/api/v1/users/", headers=admin_headers)
        assert listed.status_code == 200, listed.text
        assert isinstance(listed.json(), list)

        # --- Google SSO chua cau hinh -> 503 ---
        google = client.get("/api/v1/auth/google/login", follow_redirects=False)
        assert google.status_code in (503, 302), google.text

        # --- CORS: chi path widget cong khai moi duoc phan chieu origin bat ky, du
        # request tu khai them header X-Widget-Token (truoc day dieu kien nay dua vao
        # header do client tu khai nen bi lam nhien duoc) ---
        attacker_origin = "https://attacker.example.com"
        public_resp = client.options(
            "/api/v1/chat/999999/widget-config",
            headers={"Origin": attacker_origin, "X-Widget-Token": "gia-mao"},
        )
        assert public_resp.headers.get("access-control-allow-origin") == attacker_origin

        admin_only_resp = client.options(
            "/api/v1/chat/999999/sessions",
            headers={"Origin": attacker_origin, "X-Widget-Token": "gia-mao"},
        )
        assert "access-control-allow-origin" not in {
            k.lower() for k in admin_only_resp.headers.keys()
        }

        print("[SUCCESS] Auth register/login and Users me/password/RBAC test passed.")
    finally:
        registered = db.query(User).filter(User.email == email).first()
        if registered:
            db.delete(registered)
        for uid in created_ids:
            obj = db.query(User).filter(User.id == uid).first()
            if obj:
                db.delete(obj)
        db.commit()
        db.close()


if __name__ == "__main__":
    run_auth_users_test()
