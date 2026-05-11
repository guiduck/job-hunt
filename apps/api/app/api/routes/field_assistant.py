from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.field_assistant import (
    FieldAnswerGenerateRequest,
    FieldAnswerGenerateResponse,
    FieldAssistantActivation,
    FieldAssistantActivationCreate,
    FieldAssistantActivationList,
    FieldAssistantActivationUpdate,
    FieldResponseSuggestion,
    FieldResponseSuggestionCreate,
    FieldResponseSuggestionList,
)
from app.services.field_assistant_service import (
    create_activation,
    delete_activation,
    generate_answer,
    list_activations,
    list_suggestions,
    record_suggestion_used,
    save_suggestion,
    update_activation,
)

router = APIRouter(prefix="/field-assistant", tags=["field-assistant"])


@router.get("/activations", response_model=FieldAssistantActivationList)
def list_field_assistant_activations(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldAssistantActivationList:
    return FieldAssistantActivationList(items=list_activations(db, user=user))


@router.post("/activations", response_model=FieldAssistantActivation, status_code=status.HTTP_201_CREATED)
def create_field_assistant_activation(
    payload: FieldAssistantActivationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldAssistantActivation:
    return create_activation(db, payload, user=user)


@router.patch("/activations/{activation_id}", response_model=FieldAssistantActivation)
def update_field_assistant_activation(
    activation_id: str,
    payload: FieldAssistantActivationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldAssistantActivation:
    return update_activation(db, activation_id, payload, user=user)


@router.delete("/activations/{activation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field_assistant_activation(
    activation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> Response:
    delete_activation(db, activation_id, user=user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/generate", response_model=FieldAnswerGenerateResponse)
def generate_field_assistant_answer(
    payload: FieldAnswerGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldAnswerGenerateResponse:
    return generate_answer(db, payload, user=user)


@router.get("/suggestions", response_model=FieldResponseSuggestionList)
def list_field_assistant_suggestions(
    keyword: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldResponseSuggestionList:
    return FieldResponseSuggestionList(items=list_suggestions(db, keyword=keyword, user=user))


@router.post("/suggestions", response_model=FieldResponseSuggestion, status_code=status.HTTP_201_CREATED)
def create_field_assistant_suggestion(
    payload: FieldResponseSuggestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldResponseSuggestion:
    return save_suggestion(db, payload, user=user)


@router.post("/suggestions/{suggestion_id}/used", response_model=FieldResponseSuggestion)
def mark_field_assistant_suggestion_used(
    suggestion_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> FieldResponseSuggestion:
    return record_suggestion_used(db, suggestion_id, user=user)
