def test_provider_status_does_not_expose_tokens(client, auth_headers):
    response = client.get("/sending/provider-account", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert "token_json" not in payload
    assert "access_token" not in payload
    assert "refresh_token" not in payload
