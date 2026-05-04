from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.db.session import Base


def test_metadata_contains_persisted_linkedin_collection_inputs(db_session: Session) -> None:
    inspector = inspect(db_session.bind)

    assert "linkedin_collection_inputs" in inspector.get_table_names()
    columns = {column["name"] for column in inspector.get_columns("linkedin_collection_inputs")}
    assert {"run_id", "source_type", "source_url", "provided_text", "label"}.issubset(columns)
    assert "linkedin_collection_inputs" in Base.metadata.tables
