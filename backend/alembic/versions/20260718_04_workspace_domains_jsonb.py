"""Fix workspaces.allowed_domains: json -> jsonb on Postgres.

Postgres 'json' has no equality operator, so `SELECT DISTINCT` on
workspaces (used by GET /workspaces/) fails with "could not identify an
equality operator for type json". SQLite doesn't enforce this so the bug
only reproduced in production. JSONB has an equality operator and is a
drop-in replacement (Postgres provides an implicit json->jsonb cast).
"""

from alembic import op

revision = "20260718_04"
down_revision = "20260718_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            "ALTER TABLE workspaces ALTER COLUMN allowed_domains TYPE JSONB "
            "USING allowed_domains::jsonb"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            "ALTER TABLE workspaces ALTER COLUMN allowed_domains TYPE JSON "
            "USING allowed_domains::json"
        )
