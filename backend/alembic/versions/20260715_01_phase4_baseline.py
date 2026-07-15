"""Phase 4 baseline for existing NovaChat databases."""

from alembic import op
import sqlalchemy as sa

revision = "20260715_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing developer databases are brought forward by ensure_*_schema.
    # A fresh production database should be created from SQLAlchemy metadata,
    # then stamped with this baseline before subsequent migrations.
    bind = op.get_bind()
    from app.db.session import Base
    import app.models.chat  # noqa: F401
    import app.models.user  # noqa: F401
    import app.models.workspace  # noqa: F401

    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    for table in (
        "messages",
        "chat_sessions",
        "workspace_invitations",
        "workspace_members",
        "workspaces",
        "users",
    ):
        op.drop_table(table)
