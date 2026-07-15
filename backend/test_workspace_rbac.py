from uuid import uuid4

from fastapi.testclient import TestClient

from app.core import security
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceInvitation, WorkspaceMember


def run_workspace_rbac_test() -> None:
    db = SessionLocal()
    owner = User(
        email=f"owner-{uuid4()}@example.com",
        hashed_password=security.get_password_hash("owner-password"),
        role="agent",
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    workspace = Workspace(name=f"RBAC {uuid4()}", owner_id=owner.id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    client = TestClient(app)
    owner_headers = {"Authorization": f"Bearer {security.create_access_token(owner.id)}"}
    agent_email = f"agent-{uuid4()}@example.com"
    agent = None
    try:
        invitation = client.post(
            f"/api/v1/workspaces/{workspace.id}/invitations",
            json={"email": agent_email, "role": "agent"},
            headers=owner_headers,
        )
        assert invitation.status_code == 201, invitation.text

        registration = client.post(
            "/api/v1/auth/register",
            json={"email": agent_email, "password": "agent-password"},
        )
        assert registration.status_code == 200, registration.text
        assert registration.json()["role"] == "agent"
        agent = db.query(User).filter(User.email == agent_email).first()
        agent_headers = {"Authorization": f"Bearer {security.create_access_token(agent.id)}"}

        accepted = client.post(
            f"/api/v1/workspaces/invitations/{invitation.json()['token']}/accept",
            headers=agent_headers,
        )
        assert accepted.status_code == 200, accepted.text

        sessions = client.get(
            f"/api/v1/chat/{workspace.id}/sessions", headers=agent_headers
        )
        assert sessions.status_code == 200, sessions.text
        forbidden = client.put(
            f"/api/v1/workspaces/{workspace.id}/widget-settings",
            json={
                "primary_color": "#123456",
                "bot_name": "Bot",
                "greeting": "Xin chào",
                "avatar_url": None,
                "position": "right",
            },
            headers=agent_headers,
        )
        assert forbidden.status_code == 403, forbidden.text
        assert client.get(
            f"/api/v1/workspaces/{workspace.id}/members", headers=agent_headers
        ).status_code == 403
        print("[SUCCESS] Workspace invitation and Admin/Agent RBAC test passed.")
    finally:
        db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.workspace_id == workspace.id
        ).delete()
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
        db.delete(workspace)
        if agent:
            db.delete(agent)
        db.delete(owner)
        db.commit()
        db.close()


if __name__ == "__main__":
    run_workspace_rbac_test()
