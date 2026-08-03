"""Shared pytest fixtures: an isolated SQLite-backed app + auth helpers."""

import os

# Settings() loads at import time and requires JWT_SECRET_KEY.
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-at-least-32-bytes-long!!",
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.security import create_access_token, hash_password
from app.database import models  # noqa: F401  (registers all tables on Base.metadata)
from app.database.connection import Base, get_db
from app.database.models import User
from app.main import app


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def _make_user(db_session, email: str, password: str) -> User:
    user = User(email=email, hashed_password=hash_password(password))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def test_user(db_session) -> User:
    return _make_user(db_session, "test@example.com", "testpassword123")


@pytest.fixture()
def other_user(db_session) -> User:
    return _make_user(db_session, "other@example.com", "otherpassword123")


@pytest.fixture()
def auth_headers(test_user) -> dict:
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def other_auth_headers(other_user) -> dict:
    token = create_access_token(other_user.id)
    return {"Authorization": f"Bearer {token}"}
