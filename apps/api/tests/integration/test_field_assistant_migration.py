from sqlalchemy import inspect
from sqlalchemy.orm import Session


def test_field_assistant_tables_exist_in_metadata(db_session: Session) -> None:
    inspector = inspect(db_session.bind)
    table_names = set(inspector.get_table_names())

    assert "field_assistant_activations" in table_names
    assert "field_response_suggestions" in table_names
    assert "field_answer_generations" in table_names
