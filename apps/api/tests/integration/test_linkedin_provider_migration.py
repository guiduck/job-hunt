from sqlalchemy import inspect
from sqlalchemy.orm import Session


def test_provider_metadata_columns_exist(db_session: Session) -> None:
    inspector = inspect(db_session.bind)
    run_columns = {column["name"] for column in inspector.get_columns("job_search_runs")}
    candidate_columns = {column["name"] for column in inspector.get_columns("job_search_candidates")}
    detail_columns = {column["name"] for column in inspector.get_columns("job_opportunity_details")}

    assert {"hiring_intent_terms", "collection_source_types", "provider_status"}.issubset(run_columns)
    assert {"collection_source_type", "hiring_intent_term", "provider_status", "poster_profile_url"}.issubset(candidate_columns)
    assert {"poster_profile_url", "contact_priority", "hiring_intent_term", "collection_source_type"}.issubset(detail_columns)
