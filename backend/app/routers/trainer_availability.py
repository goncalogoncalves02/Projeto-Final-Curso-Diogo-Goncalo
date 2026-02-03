from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas import (
    TrainerAvailability,
    TrainerAvailabilityCreate,
    TrainerAvailabilityUpdate,
)
from app.models.user import User
from app.crud import trainer_availability as availability_crud

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
    if current_user.is_superuser:
        if my_only:
            # Admin quer ver apenas as suas próprias
            return availability_crud.get_by_trainer(
                db, trainer_id=current_user.id, skip=skip, limit=limit
            )
        elif trainer_id:
            return availability_crud.get_by_trainer(
                db, trainer_id=trainer_id, skip=skip, limit=limit
            )
        return availability_crud.get_multi(db, skip=skip, limit=limit)

    # Se não for admin, retorna apenas as suas
    return availability_crud.get_by_trainer(
        db, trainer_id=current_user.id, skip=skip, limit=limit
    )


@router.post("/", response_model=TrainerAvailability)
def create_availability(
    availability_in: TrainerAvailabilityCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Cria uma nova disponibilidade para o utilizador atual.
    """
    return availability_crud.create_for_trainer(
        db, trainer_id=current_user.id, obj_in=availability_in
    )


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
    availability = availability_crud.get(db, id=availability_id)

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

    return availability_crud.remove(db, id=availability_id)
