from app.db.session import Base
from app.models.opportunity import JobOpportunityDetail, KeywordSet, Opportunity, OpportunityKeywordMatch


def test_opportunity_storage_tables_are_registered() -> None:
    tables = Base.metadata.tables
    assert Opportunity.__tablename__ in tables
    assert JobOpportunityDetail.__tablename__ in tables
    assert KeywordSet.__tablename__ in tables
    assert OpportunityKeywordMatch.__tablename__ in tables
