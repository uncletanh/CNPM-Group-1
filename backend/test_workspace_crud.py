"""Kiem thu CRUD Workspace: tao, liet ke, doi system prompt, widget settings/domain, xoa."""
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core import security
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from app.models.workspace import WorkspaceMember


def run_workspace_crud_test() -> None:
    client = TestClient(app)
    db = SessionLocal()
    owner = User(
        email=f"ws-owner-{uuid4()}@example.com",
        hashed_password=security.get_password_hash("mat-khau-manh-123"),
        role="USER",
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    headers = {"Authorization": f"Bearer {security.create_access_token(subject=owner.id)}"}

    workspace_id = None
    try:
        # --- Tao workspace ---
        created = client.post(
            "/api/v1/workspaces/", headers=headers, json={"name": "Cong ty Demo"}
        )
        assert created.status_code == 200, created.text
        body = created.json()
        workspace_id = body["id"]
        assert body["name"] == "Cong ty Demo"
        assert body["widget_token"]  # co token widget rieng

        # --- Liet ke workspace: phai chua workspace vua tao ---
        listed = client.get("/api/v1/workspaces/", headers=headers)
        assert listed.status_code == 200, listed.text
        assert any(w["id"] == workspace_id for w in listed.json())

        # --- Regression: workspace co nhieu member khac khong duoc nhan ban
        # trong danh sach cua owner (tung bi loi outerjoin fan-out + distinct
        # loi tren Postgres do cot allowed_domains kieu JSON). ---
        member_one = User(
            email=f"ws-member1-{uuid4()}@example.com",
            hashed_password=security.get_password_hash("mat-khau-manh-123"),
            role="USER",
        )
        member_two = User(
            email=f"ws-member2-{uuid4()}@example.com",
            hashed_password=security.get_password_hash("mat-khau-manh-123"),
            role="USER",
        )
        db.add_all([member_one, member_two])
        db.commit()
        db.add_all(
            [
                WorkspaceMember(workspace_id=workspace_id, user_id=member_one.id, role="agent"),
                WorkspaceMember(workspace_id=workspace_id, user_id=member_two.id, role="agent"),
            ]
        )
        db.commit()
        listed_with_members = client.get("/api/v1/workspaces/", headers=headers)
        assert listed_with_members.status_code == 200, listed_with_members.text
        matches = [w for w in listed_with_members.json() if w["id"] == workspace_id]
        assert len(matches) == 1, f"Workspace bi nhan ban trong danh sach: {matches}"
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).delete()
        db.delete(member_one)
        db.delete(member_two)
        db.commit()

        # --- Doi system prompt (>= 20 ky tu) ---
        prompt = client.put(
            f"/api/v1/workspaces/{workspace_id}/prompt",
            headers=headers,
            json={"system_prompt": "Ban la tro ly ao chi tra loi theo context duoc cung cap."},
        )
        assert prompt.status_code == 200, prompt.text
        assert "tro ly ao" in prompt.json()["system_prompt"]

        # --- Cap nhat widget settings ---
        settings = client.put(
            f"/api/v1/workspaces/{workspace_id}/widget-settings",
            headers=headers,
            json={
                "primary_color": "#22c55e",
                "bot_name": "Bot Demo",
                "greeting": "Xin chao, minh co the giup gi?",
                "position": "left",
            },
        )
        assert settings.status_code == 200, settings.text
        assert settings.json()["bot_name"] == "Bot Demo"
        assert settings.json()["position"] == "left"

        # --- Cap nhat domain khoa widget ---
        domain = client.put(
            f"/api/v1/workspaces/{workspace_id}/widget-domain",
            headers=headers,
            json={"domains": ["https://khachhang.example.com"]},
        )
        assert domain.status_code == 200, domain.text

        # --- Nguoi khac khong so huu -> khong thao tac duoc ---
        other = User(
            email=f"ws-other-{uuid4()}@example.com",
            hashed_password=security.get_password_hash("mat-khau-manh-123"),
            role="USER",
        )
        db.add(other)
        db.commit()
        db.refresh(other)
        other_headers = {
            "Authorization": f"Bearer {security.create_access_token(subject=other.id)}"
        }
        denied = client.put(
            f"/api/v1/workspaces/{workspace_id}/prompt",
            headers=other_headers,
            json={"system_prompt": "Co gang chiem quyen workspace nguoi khac abcdxyz."},
        )
        assert denied.status_code in (403, 404), denied.text
        db.delete(other)
        db.commit()

        # --- Xoa workspace ---
        deleted = client.delete(f"/api/v1/workspaces/{workspace_id}", headers=headers)
        assert deleted.status_code == 204, deleted.text
        workspace_id = None

        print("[SUCCESS] Workspace CRUD (create/list/prompt/widget/delete) test passed.")
    finally:
        if workspace_id is not None:
            client.delete(f"/api/v1/workspaces/{workspace_id}", headers=headers)
        fresh = db.query(User).filter(User.id == owner.id).first()
        if fresh:
            db.delete(fresh)
        db.commit()
        db.close()


if __name__ == "__main__":
    run_workspace_crud_test()
