import time

from app.core.config import get_worker_settings
from app.jobs.email_sending import process_email_sends
from app.jobs.linkedin_job_search import process_pending_runs


def main() -> None:
    settings = get_worker_settings()
    mark_stale_running = settings.worker_mark_stale_running_on_startup

    while True:
        process_email_sends()
        process_pending_runs(
            settings=settings.model_copy(update={"worker_mark_stale_running_on_startup": mark_stale_running}),
            run_once=True,
        )
        if settings.worker_run_once:
            return
        mark_stale_running = False
        time.sleep(min(settings.email_send_poll_interval_seconds, settings.worker_poll_interval_seconds))


if __name__ == "__main__":
    main()
