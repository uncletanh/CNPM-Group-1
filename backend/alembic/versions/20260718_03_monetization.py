"""Freemium + License Key: User.role/plan, Workspace quota/allowed_domains, license_keys table."""

from alembic import op
import sqlalchemy as sa

revision = "20260718_03"
down_revision = "20260718_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # --- users: them plan, chuan hoa lai gia tri role cu (agent/admin) sang
    # he thong 3 cap moi (USER/STAFF/ADMIN). WorkspaceMember.role (admin/agent
    # theo workspace) la mot he thong khac, KHONG dong cham trong migration nay.
    op.add_column("users", sa.Column("plan", sa.String(), nullable=True))
    op.execute("UPDATE users SET plan = 'FREE' WHERE plan IS NULL")

    users_table = sa.table("users", sa.column("role", sa.String))
    bind.execute(users_table.update().where(users_table.c.role == "admin").values(role="ADMIN"))
    bind.execute(
        users_table.update()
        .where(users_table.c.role.notin_(["ADMIN", "STAFF"]))
        .values(role="USER")
    )

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("plan", nullable=False, server_default="FREE")
        batch_op.alter_column("role", nullable=False, server_default="USER")

    # --- workspaces: quota + allowed_domains (thay allowed_origin) ---
    op.add_column("workspaces", sa.Column("message_count", sa.Integer(), nullable=True))
    op.add_column("workspaces", sa.Column("message_count_period", sa.String(), nullable=True))
    op.add_column("workspaces", sa.Column("allowed_domains", sa.JSON(), nullable=True))
    op.execute("UPDATE workspaces SET message_count = 0 WHERE message_count IS NULL")

    workspaces_table = sa.table(
        "workspaces",
        sa.column("id", sa.Integer),
        sa.column("allowed_origin", sa.String),
        sa.column("allowed_domains", sa.JSON),
    )
    rows = bind.execute(
        sa.select(workspaces_table.c.id, workspaces_table.c.allowed_origin)
    ).fetchall()
    for row in rows:
        domains = [row.allowed_origin] if row.allowed_origin else []
        bind.execute(
            workspaces_table.update()
            .where(workspaces_table.c.id == row.id)
            .values(allowed_domains=domains)
        )

    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.alter_column("message_count", nullable=False, server_default="0")
        batch_op.alter_column("allowed_domains", nullable=False)
        batch_op.drop_column("allowed_origin")

    # --- license_keys ---
    op.create_table(
        "license_keys",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("key", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("used_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("license_keys")
    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.add_column(sa.Column("allowed_origin", sa.String(), nullable=True))
        batch_op.drop_column("allowed_domains")
        batch_op.drop_column("message_count_period")
        batch_op.drop_column("message_count")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("plan")
