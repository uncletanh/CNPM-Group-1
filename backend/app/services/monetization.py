from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import PLAN_FREE
from app.models.workspace import Workspace

FREE_MONTHLY_MESSAGE_LIMIT = 50


def _current_period() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def enforce_embed_quota(db: Session, workspace: Workspace) -> None:
    """Goi cho MOI tin nhan qua Embed API (widget_token). Khong goi cho luot
    test bot trong dashboard (JWT owner) - workspace FREE van test binh thuong.
    """
    owner = workspace.owner
    if not owner or owner.plan != PLAN_FREE:
        return

    period = _current_period()
    if workspace.message_count_period != period:
        workspace.message_count = 0
        workspace.message_count_period = period

    if workspace.message_count >= FREE_MONTHLY_MESSAGE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chatbot tạm ngưng do hết hạn mức.",
        )

    workspace.message_count += 1
    db.commit()
