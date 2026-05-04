from __future__ import annotations

import base64
from dataclasses import dataclass, field
from email.message import EmailMessage
from pathlib import Path

from app.core.config import get_worker_settings


@dataclass(frozen=True)
class GmailAttachment:
    file_path: str
    file_name: str
    mime_type: str = "application/octet-stream"
    file_content: bytes | None = None


@dataclass(frozen=True)
class GmailSendInput:
    to_email: str
    subject: str
    body: str
    attachments: list[GmailAttachment] = field(default_factory=list)


@dataclass(frozen=True)
class GmailSendResult:
    success: bool
    provider_message_id: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class GmailProvider:
    def __init__(self, service=None, token_info: dict[str, object] | None = None) -> None:
        self._service = service
        self._token_info = token_info

    def is_configured(self) -> bool:
        settings = get_worker_settings()
        return (
            settings.email_provider == "gmail"
            and (
                bool(self._token_info)
                or (
                    bool(settings.gmail_oauth_client_secrets_file)
                    and bool(settings.gmail_oauth_token_file)
                    and Path(settings.gmail_oauth_client_secrets_file).exists()
                    and Path(settings.gmail_oauth_token_file).exists()
                )
            )
        )

    def send(self, payload: GmailSendInput) -> GmailSendResult:
        if self._service is None:
            if not self.is_configured():
                return GmailSendResult(False, error_code="gmail_not_configured", error_message="Gmail OAuth files are missing.")
            try:
                self._service = build_gmail_service(self._token_info)
            except Exception as exc:  # pragma: no cover - depends on local OAuth files.
                return GmailSendResult(False, error_code="gmail_auth_failed", error_message=str(exc))

        try:
            raw = build_raw_message(payload)
            response = self._service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return GmailSendResult(True, provider_message_id=response.get("id"))
        except Exception as exc:  # pragma: no cover - provider exceptions vary by google client.
            return GmailSendResult(False, error_code="gmail_send_failed", error_message=str(exc))


def build_gmail_service(token_info: dict[str, object] | None = None):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    settings = get_worker_settings()
    if token_info:
        credentials = Credentials.from_authorized_user_info(
            token_info,
            scopes=[scope.strip() for scope in settings.gmail_oauth_scopes.split(",") if scope.strip()],
        )
        return build("gmail", "v1", credentials=credentials)

    if not settings.gmail_oauth_token_file:
        raise ValueError("Gmail OAuth token is required in sending_provider_accounts.token_json or GMAIL_OAUTH_TOKEN_FILE.")
    credentials = Credentials.from_authorized_user_file(
        settings.gmail_oauth_token_file,
        scopes=[scope.strip() for scope in settings.gmail_oauth_scopes.split(",") if scope.strip()],
    )
    return build("gmail", "v1", credentials=credentials)


def build_raw_message(payload: GmailSendInput) -> str:
    message = EmailMessage()
    message["To"] = payload.to_email
    message["Subject"] = payload.subject
    message.set_content(payload.body)

    for attachment in payload.attachments:
        path = Path(attachment.file_path)
        content = attachment.file_content if attachment.file_content is not None else path.read_bytes()
        maintype, _, subtype = attachment.mime_type.partition("/")
        message.add_attachment(
            content,
            maintype=maintype or "application",
            subtype=subtype or "octet-stream",
            filename=attachment.file_name,
        )

    return base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
