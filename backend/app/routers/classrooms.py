from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.classroom import Classroom, ClassroomCreate, ClassroomUpdate
from app.api import deps
from app.crud import classroom as classroom_crud

router = APIRouter()


@router.get("/", response_model=List[Classroom])
def read_classrooms(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista todas as salas.
    """
    return classroom_crud.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=Classroom)
def create_classroom(
    *,
    db: Session = Depends(get_db),
    classroom_in: ClassroomCreate,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Cria uma nova sala (Apenas Admin).
    """
    return classroom_crud.create(db, obj_in=classroom_in)


@router.put("/{classroom_id}", response_model=Classroom)
def update_classroom(
    *,
    db: Session = Depends(get_db),
    classroom_id: int,
    classroom_in: ClassroomUpdate,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza uma sala (Apenas Admin).
    """
    classroom = classroom_crud.get(db, id=classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    return classroom_crud.update(db, db_obj=classroom, obj_in=classroom_in)


@router.delete("/{classroom_id}", response_model=Classroom)
def delete_classroom(
    *,
    db: Session = Depends(get_db),
    classroom_id: int,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Remove uma sala (Apenas Admin).
    """
    classroom = classroom_crud.get(db, id=classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    return classroom_crud.remove(db, id=classroom_id)
