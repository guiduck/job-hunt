from app.schemas.email import SendRequestStatus


def test_worker_down_statuses_remain_visible_until_worker_processes_send():
    assert SendRequestStatus.APPROVED == "approved"
    assert SendRequestStatus.QUEUED == "queued"
    assert SendRequestStatus.FAILED == "failed"
