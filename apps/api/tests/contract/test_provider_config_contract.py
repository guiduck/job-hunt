def test_provider_account_reports_setup_required_without_oauth_config(client, auth_headers):
    response = client.get("/sending/provider-account", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["auth_status"] in {"not_configured", "authorization_required"}
