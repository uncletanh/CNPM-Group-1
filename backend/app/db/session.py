import os
import logging

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
DATABASE_BACKEND = make_url(DATABASE_URL).get_backend_name()
DATABASE_IS_PERSISTENT = DATABASE_BACKEND != "sqlite"

if os.getenv("ENVIRONMENT", "development").lower() == "production" and not DATABASE_IS_PERSISTENT:
    logging.getLogger(__name__).critical(
        "Production is using SQLite on an ephemeral filesystem. "
        "Set DATABASE_URL to PostgreSQL before storing real data."
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_workspace_schema() -> None:
    """Keep create_all compatible with older local databases."""
    inspector = inspect(engine)
    if "workspaces" not in inspector.get_table_names():
        return

    workspace_columns = {column["name"] for column in inspector.get_columns("workspaces")}

    if "system_prompt" not in workspace_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE workspaces "
                    "ADD COLUMN system_prompt TEXT NOT NULL DEFAULT "
                    "'Ban la tro ly ao cua cong ty. Chi tra loi dua tren context duoc cung cap. "
                    "Neu context khong co thong tin phu hop, hay de nghi khach hang gap nhan vien ho tro.'"
                )
            )

    if "widget_token" not in workspace_columns:
        import uuid

        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE workspaces ADD COLUMN widget_token VARCHAR"))
            rows = connection.execute(text("SELECT id FROM workspaces")).fetchall()
            for (workspace_id,) in rows:
                connection.execute(
                    text("UPDATE workspaces SET widget_token = :token WHERE id = :id"),
                    {"token": uuid.uuid4().hex, "id": workspace_id},
                )

    if "allowed_origin" not in workspace_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE workspaces ADD COLUMN allowed_origin VARCHAR"))

    widget_columns = {
        "widget_primary_color": ("VARCHAR", "#4f46e5"),
        "bot_name": ("VARCHAR", "NovaChat AI"),
        "bot_greeting": (
            "VARCHAR",
            "Xin chào! Mình là NovaChat AI. Mình có thể giúp gì cho bạn?",
        ),
        "bot_avatar_url": ("VARCHAR", None),
        "widget_position": ("VARCHAR", "right"),
    }
    with engine.begin() as connection:
        for name, (column_type, default) in widget_columns.items():
            if name in workspace_columns:
                continue
            connection.execute(text(f"ALTER TABLE workspaces ADD COLUMN {name} {column_type}"))
            if default is not None:
                connection.execute(
                    text(f"UPDATE workspaces SET {name} = :value WHERE {name} IS NULL"),
                    {"value": default},
                )


def ensure_chat_session_schema() -> None:
    """Add handoff columns to databases created before Phase 4."""
    inspector = inspect(engine)
    if "chat_sessions" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("chat_sessions")}
    additions = {
        "assigned_agent_id": "INTEGER",
        "handoff_requested_at": "DATETIME",
        "fallback_sent_at": "DATETIME",
    }
    with engine.begin() as connection:
        for name, column_type in additions.items():
            if name not in columns:
                connection.execute(
                    text(f"ALTER TABLE chat_sessions ADD COLUMN {name} {column_type}")
                )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
