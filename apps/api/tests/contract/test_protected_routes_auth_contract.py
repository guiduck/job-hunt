import pytest


@pytest.mark.parametrize(
    "method,path,json",
    [
        ("get", "/opportunities", None),
        ("get", "/job-search-runs", None),
        ("get", "/user-settings", None),
        ("get", "/user-settings/resumes", None),
        ("get", "/email-templates", None),
        ("get", "/sending/provider-account", None),
        ("post", "/email-drafts", {"opportunity_id": "missing", "template_id": "missing"}),
        ("post", "/bulk-email/preview", {"opportunity_ids": [], "template_id": "missing"}),
    ],
)
def test_protected_routes_require_authentication(client, method, path, json):
    if json is None:
        response = getattr(client, method)(path)
    else:
        response = getattr(client, method)(path, json=json)

    assert response.status_code == 401
