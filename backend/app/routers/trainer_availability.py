from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.trainer_availability import (
    TrainerAvailability as TrainerAvailabilityModel,
)
from app.schemas import (
    TrainerAvailability,
    TrainerAvailabilityCreate,
    TrainerAvailabilityUpdate,
)
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[TrainerAvailability])
def read_availabilities(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    trainer_id: int | None = None,
    my_only: bool = False,
):
    """
    Lista disponibilidades.
    - Se for Admin, vê todas (ou filtra por professor).
    - Se for Professor, vê apenas as suas.
    - Se my_only=True, Admin vê apenas as suas próprias.
    """
    query = db.query(TrainerAvailabilityModel)

    if current_user.is_superuser:
        if my_only:
            # Admin quer ver apenas as suas próprias
            query = query.filter(TrainerAvailabilityModel.trainer_id == current_user.id)
        elif trainer_id:
            query = query.filter(TrainerAvailabilityModel.trainer_id == trainer_id)
    else:
        query = query.filter(TrainerAvailabilityModel.trainer_id == current_user.id)

    availabilities = query.offset(skip).limit(limit).all()
    return availabilities


@router.post("/", response_model=TrainerAvailability)
def create_availability(
    availability_in: TrainerAvailabilityCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Cria uma nova disponibilidade para o utilizador atual.
    """
    # Validar lógica (ex: data específica vs dia da semana) - Opcional por agora

    availability = TrainerAvailabilityModel(
        **availability_in.model_dump(), trainer_id=current_user.id
    )
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability


@router.delete("/{availability_id}", response_model=TrainerAvailability)
def delete_availability(
    availability_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Apaga uma disponibilidade.
    Apenas o próprio dono ou um Admin pode apagar.
    """
    availability = (
        db.query(TrainerAvailabilityModel)
        .filter(TrainerAvailabilityModel.id == availability_id)
        .first()
    )

    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disponibilidade não encontrada",
        )

    if not current_user.is_superuser and availability.trainer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para apagar esta disponibilidade",
        )

    db.delete(availability)
    db.commit()
    return availability
