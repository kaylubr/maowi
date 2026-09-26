import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from server.config import settings
from server.db import session as db_session_module
from server.db.base import Base
from server.db.session import get_db
from server.main import app


def _test_database_url() -> str:
    url = make_url(settings.database_url)
    return url.set(database=f"{url.database}_test").render_as_string(
        hide_password=False
    )


def _ensure_database_exists(test_url: str) -> None:
    target = make_url(test_url)
    admin_engine = create_engine(
        target.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
    )
    with admin_engine.connect() as connection:
        already_exists = connection.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": target.database},
        )
        if not already_exists:
            connection.execute(text(f'CREATE DATABASE "{target.database}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def engine():
    test_url = _test_database_url()
    _ensure_database_exists(test_url)

    test_engine = create_engine(test_url, poolclass=NullPool)
    Base.metadata.drop_all(test_engine)
    Base.metadata.create_all(test_engine)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def use_test_database(monkeypatch, session_factory):
    monkeypatch.setattr(db_session_module, "SessionLocal", session_factory)


@pytest.fixture(autouse=True)
def stub_ai(monkeypatch):
    from server.modules import clustering
    from server.questions import generation

    monkeypatch.setattr(clustering, "generate_json", lambda prompt: {})
    monkeypatch.setattr(generation, "generate_json", lambda prompt: {})


@pytest.fixture(autouse=True)
def reset_database(engine):
    yield
    table_names = ", ".join(table.name for table in Base.metadata.sorted_tables)
    with engine.begin() as connection:
        connection.execute(
            text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE")
        )


@pytest.fixture
def db_session(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(session_factory):
    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
