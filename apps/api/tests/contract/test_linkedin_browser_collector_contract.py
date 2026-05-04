from fastapi.testclient import TestClient

from app.api.routes import linkedin_browser_collector


class FakeProcess:
    pid = 12345


def test_starts_browser_collector_process(monkeypatch, tmp_path, client: TestClient) -> None:
    started = {}

    def fake_popen(command, **kwargs):
        started["command"] = command
        started["cwd"] = kwargs["cwd"]
        return FakeProcess()

    monkeypatch.setattr(linkedin_browser_collector.subprocess, "Popen", fake_popen)
    monkeypatch.setattr(linkedin_browser_collector, "default_script_path", lambda: tmp_path / "collector.py")
    (tmp_path / "collector.py").write_text("print('ok')", encoding="utf-8")

    response = client.post(
        "/linkedin/browser-collector/runs",
        json={
            "keywords": ["hiring typescript"],
            "max_posts": 50,
            "max_scrolls": 15,
            "scroll_delay_seconds": 2,
        },
    )

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "started"
    assert body["pid"] == 12345
    assert "--keywords" in body["command"]
    assert "hiring typescript" in body["command"]
    assert "--max-posts" in body["command"]
    assert "50" in body["command"]
    assert "--login-wait-seconds" in body["command"]
    assert started["command"] == body["command"]
