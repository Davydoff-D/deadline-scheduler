import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./deadline_scheduler.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)

    if "sqlite" in DATABASE_URL:
        columns = inspect(engine).get_columns("deadlines")
        column_names = {column["name"] for column in columns}
        if "reminder_sent" not in column_names:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE deadlines "
                        "ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT 0"
                    )
                )
