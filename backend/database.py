import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./komorebi.db")

# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
