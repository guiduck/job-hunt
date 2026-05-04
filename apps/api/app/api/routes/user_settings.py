from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user_settings import ResumeAttachment, ResumeCreate, ResumeUpdate, UserSettings, UserSettingsUpdate
from app.services.resume_service import create_resume, get_resume, list_resumes, update_resume, upload_resume_pdf
from app.services.user_settings_service import get_or_create_user_settings, update_user_settings

router = APIRouter(tags=["user-settings"])


@router.get("/user-settings", response_model=UserSettings)
def get_settings_route(db: Session = Depends(get_db), user: User = Depends(current_user)) -> UserSettings:
    return get_or_create_user_settings(db, user=user)


@router.patch("/user-settings", response_model=UserSettings)
def update_settings_route(
    payload: UserSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> UserSettings:
    return update_user_settings(db, payload, user=user)


@router.get("/user-settings/resumes", response_model=list[ResumeAttachment])
def list_resumes_route(db: Session = Depends(get_db), user: User = Depends(current_user)) -> list[ResumeAttachment]:
    return list_resumes(db, user=user)


@router.post("/user-settings/resumes", response_model=ResumeAttachment, status_code=status.HTTP_201_CREATED)
def create_resume_route(
    payload: ResumeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> ResumeAttachment:
    return create_resume(db, payload, user=user)


@router.post("/user-settings/resumes/upload", response_model=ResumeAttachment, status_code=status.HTTP_201_CREATED)
async def upload_resume_route(
    file: UploadFile = File(...),
    display_name: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> ResumeAttachment:
    file_name = file.filename or "resume.pdf"
    if file.content_type != "application/pdf" and not file_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only PDF resumes are supported")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Resume file is empty")
    return upload_resume_pdf(
        db,
        display_name=display_name or file_name,
        file_name=file_name,
        content=content,
        user=user,
    )


@router.patch("/user-settings/resumes/{resume_id}", response_model=ResumeAttachment)
def update_resume_route(
    resume_id: str,
    payload: ResumeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> ResumeAttachment:
    resume = get_resume(db, resume_id, user=user)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return update_resume(db, resume, payload, user=user)


@router.get("/user-settings/resumes/{resume_id}/file")
def download_resume_route(
    resume_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> Response:
    resume = get_resume(db, resume_id, user=user)
    if not resume or not resume.file_content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found")
    return Response(
        content=resume.file_content,
        media_type=resume.mime_type,
        headers={"Content-Disposition": f'inline; filename="{resume.file_name}"'},
    )
