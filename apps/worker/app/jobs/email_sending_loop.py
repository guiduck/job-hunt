import logging
import time

from app.core.config import get_worker_settings
from app.jobs.email_sending import process_email_sends


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    logger = logging.getLogger(__name__)
    settings = get_worker_settings()
    logger.info("Dedicated email delivery worker started.")

    while True:
        try:
            processed = process_email_sends()
            if processed:
                logger.info("Processed %s email send request(s).", processed)
        except Exception:
            logger.exception("Unexpected email delivery loop failure; polling will continue.")
        if settings.worker_run_once:
            return
        time.sleep(settings.email_send_poll_interval_seconds)


if __name__ == "__main__":
    main()
