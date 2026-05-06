from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.db.session import get_db
from app.models.email import EmailDraft
from app.core.config import get_settings
from app.models.user import User
from app.schemas.email import (
    BulkAIGenerateRequest,
    BulkPreviewRequest,
    BulkSendBatch,
    BulkSendItemUpdate,
    EmailDraft as EmailDraftSchema,
    EmailDraftCreate,
    EmailDraftUpdate,
    GoogleOAuthStartResponse,
    OutreachEvent,
    SendingProviderAccount,
    SendRequest,
)
from app.services.email_draft_service import create_draft, update_draft
from app.services.email_provider_service import get_provider_account_status
from app.services.email_send_service import approve_draft_send
from app.services.gmail_send_service import send_request_via_gmail
from app.services.google_oauth_service import build_google_oauth_url, complete_google_oauth, disconnect_google_oauth
from app.services.outreach_history_service import list_opportunity_email_history

router = APIRouter(tags=["email-sending"])


@router.get("/sending/provider-account", response_model=SendingProviderAccount)
def get_sending_provider_account(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> SendingProviderAccount:
    return get_provider_account_status(db, user=user)


@router.get("/sending/google-oauth/start", response_model=GoogleOAuthStartResponse)
def start_google_oauth(user: User = Depends(current_user)) -> dict[str, str]:
    return {"auth_url": build_google_oauth_url(user=user)}


@router.get("/sending/google-oauth/callback")
def complete_google_oauth_route(code: str, state: str | None = None, db: Session = Depends(get_db)):
    complete_google_oauth(db, code, user_id=state)
    success_url = get_settings().gmail_oauth_success_redirect_url
    return {
        "status": "ok",
        "message": "Google account connected. You can close this tab and return to Opportunity Desk.",
        "success_url": success_url,
    }


@router.post("/sending/google-oauth/disconnect", response_model=SendingProviderAccount)
def disconnect_google_oauth_route(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> SendingProviderAccount:
    return disconnect_google_oauth(db, user=user)


@router.post("/email-drafts", response_model=EmailDraftSchema, status_code=status.HTTP_201_CREATED)
def create_email_draft(
    payload: EmailDraftCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> EmailDraft:
    return create_draft(db, payload, user=user)


@router.patch("/email-drafts/{draft_id}", response_model=EmailDraftSchema)
def update_email_draft(
    draft_id: str,
    payload: EmailDraftUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> EmailDraft:
    draft = db.get(EmailDraft, draft_id)
    if not draft or draft.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    return update_draft(db, draft, payload, user=user)


@router.post("/email-drafts/{draft_id}/approve-send", response_model=SendRequest)
def approve_email_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> SendRequest:
    draft = db.get(EmailDraft, draft_id)
    if not draft or draft.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    send_request = approve_draft_send(db, draft, user=user, allow_duplicate=True)
    return send_request_via_gmail(db, send_request)


@router.post("/bulk-email/preview", response_model=BulkSendBatch)
def preview_bulk_email(
    payload: BulkPreviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> BulkSendBatch:
    from app.services.bulk_email_service import preview_bulk_send

    return preview_bulk_send(db, payload, user=user)


@router.post("/bulk-email/generate-ai", response_model=BulkSendBatch, status_code=status.HTTP_201_CREATED)
def generate_ai_bulk_email(
    payload: BulkAIGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> BulkSendBatch:
    from app.services.bulk_email_service import generate_ai_bulk_send

    return generate_ai_bulk_send(db, payload, user=user)


@router.patch("/bulk-email/{batch_id}/items/{opportunity_id}", response_model=BulkSendBatch)
def update_bulk_email_item(
    batch_id: str,
    opportunity_id: str,
    payload: BulkSendItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> BulkSendBatch:
    from app.services.bulk_email_service import update_bulk_send_item

    return update_bulk_send_item(db, batch_id, opportunity_id, payload, user=user)


@router.post("/bulk-email/{batch_id}/approve", response_model=BulkSendBatch)
def approve_bulk_email(
    batch_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> BulkSendBatch:
    from app.services.bulk_email_service import approve_bulk_send

    return approve_bulk_send(db, batch_id, user=user)


@router.get("/opportunities/{opportunity_id}/email-history", response_model=list[OutreachEvent])
def get_email_history(
    opportunity_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[OutreachEvent]:
    return list_opportunity_email_history(db, opportunity_id, user=user)
