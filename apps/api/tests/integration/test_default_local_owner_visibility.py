from app.db.seed import seed_defaults
from app.services.auth_service import ensure_default_local_user
from app.services.email_template_service import list_templates
from app.services.user_settings_service import get_or_create_user_settings


def test_default_local_owner_can_see_seeded_local_data(db_session):
    user = ensure_default_local_user(db_session)
    seed_defaults(db_session)

    settings = get_or_create_user_settings(db_session, user=user)
    templates = list_templates(db_session, user=user)

    assert settings.user_id == user.id
    assert templates
    assert {template.user_id for template in templates} == {user.id}
