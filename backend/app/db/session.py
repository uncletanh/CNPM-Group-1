import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_workspace_schema() -> None:
    """Keep create_all compatible with older local databases."""
    inspector = inspect(engine)
    if "workspaces" not in inspector.get_table_names():
        return

    workspace_columns = {column["name"] for column in inspector.get_columns("workspaces")}
    if "system_prompt" in workspace_columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE workspaces "
                "ADD COLUMN system_prompt TEXT NOT NULL DEFAULT "
                "'Ban la tro ly ao cua cong ty. Chi tra loi dua tren context duoc cung cap. "
                "Neu context khong co thong tin phu hop, hay de nghi khach hang gap nhan vien ho tro.'"
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
