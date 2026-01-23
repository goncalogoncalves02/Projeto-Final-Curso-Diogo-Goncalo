from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.course import Course as CourseModel
from app.schemas.course import Course, CourseCreate, CourseUpdate
from app.api import deps

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
