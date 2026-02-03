"""
Router de Pesquisa - Admin e Secretaria
Permite pesquisar cursos, estudantes e professores com paginação.
"""

from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from pydantic import BaseModel
import math

from app.db.session import get_db
from app.api import deps
from app.models.user import User
from app.models.course import Course
from app.schemas.user import User as UserSchema
from app.schemas.course import Course as CourseSchema

router = APIRouter()


# Schema para resposta paginada
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    pages: int
    limit: int


@router.get("/courses")
def search_courses(
    q: Optional[str] = Query(
        None, min_length=2, description="Termo de pesquisa (opcional)"
    ),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Lista/Pesquisa cursos com paginação.
    Apenas Admin e Secretaria.
    """
    query = db.query(Course)

    # Aplicar filtro de pesquisa se fornecido
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Course.name.ilike(search_term),
                Course.area.ilike(search_term),
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


@router.get("/students")
def search_students(
    q: Optional[str] = Query(
        None, min_length=2, description="Termo de pesquisa (opcional)"
    ),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Lista/Pesquisa estudantes com paginação.
    Apenas Admin e Secretaria.
    """
    query = db.query(User).filter(User.role == "estudante")

    # Aplicar filtro de pesquisa se fornecido
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
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


@router.get("/trainers")
def search_trainers(
    q: Optional[str] = Query(
        None, min_length=2, description="Termo de pesquisa (opcional)"
    ),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Lista/Pesquisa professores com paginação.
    Apenas Admin e Secretaria.
    """
    query = db.query(User).filter(User.role == "professor")

    # Aplicar filtro de pesquisa se fornecido
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
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
