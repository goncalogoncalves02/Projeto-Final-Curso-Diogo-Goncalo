from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas import ModuleGrade, ModuleGradeCreate, ModuleGradeUpdate
from app.models.user import User
from app.crud import module_grade as module_grade_crud

router = APIRouter()


@router.get("/", response_model=List[ModuleGrade])
def read_module_grades(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    enrollment_id: int | None = None,
    course_module_id: int | None = None,
):
    """
    Lista notas.
    - Admin vê tudo ou filtra.
    - Aluno vê apenas as suas.
    """
    if current_user.is_superuser:
        return module_grade_crud.get_multi_filtered(
            db,
            enrollment_id=enrollment_id,
            course_module_id=course_module_id,
            skip=skip,
            limit=limit,
        )

    # Se for aluno, filtrar apenas pelas suas inscrições
    return module_grade_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/", response_model=ModuleGrade)
def create_module_grade(
    grade_in: ModuleGradeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Lança uma nota para um aluno num módulo. (Admin Only)
    """
    # Verificar duplicados
    existing = module_grade_crud.get_by_enrollment_and_module(
        db,
        enrollment_id=grade_in.enrollment_id,
        course_module_id=grade_in.course_module_id,
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Já existe uma nota lançada para este módulo e aluno. Atualize a existente.",
        )

    return module_grade_crud.create(db, obj_in=grade_in)


@router.put("/{grade_id}", response_model=ModuleGrade)
def update_module_grade(
    grade_id: int,
    grade_in: ModuleGradeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza uma nota existente.
    """
    grade = module_grade_crud.get(db, id=grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Nota não encontrada")

    return module_grade_crud.update(db, db_obj=grade, obj_in=grade_in)


@router.delete("/{grade_id}", response_model=ModuleGrade)
def delete_module_grade(
    grade_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Remove uma nota.
    """
    grade = module_grade_crud.get(db, id=grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Nota não encontrada")

    return module_grade_crud.remove(db, id=grade_id)
