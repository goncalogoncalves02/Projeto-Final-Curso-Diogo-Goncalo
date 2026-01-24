from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.course import Course as CourseModel
from app.schemas.course import Course, CourseCreate, CourseUpdate
from app.api import deps
from app.models.course_module import CourseModule as CourseModuleModel
from app.schemas.course_module import CourseModule, CourseModuleCreate

router = APIRouter()


@router.get("/", response_model=List[Course])
def read_courses(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista todos os cursos.
    """
    courses = db.query(CourseModel).offset(skip).limit(limit).all()
    return courses


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
    course = CourseModel(
        name=course_in.name,
        area=course_in.area,
        description=course_in.description,
        start_date=course_in.start_date,
        end_date=course_in.end_date,
        status=course_in.status,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


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
    course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    db.add(course)
    db.commit()
    db.refresh(course)
    return course


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
    course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return course
    return course


# Sub-resources: Modules within a Course


@router.get("/{course_id}/modules", response_model=List[CourseModule])
def read_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista os módulos associados a este curso (Estrutura Curricular).
    """
    course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course.modules


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
    course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Verificar se já existe este módulo neste curso?
    # Pode haver repetido (ex: Módulo X - Parte 1, Módulo X - Parte 2)?
    # Por agora, permitimos duplicados, mas talvez o ideal fosse avisar.

    course_module = CourseModuleModel(
        course_id=course_id,
        module_id=course_module_in.module_id,
        trainer_id=course_module_in.trainer_id,
        classroom_id=course_module_in.classroom_id,
        order=course_module_in.order,
        total_hours=course_module_in.total_hours,
    )
    db.add(course_module)
    db.commit()
    db.refresh(course_module)
    return course_module
