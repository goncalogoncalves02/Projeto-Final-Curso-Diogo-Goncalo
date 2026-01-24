from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.module_grade import ModuleGrade as ModuleGradeModel
from app.schemas import ModuleGrade, ModuleGradeCreate, ModuleGradeUpdate
from app.models.user import User

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
    query = db.query(ModuleGradeModel)

    if current_user.is_superuser:
        if enrollment_id:
            query = query.filter(ModuleGradeModel.enrollment_id == enrollment_id)
        if course_module_id:
            query = query.filter(ModuleGradeModel.course_module_id == course_module_id)
        return query.offset(skip).limit(limit).all()

    # Se for aluno, filtrar apenas pelas suas inscrições
    # Isso requer um join com Enrollment para verificar o user_id
    from app.models.enrollment import Enrollment

    return (
        query.join(Enrollment)
        .filter(Enrollment.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=ModuleGrade)
def create_module_grade(
    grade_in: ModuleGradeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(
        deps.get_current_active_superuser
    ),  # Apenas admin lança notas por enquanto
):
    """
    Lança uma nota para um aluno num módulo. (Admin Only)
    """
    # Verificar duplicados? Um aluno pode ter múltiplas notas num módulo?
    # Vamos assumir que sim (ex: teste 1, teste 2), ou se for nota final, apenas uma.
    # O modelo atual não especifica tipo de avaliação, portanto assumimos 1 nota final por módulo por agora.

    existing = (
        db.query(ModuleGradeModel)
        .filter(
            ModuleGradeModel.enrollment_id == grade_in.enrollment_id,
            ModuleGradeModel.course_module_id == grade_in.course_module_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Já existe uma nota lançada para este módulo e aluno. Atualize a existente.",
        )

    grade = ModuleGradeModel(**grade_in.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


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
    grade = db.query(ModuleGradeModel).filter(ModuleGradeModel.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Nota não encontrada")

    update_data = grade_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grade, field, value)

    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", response_model=ModuleGrade)
def delete_module_grade(
    grade_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Remove uma nota.
    """
    grade = db.query(ModuleGradeModel).filter(ModuleGradeModel.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Nota não encontrada")

    db.delete(grade)
    db.commit()
    return grade
