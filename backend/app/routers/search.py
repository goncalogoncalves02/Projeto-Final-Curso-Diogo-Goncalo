"""
Router de Pesquisa - Admin e Secretaria
Permite pesquisar cursos, estudantes e formadores.
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.api import deps
from app.models.user import User
from app.models.course import Course
from app.schemas.user import User as UserSchema
from app.schemas.course import Course as CourseSchema

router = APIRouter()


@router.get("/courses", response_model=List[CourseSchema])
def search_courses(
    q: str = Query(..., min_length=2, description="Termo de pesquisa"),
    limit: int = Query(20, ge=1, le=100, description="Máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Pesquisa cursos por nome ou área.
    Apenas Admin e Secretaria.
    """
    search_term = f"%{q}%"
    courses = (
        db.query(Course)
        .filter(
            or_(
                Course.name.ilike(search_term),
                Course.area.ilike(search_term),
            )
        )
        .limit(limit)
        .all()
    )
    return courses


@router.get("/students", response_model=List[UserSchema])
def search_students(
    q: str = Query(..., min_length=2, description="Termo de pesquisa"),
    limit: int = Query(20, ge=1, le=100, description="Máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Pesquisa estudantes por nome ou email.
    Apenas Admin e Secretaria.
    """
    search_term = f"%{q}%"
    students = (
        db.query(User)
        .filter(
            User.role == "estudante",
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
            ),
        )
        .limit(limit)
        .all()
    )
    return students


@router.get("/trainers", response_model=List[UserSchema])
def search_trainers(
    q: str = Query(..., min_length=2, description="Termo de pesquisa"),
    limit: int = Query(20, ge=1, le=100, description="Máximo de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Pesquisa formadores por nome ou email.
    Apenas Admin e Secretaria.
    """
    search_term = f"%{q}%"
    trainers = (
        db.query(User)
        .filter(
            User.role == "professor",
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
            ),
        )
        .limit(limit)
        .all()
    )
    return trainers
