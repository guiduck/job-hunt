import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture()
def sample_linkedin_candidate() -> dict[str, object]:
    return {
        "company_name": "Example Co",
        "role_title": "Frontend Engineer",
        "post_headline": "Hiring React Developer",
        "job_description": "We use React, TypeScript, and Next.js.",
        "contact_channel_value": "jobs@example.com",
        "source_url": "https://www.linkedin.com/jobs/view/example",
        "source_query": "reactjs typescript email",
        "source_evidence": "Email jobs@example.com with your resume.",
        "matched_keywords": ["reactjs", "typescript", "nextjs"],
    }


@pytest.fixture()
def sample_review_candidate() -> dict[str, object]:
    return {
        "company_name": "Example Co",
        "role_title": "Senior TypeScript Developer",
        "post_headline": "Hiring Senior TypeScript Developer",
        "job_description": "Remote product role using TypeScript, React, and Next.js.",
        "contact_channel_type": "email",
        "contact_channel_value": "jobs@example.com",
        "source_url": "https://www.linkedin.com/feed/update/example-review",
        "source_query": "hiring typescript",
        "source_evidence": "We are hiring a Senior TypeScript Developer. Email jobs@example.com.",
        "matched_keywords": ["typescript", "reactjs", "nextjs"],
        "raw_excerpt": "We are hiring a Senior TypeScript Developer. Email jobs@example.com.",
        "provider_status": "collected",
    }


@pytest.fixture()
def ai_filter_settings_payload() -> dict[str, object]:
    return {
        "remote_only": True,
        "exclude_onsite": True,
        "accepted_regions": ["LATAM", "Brazil"],
        "excluded_regions": ["India"],
    }


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    with engine.begin() as connection:
        for ddl in WORKER_SCHEMA:
            connection.execute(text(ddl))
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


WORKER_SCHEMA = [
    """
    CREATE TABLE keyword_sets (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        source VARCHAR(50) NOT NULL,
        opportunity_type VARCHAR(50) NOT NULL,
        terms JSON NOT NULL,
        is_active BOOLEAN NOT NULL,
        is_default BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE opportunities (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        opportunity_type VARCHAR(50) NOT NULL,
        title VARCHAR(500),
        organization_name VARCHAR(255),
        source_name VARCHAR(100),
        source_url TEXT,
        source_query TEXT,
        source_evidence TEXT NOT NULL,
        operator_notes TEXT,
        captured_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE job_opportunity_details (
        id VARCHAR(36) PRIMARY KEY,
        opportunity_id VARCHAR(36) NOT NULL UNIQUE,
        company_name VARCHAR(255),
        role_title VARCHAR(500),
        post_headline VARCHAR(500),
        job_description TEXT,
        contact_channel_type VARCHAR(50),
        contact_channel_value VARCHAR(500) NOT NULL,
        contact_email VARCHAR(320),
        application_url TEXT,
        linkedin_url TEXT,
        poster_profile_url TEXT,
        contact_priority VARCHAR(50),
        hiring_intent_term VARCHAR(100),
        collection_source_type VARCHAR(50),
        matched_keywords JSON NOT NULL,
        dedupe_key VARCHAR(1000),
        job_stage VARCHAR(50) NOT NULL,
        review_status VARCHAR(50) NOT NULL DEFAULT 'unreviewed',
        match_score INTEGER,
        score_explanation TEXT,
        score_factors JSON NOT NULL DEFAULT '{}',
        analysis_status VARCHAR(50) NOT NULL DEFAULT 'deterministic_only',
        analysis_confidence VARCHAR(50),
        analysis_error_code VARCHAR(100),
        analysis_error_message TEXT,
        normalized_company_name VARCHAR(255),
        normalized_role_title VARCHAR(500),
        detected_seniority VARCHAR(100),
        detected_modality VARCHAR(100),
        detected_location VARCHAR(255),
        missing_keywords JSON NOT NULL DEFAULT '[]',
        historical_similarity_signals JSON NOT NULL DEFAULT '{}',
        response_notes TEXT,
        interview_at DATETIME,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE opportunity_keyword_matches (
        id VARCHAR(36) PRIMARY KEY,
        opportunity_id VARCHAR(36) NOT NULL,
        keyword_set_id VARCHAR(36),
        matched_term VARCHAR(255) NOT NULL,
        match_context TEXT,
        created_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE job_search_runs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        status VARCHAR(50) NOT NULL,
        keyword_set_id VARCHAR(36),
        requested_keywords JSON NOT NULL,
        search_query TEXT,
        search_sort_order VARCHAR(20) NOT NULL DEFAULT 'recent',
        hiring_intent_terms JSON NOT NULL,
        collection_source_types JSON NOT NULL,
        provided_source_count INTEGER NOT NULL,
        source_name VARCHAR(100) NOT NULL,
        candidate_limit INTEGER NOT NULL,
        inspected_count INTEGER NOT NULL,
        accepted_count INTEGER NOT NULL,
        rejected_count INTEGER NOT NULL,
        duplicate_count INTEGER NOT NULL,
        cap_reached BOOLEAN NOT NULL,
        provider_status VARCHAR(50) NOT NULL,
        provider_error_code VARCHAR(100),
        provider_error_message TEXT,
        analysis_enabled BOOLEAN NOT NULL DEFAULT false,
        analysis_status VARCHAR(50) NOT NULL DEFAULT 'deterministic_only',
        analysis_error_code VARCHAR(100),
        analysis_error_message TEXT,
        deterministic_only_count INTEGER NOT NULL DEFAULT 0,
        ai_assisted_count INTEGER NOT NULL DEFAULT 0,
        analysis_fallback_count INTEGER NOT NULL DEFAULT 0,
        analysis_failed_count INTEGER NOT NULL DEFAULT 0,
        analysis_skipped_count INTEGER NOT NULL DEFAULT 0,
        ai_filters_enabled BOOLEAN NOT NULL DEFAULT false,
        ai_filter_settings JSON NOT NULL DEFAULT '{}',
        ai_filter_status VARCHAR(50) NOT NULL DEFAULT 'skipped',
        ai_filter_error_code VARCHAR(100),
        ai_filter_error_message TEXT,
        ai_filter_inspected_count INTEGER NOT NULL DEFAULT 0,
        ai_filter_passed_count INTEGER NOT NULL DEFAULT 0,
        ai_filter_rejected_count INTEGER NOT NULL DEFAULT 0,
        ai_filter_fallback_count INTEGER NOT NULL DEFAULT 0,
        ai_filter_failed_count INTEGER NOT NULL DEFAULT 0,
        ai_filter_skipped_count INTEGER NOT NULL DEFAULT 0,
        started_at DATETIME,
        completed_at DATETIME,
        error_message TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE linkedin_collection_inputs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        run_id VARCHAR(36) NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        source_url TEXT,
        provided_text TEXT,
        label VARCHAR(255),
        created_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE job_search_candidates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        run_id VARCHAR(36) NOT NULL,
        opportunity_id VARCHAR(36),
        outcome VARCHAR(50) NOT NULL,
        company_name VARCHAR(255),
        role_title VARCHAR(500),
        post_headline VARCHAR(500),
        job_description TEXT,
        contact_channel_type VARCHAR(50),
        contact_channel_value VARCHAR(500),
        collection_source_type VARCHAR(50),
        hiring_intent_term VARCHAR(100),
        provider_name VARCHAR(100),
        provider_status VARCHAR(50),
        provider_error_code VARCHAR(100),
        poster_profile_url TEXT,
        contact_priority VARCHAR(50),
        source_url TEXT,
        source_query TEXT NOT NULL,
        source_evidence TEXT,
        matched_keywords JSON NOT NULL,
        match_score INTEGER,
        score_explanation TEXT,
        score_factors JSON NOT NULL DEFAULT '{}',
        analysis_status VARCHAR(50) NOT NULL DEFAULT 'deterministic_only',
        analysis_confidence VARCHAR(50),
        analysis_error_code VARCHAR(100),
        analysis_error_message TEXT,
        ai_model_name VARCHAR(255),
        ai_prompt_version VARCHAR(100),
        passes_ai_filter BOOLEAN,
        ai_filter_status VARCHAR(50) NOT NULL DEFAULT 'skipped',
        ai_filter_reason TEXT,
        ai_filter_confidence FLOAT,
        ai_filter_signals JSON NOT NULL DEFAULT '{}',
        ai_filter_error_code VARCHAR(100),
        ai_filter_error_message TEXT,
        ai_filter_model_name VARCHAR(255),
        ai_filter_prompt_version VARCHAR(100),
        normalized_company_name VARCHAR(255),
        normalized_role_title VARCHAR(500),
        detected_seniority VARCHAR(100),
        detected_modality VARCHAR(100),
        detected_location VARCHAR(255),
        missing_keywords JSON NOT NULL DEFAULT '[]',
        historical_similarity_signals JSON NOT NULL DEFAULT '{}',
        raw_excerpt TEXT,
        dedupe_key VARCHAR(1000),
        rejection_reason TEXT,
        inspected_at DATETIME,
        created_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE resume_attachments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        display_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_content BLOB,
        mime_type VARCHAR(255) NOT NULL,
        file_size_bytes INTEGER,
        sha256 VARCHAR(64),
        is_available BOOLEAN NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        uploaded_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE email_templates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        mode VARCHAR(50) NOT NULL,
        template_kind VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject_template TEXT NOT NULL,
        body_template TEXT NOT NULL,
        variables_schema JSON NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE email_drafts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        opportunity_id VARCHAR(36) NOT NULL,
        template_id VARCHAR(36) NOT NULL,
        template_kind VARCHAR(50) NOT NULL,
        resume_attachment_id VARCHAR(36),
        to_email VARCHAR(320) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        rendered_variables JSON NOT NULL DEFAULT '{}',
        warnings JSON NOT NULL DEFAULT '[]',
        status VARCHAR(50) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE bulk_send_batches (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        template_id VARCHAR(36) NOT NULL,
        resume_attachment_id VARCHAR(36),
        selected_count INTEGER NOT NULL,
        sendable_count INTEGER NOT NULL,
        skipped_missing_contact_count INTEGER NOT NULL,
        skipped_duplicate_count INTEGER NOT NULL,
        blocked_invalid_contact_count INTEGER NOT NULL,
        limit_blocked_count INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        items JSON NOT NULL DEFAULT '[]',
        created_at DATETIME NOT NULL,
        approved_at DATETIME,
        completed_at DATETIME,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE send_requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        draft_id VARCHAR(36),
        opportunity_id VARCHAR(36) NOT NULL,
        template_id VARCHAR(36) NOT NULL,
        template_kind VARCHAR(50) NOT NULL,
        resume_attachment_id VARCHAR(36),
        recipient_email VARCHAR(320) NOT NULL,
        subject_snapshot TEXT NOT NULL,
        body_snapshot TEXT NOT NULL,
        resume_snapshot JSON NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL,
        bulk_batch_id VARCHAR(36),
        approved_at DATETIME NOT NULL,
        queued_at DATETIME,
        sent_at DATETIME,
        failed_at DATETIME,
        error_code VARCHAR(100),
        error_message TEXT,
        provider_message_id VARCHAR(255),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE outreach_events (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        opportunity_id VARCHAR(36) NOT NULL,
        draft_id VARCHAR(36),
        send_request_id VARCHAR(36),
        bulk_batch_id VARCHAR(36),
        channel VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        provider_name VARCHAR(50),
        provider_message_id VARCHAR(255),
        recipient_email VARCHAR(320) NOT NULL,
        template_id VARCHAR(36),
        template_kind VARCHAR(50),
        resume_attachment_id VARCHAR(36),
        subject TEXT,
        status VARCHAR(50) NOT NULL,
        error_code VARCHAR(100),
        error_message TEXT,
        payload JSON NOT NULL DEFAULT '{}',
        occurred_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE sending_provider_accounts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL DEFAULT 'user-1',
        provider_name VARCHAR(50) NOT NULL,
        display_email VARCHAR(320),
        display_name VARCHAR(255),
        auth_status VARCHAR(50) NOT NULL,
        send_limit_per_day INTEGER NOT NULL,
        last_checked_at DATETIME,
        token_json JSON,
        token_updated_at DATETIME,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """,
]
