from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import math
from app.db.session import get_db
from app.schemas.classroom import Classroom, ClassroomCreate, ClassroomUpdate
from app.api import deps
from app.crud import classroom as classroom_crud
from app.models.classroom import Classroom as ClassroomModel

router = APIRouter()


@router.get("/")
def read_classrooms(
    q: Optional[str] = Query(None, min_length=2, description="Termo de pesquisa"),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista todas as salas com paginação.
    """
    query = db.query(ClassroomModel)

    # Aplicar filtro de pesquisa se fornecido
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                ClassroomModel.name.ilike(search_term),
                ClassroomModel.type.ilike(search_term),
            )
        )

    # Contar total
    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1

    # Aplicar paginação
    skip = (page - 1) * limit
    items = query.offset(skip).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit,
    }


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
