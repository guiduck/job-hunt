from __future__ import annotations

import copy
import json
import os
import secrets
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse
from urllib.parse import urlencode

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import GoogleIdentityLink, User
from app.services.auth_service import create_user, get_user_by_email, normalize_email
from app.services.auth_session_service import create_session

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"


def _validate_google_auth_success_redirect_url(success_redirect_url: str) -> str:
    parsed = urlparse(success_redirect_url)
    host = parsed.netloc.lower()
    configured_success_url = get_settings().google_auth_success_redirect_url
    if configured_success_url and success_redirect_url == configured_success_url:
        return success_redirect_url
    if parsed.scheme == "https" and host.endswith(".chromiumapp.org"):
        return success_redirect_url
    if parsed.scheme == "chrome-extension":
        return success_redirect_url
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Google sign-in redirect must target the extension identity callback.",
    )


def encode_google_auth_state(success_redirect_url: str | None) -> str | None:
    if not success_redirect_url:
        return None
    payload = {"success_redirect_url": _validate_google_auth_success_redirect_url(success_redirect_url)}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def google_auth_success_redirect_from_state(state: str | None) -> str | None:
    if not state:
        return None
    try:
        padded_state = state + ("=" * (-len(state) % 4))
        payload = json.loads(urlsafe_b64decode(padded_state.encode("ascii")).decode("utf-8"))
    except (ValueError, TypeError):
        return None
    success_redirect_url = payload.get("success_redirect_url")
    if not isinstance(success_redirect_url, str):
        return None
    return _validate_google_auth_success_redirect_url(success_redirect_url)


def build_google_primary_auth_url(success_redirect_url: str | None = None) -> str:
    settings = get_settings()
    client_id = _google_primary_client_id(settings)
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Configure GOOGLE_AUTH_CLIENT_ID and GOOGLE_AUTH_CLIENT_SECRET, or provide a Gmail OAuth client "
                "configuration, before using Google sign-in."
            ),
        )
    scopes = " ".join(scope.strip() for scope in settings.google_auth_scopes.replace(",", " ").split() if scope.strip())
    params = {
        "client_id": client_id,
        "redirect_uri": settings.google_auth_redirect_uri,
        "response_type": "code",
        "scope": scopes or "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    state = encode_google_auth_state(success_redirect_url)
    if state:
        params["state"] = state
    return f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(params)}"


def complete_google_primary_auth(db: Session, code: str) -> tuple[User, str]:
    profile = exchange_code_for_google_profile(code)
    subject = str(profile.get("sub") or "").strip()
    email = normalize_email(str(profile.get("email") or ""))
    email_verified = bool(profile.get("email_verified"))
    display_name = str(profile.get("name") or "").strip() or email

    if not subject or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google identity response is missing account identity.")
    if not email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account email must be verified before sign-in.")

    link = (
        db.query(GoogleIdentityLink)
        .filter(GoogleIdentityLink.provider == "google", GoogleIdentityLink.provider_subject == subject)
        .one_or_none()
    )
    if link:
        link.email = email
        link.email_verified = True
        link.display_name = display_name
        link.last_login_at = datetime.now(UTC)
        user = link.user
    else:
        user = get_user_by_email(db, email)
        if not user:
            user = create_user(
                db,
                email=email,
                password=secrets.token_urlsafe(32),
                display_name=display_name,
            )
        link = GoogleIdentityLink(
            user_id=user.id,
            provider="google",
            provider_subject=subject,
            email=email,
            email_verified=True,
            display_name=display_name,
            last_login_at=datetime.now(UTC),
        )
        db.add(link)

    _, token = create_session(db, user)
    db.commit()
    db.refresh(user)
    return user, token


def exchange_code_for_google_profile(code: str) -> dict[str, object]:
    settings = get_settings()
    client_config = _google_primary_client_config(settings)
    client_id = _google_primary_client_id(settings)
    if not client_config or not client_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Configure GOOGLE_AUTH_CLIENT_ID and GOOGLE_AUTH_CLIENT_SECRET, or provide a Gmail OAuth client "
                "configuration, before completing Google sign-in."
            ),
        )

    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        _google_primary_flow_client_config(client_config, settings.google_auth_redirect_uri),
        scopes=[scope.strip() for scope in settings.google_auth_scopes.replace(",", " ").split() if scope.strip()],
        redirect_uri=settings.google_auth_redirect_uri,
    )
    try:
        os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")
        flow.fetch_token(code=code)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google sign-in failed. Start again from Opportunity Desk. Details: {exc}",
        ) from exc

    credentials = flow.credentials
    credentials_json = json.loads(credentials.to_json())
    id_token = getattr(credentials, "id_token", None) or credentials_json.get("id_token")
    if not id_token:
        access_token = getattr(credentials, "token", None) or credentials_json.get("token")
        if access_token:
            return _google_profile_from_userinfo(str(access_token))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google sign-in did not return an identity token.")

    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests

    return dict(google_id_token.verify_oauth2_token(id_token, requests.Request(), client_id))


def _google_profile_from_userinfo(access_token: str) -> dict[str, object]:
    import requests

    response = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google sign-in returned an access token, but the identity profile could not be loaded.",
        )
    profile = response.json()
    if "email_verified" in profile and isinstance(profile["email_verified"], str):
        profile["email_verified"] = profile["email_verified"].lower() == "true"
    return dict(profile)


def _google_primary_client_id(settings) -> str | None:
    if settings.google_auth_client_id:
        return settings.google_auth_client_id
    client_config = _google_primary_client_config(settings)
    client_info = _google_client_info(client_config)
    client_id = client_info.get("client_id") if client_info else None
    return str(client_id) if client_id else None


def _google_primary_client_config(settings) -> dict[str, object] | None:
    if settings.google_auth_client_id and settings.google_auth_client_secret:
        return {
            "web": {
                "client_id": settings.google_auth_client_id,
                "client_secret": settings.google_auth_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_auth_redirect_uri],
            }
        }
    if settings.gmail_oauth_client_config_json:
        return json.loads(settings.gmail_oauth_client_config_json)
    if settings.gmail_oauth_client_secrets_file:
        secrets_path = Path(settings.gmail_oauth_client_secrets_file)
        if secrets_path.exists():
            return json.loads(secrets_path.read_text(encoding="utf-8"))
    return None


def _google_client_info(client_config: dict[str, object] | None) -> dict[str, object]:
    if not client_config:
        return {}
    web = client_config.get("web")
    if isinstance(web, dict):
        return web
    installed = client_config.get("installed")
    if isinstance(installed, dict):
        return installed
    return {}


def _google_primary_flow_client_config(client_config: dict[str, object], redirect_uri: str) -> dict[str, object]:
    flow_config = copy.deepcopy(client_config)
    client_info = _google_client_info(flow_config)
    redirect_uris = client_info.get("redirect_uris")
    if not isinstance(redirect_uris, list):
        redirect_uris = []
    if redirect_uri not in redirect_uris:
        redirect_uris.append(redirect_uri)
    client_info["redirect_uris"] = redirect_uris
    return flow_config
