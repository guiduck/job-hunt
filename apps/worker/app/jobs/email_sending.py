from app.core.config import get_worker_settings
from app.db.session import new_session
from app.services.email_delivery import process_pending_send_requests


def process_email_sends() -> int:
    settings = get_worker_settings()
    with new_session() as db:
        return process_pending_send_requests(db, limit=settings.worker_max_runs_per_loop)
