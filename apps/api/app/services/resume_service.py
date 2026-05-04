from hashlib import sha256
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.email import ResumeAttachment
from app.models.user import User
from app.schemas.user_settings import ResumeCreate, ResumeUpdate
from app.services.auth_service import ensure_default_local_user


def list_resumes(db: Session, *, available_only: bool = False, user: User | None = None) -> list[ResumeAttachment]:
    user = user or ensure_default_local_user(db)
    query = select(ResumeAttachment).where(ResumeAttachment.user_id == user.id)
    if available_only:
        query = query.where(ResumeAttachment.is_available.is_(True))
    return list(db.scalars(query.order_by(ResumeAttachment.uploaded_at.desc())).all())


def create_resume(db: Session, payload: ResumeCreate, user: User | None = None) -> ResumeAttachment:
    user = user or ensure_default_local_user(db)
    resume = ResumeAttachment(user_id=user.id, **payload.model_dump())
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def upload_resume_pdf(
    db: Session,
    *,
    display_name: str,
    file_name: str,
    content: bytes,
    user: User | None = None,
) -> ResumeAttachment:
    user = user or ensure_default_local_user(db)
    digest = sha256(content).hexdigest()
    resume_id = str(uuid4())
    resume = ResumeAttachment(
        id=resume_id,
        user_id=user.id,
        display_name=display_name,
        file_name=file_name,
        file_path=f"postgres://resume_attachments/{resume_id}",
        file_content=content,
        mime_type="application/pdf",
        file_size_bytes=len(content),
        sha256=digest,
        is_available=True,
        is_default=False,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def get_resume(db: Session, resume_id: str, user: User | None = None) -> ResumeAttachment | None:
    resume = db.get(ResumeAttachment, resume_id)
    if user and (not resume or resume.user_id != user.id):
        return None
    return resume


def update_resume(db: Session, resume: ResumeAttachment, payload: ResumeUpdate, user: User | None = None) -> ResumeAttachment:
    if user and resume.user_id != user.id:
        raise ValueError("Resume not found")
    values = payload.model_dump(exclude_unset=True)
    if values.get("is_default") is True:
        db.query(ResumeAttachment).filter(
            ResumeAttachment.user_id == resume.user_id,
            ResumeAttachment.id != resume.id,
        ).update({ResumeAttachment.is_default: False})
        values["is_available"] = True
    for field, value in values.items():
        setattr(resume, field, value)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def get_newest_available_resume(db: Session, user_id: str | None = None) -> ResumeAttachment | None:
    user_filter = ResumeAttachment.user_id == user_id if user_id else True
    default_resume = db.scalar(
        select(ResumeAttachment)
        .where(user_filter, ResumeAttachment.is_available.is_(True), ResumeAttachment.is_default.is_(True))
        .order_by(ResumeAttachment.uploaded_at.desc(), ResumeAttachment.created_at.desc())
    )
    if default_resume:
        return default_resume
    return db.scalar(
        select(ResumeAttachment)
        .where(user_filter, ResumeAttachment.is_available.is_(True))
        .order_by(ResumeAttachment.uploaded_at.desc(), ResumeAttachment.created_at.desc())
    )
