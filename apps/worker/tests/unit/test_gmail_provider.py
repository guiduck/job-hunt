from app.services.gmail_provider import GmailSendInput, GmailSendResult, build_raw_message


class FakeSend:
    def execute(self):
        return {"id": "gmail-message-1"}


class FakeMessages:
    def send(self, userId, body):
        assert userId == "me"
        assert body["raw"]
        return FakeSend()


class FakeUsers:
    def messages(self):
        return FakeMessages()


class FakeService:
    def users(self):
        return FakeUsers()


def test_build_raw_message_contains_subject_and_body() -> None:
    raw = build_raw_message(GmailSendInput(to_email="jobs@example.com", subject="Hello", body="Body"))

    assert isinstance(raw, str)
    assert raw


def test_gmail_provider_success_with_injected_service() -> None:
    from app.services.gmail_provider import GmailProvider

    result = GmailProvider(service=FakeService()).send(GmailSendInput(to_email="jobs@example.com", subject="Hi", body="Body"))

    assert result == GmailSendResult(True, provider_message_id="gmail-message-1")
