from app.jobs.email_sending import process_email_sends
from app.jobs.linkedin_job_search import process_pending_runs


def main() -> None:
    process_email_sends()
    process_pending_runs()


if __name__ == "__main__":
    main()
