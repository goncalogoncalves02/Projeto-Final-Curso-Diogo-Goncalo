from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import math
from app.db.session import get_db
from app.schemas.course import Course, CourseCreate, CourseUpdate
from app.schemas.course_module import (
    CourseModule,
    CourseModuleCreate,
    CourseModuleUpdate,
)
from app.api import deps
from app.crud import course as course_crud
from app.crud import course_module as course_module_crud
from app.models.course import Course as CourseModel

router = APIRouter()


# ============== CRUD de Cursos ==============


@router.get("/")
def read_courses(
    q: Optional[str] = Query(None, min_length=2, description="Termo de pesquisa"),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista todos os cursos com paginação.
    """
    query = db.query(CourseModel)

    # Aplicar filtro de pesquisa se fornecido
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                CourseModel.name.ilike(search_term),
                CourseModel.area.ilike(search_term),
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


@router.post("/", response_model=Course)
def create_course(
    *,
    db: Session = Depends(get_db),
    course_in: CourseCreate,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Cria um novo curso (Apenas Admin).
    """
    return course_crud.create(db, obj_in=course_in)


@router.put("/{course_id}", response_model=Course)
def update_course(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    course_in: CourseUpdate,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza um curso (Apenas Admin).
    """
    course = course_crud.get(db, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course_crud.update(db, db_obj=course, obj_in=course_in)


@router.delete("/{course_id}", response_model=Course)
def delete_course(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Remove um curso (Apenas Admin).
    """
    course = course_crud.get(db, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course_crud.remove(db, id=course_id)


# ============== Sub-resources: Módulos do Curso ==============


@router.get("/{course_id}/modules", response_model=List[CourseModule])
def read_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista os módulos associados a este curso (Estrutura Curricular).
    """
    course = course_crud.get(db, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course_module_crud.get_by_course(db, course_id=course_id)


@router.post("/{course_id}/modules", response_model=CourseModule)
def add_module_to_course(
    course_id: int,
    course_module_in: CourseModuleCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Adiciona um módulo a um curso (define professor, sala, etc).
    """
    course = course_crud.get(db, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course_module_crud.create_for_course(
        db, course_id=course_id, obj_in=course_module_in
    )


@router.put("/{course_id}/modules/{module_id}", response_model=CourseModule)
def update_course_module(
    course_id: int,
    module_id: int,
    course_module_in: CourseModuleUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza um módulo no curso (professor, sala, ordem, etc).
    """
    course_module = course_module_crud.get_by_course_and_id(
        db, course_id=course_id, id=module_id
    )
    if not course_module:
        raise HTTPException(status_code=404, detail="Course module not found")

    return course_module_crud.update(db, db_obj=course_module, obj_in=course_module_in)


@router.delete("/{course_id}/modules/{module_id}", response_model=CourseModule)
def delete_course_module(
    course_id: int,
    module_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Remove um módulo de um curso.
    """
    course_module = course_module_crud.get_by_course_and_id(
        db, course_id=course_id, id=module_id
    )
    if not course_module:
        raise HTTPException(status_code=404, detail="Course module not found")

    return course_module_crud.remove(db, id=module_id)
