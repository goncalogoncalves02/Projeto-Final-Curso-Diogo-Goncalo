from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.classroom import Classroom as ClassroomModel
from app.schemas.classroom import Classroom, ClassroomCreate, ClassroomUpdate
from app.api import deps

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
    classrooms = db.query(ClassroomModel).offset(skip).limit(limit).all()
    return classrooms


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
    classroom = ClassroomModel(
        name=classroom_in.name,
        type=classroom_in.type,
        capacity=classroom_in.capacity,
        is_available=classroom_in.is_available,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


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
    classroom = (
        db.query(ClassroomModel).filter(ClassroomModel.id == classroom_id).first()
    )
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    update_data = classroom_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(classroom, field, value)

    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


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
    classroom = (
        db.query(ClassroomModel).filter(ClassroomModel.id == classroom_id).first()
    )
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    db.delete(classroom)
    db.commit()
    return classroom
