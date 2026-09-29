import logging
import time

from app.core.config import get_worker_settings
from app.jobs.career_page_job_search import process_pending_runs as process_pending_career_page_runs
from app.jobs.linkedin_job_search import process_pending_runs


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    logger = logging.getLogger(__name__)
    settings = get_worker_settings()
    mark_stale_running = settings.worker_mark_stale_running_on_startup

    while True:
        try:
            process_pending_runs(
                settings=settings.model_copy(update={"worker_mark_stale_running_on_startup": mark_stale_running}),
                run_once=True,
            )
        except Exception:
            logger.exception("LinkedIn job processing failed; other worker lanes will continue.")
        try:
            process_pending_career_page_runs(
                settings=settings.model_copy(update={"worker_mark_stale_running_on_startup": mark_stale_running}),
                run_once=True,
            )
        except Exception:
            logger.exception("Career-page processing failed; other worker lanes will continue.")
        if settings.worker_run_once:
            return
        mark_stale_running = False
        time.sleep(settings.worker_poll_interval_seconds)


if __name__ == "__main__":
    main()
