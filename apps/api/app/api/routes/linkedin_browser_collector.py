from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
import subprocess
import sys

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.dependencies.auth import bearer_token, current_user
from app.api.errors import bad_request
from app.core.config import Settings, get_settings
from app.models.user import User

router = APIRouter(prefix="/linkedin/browser-collector", tags=["linkedin-browser-collector"])


class LinkedInBrowserCollectorRequest(BaseModel):
    keywords: list[str] = Field(min_length=1)
    requested_keywords: list[str] | None = None
    max_posts: int = Field(default=20, ge=1, le=50)
    max_scrolls: int = Field(default=5, ge=0, le=50)
    scroll_delay_seconds: float = Field(default=1.5, ge=0.5, le=10)
    sort_by: str = '"date_posted"'
    sid: str = "VRT"
    profile_dir: str | None = None
    headless: bool = False
    dry_run: bool = False
    login_wait_seconds: int = Field(default=300, ge=0, le=900)


class LinkedInBrowserCollectorStart(BaseModel):
    status: str
    pid: int
    log_file: str
    command: list[str]
    note: str


def repo_root() -> Path:
    return Path(__file__).resolve().parents[5]


def default_script_path() -> Path:
    return repo_root() / "tools" / "linkedin_browser_collector.py"


def collector_command(payload: LinkedInBrowserCollectorRequest, settings: Settings, auth_token: str | None = None) -> list[str]:
    script_path = Path(settings.linkedin_browser_collector_script_path or default_script_path())
    if not script_path.exists():
        raise bad_request(f"LinkedIn browser collector script not found: {script_path}")

    command = [
        sys.executable,
        str(script_path),
        "--keywords",
        *payload.keywords,
        "--api-base",
        settings.linkedin_browser_collector_api_base,
        "--max-posts",
        str(payload.max_posts),
        "--max-scrolls",
        str(payload.max_scrolls),
        "--scroll-delay-seconds",
        str(payload.scroll_delay_seconds),
        "--sort-by",
        payload.sort_by,
        "--sid",
        payload.sid,
        "--login-wait-seconds",
        str(payload.login_wait_seconds),
    ]
    if payload.requested_keywords:
        command.extend(["--requested-keywords", *payload.requested_keywords])
    if payload.profile_dir:
        command.extend(["--profile-dir", payload.profile_dir])
    if payload.headless:
        command.append("--headless")
    if payload.dry_run:
        command.append("--dry-run")
    if auth_token:
        command.extend(["--auth-token", auth_token])
    return command


@router.post("/runs", response_model=LinkedInBrowserCollectorStart, status_code=202)
def start_linkedin_browser_collector(
    payload: LinkedInBrowserCollectorRequest,
    settings: Settings = Depends(get_settings),
    user: User = Depends(current_user),
    token: str = Depends(bearer_token),
) -> LinkedInBrowserCollectorStart:
    _ = user
    command = collector_command(payload, settings, auth_token=token)
    log_dir = Path(settings.linkedin_browser_collector_log_dir)
    if not log_dir.is_absolute():
        log_dir = repo_root() / log_dir
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    log_file = log_dir / f"linkedin-browser-collector-{timestamp}.log"

    log_handle = log_file.open("w", encoding="utf-8")
    try:
        process = subprocess.Popen(
            command,
            cwd=repo_root(),
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
        )
    finally:
        log_handle.close()

    return LinkedInBrowserCollectorStart(
        status="started",
        pid=process.pid,
        log_file=str(log_file),
        command=command,
        note=(
            "This starts the local Playwright collector from the API process. "
            "It must run in an environment that can open a local browser; Docker containers usually cannot use the host login session."
        ),
    )
