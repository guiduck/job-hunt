from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app
from app.models.user import User
from app.services.auth_service import create_user
from app.services.auth_session_service import create_session


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def test_user(db_session: Session) -> User:
    return create_user(
        db_session,
        email="user@example.com",
        password="Password123!",
        display_name="Test User",
    )


@pytest.fixture()
def auth_headers(db_session: Session, test_user: User) -> dict[str, str]:
    _, token = create_session(db_session, test_user)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def review_ready_job_payload() -> dict[str, object]:
    return {
        "opportunity_type": "job",
        "title": "Senior TypeScript Developer",
        "organization_name": "Example Co",
        "source_name": "LinkedIn",
        "source_url": "https://www.linkedin.com/feed/update/example-review",
        "source_query": "hiring typescript",
        "source_evidence": "We are hiring a Senior TypeScript Developer. Email jobs@example.com.",
        "operator_notes": None,
        "job_detail": {
            "company_name": "Example Co",
            "role_title": "Senior TypeScript Developer",
            "post_headline": "Hiring Senior TypeScript Developer",
            "job_description": "Remote product role using TypeScript, React, and Next.js.",
            "contact_channel_type": "email",
            "contact_channel_value": "jobs@example.com",
            "contact_email": "jobs@example.com",
            "matched_keywords": ["typescript", "reactjs", "nextjs"],
            "job_stage": "new",
        },
    }


@pytest.fixture()
def review_profile_payload() -> dict[str, object]:
    return {
        "review_status": "unreviewed",
        "match_score": 82,
        "score_explanation": "Strong keyword match with public email and source evidence.",
        "score_factors": {
            "positive": ["Matched keyword: typescript", "Public email available"],
            "negative": [],
            "matched_keywords": ["typescript", "reactjs", "nextjs"],
            "missing_keywords": [],
            "evidence_refs": ["source_evidence"],
            "historical_adjustment": 0,
        },
        "analysis_status": "deterministic_only",
        "analysis_confidence": "medium",
        "missing_keywords": [],
        "historical_similarity_signals": {"comparable_count": 0, "adjustment": 0},
    }
