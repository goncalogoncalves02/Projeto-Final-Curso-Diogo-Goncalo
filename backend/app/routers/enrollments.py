from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.enrollment import Enrollment as EnrollmentModel
from app.schemas import Enrollment, EnrollmentCreate, EnrollmentUpdate
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Enrollment])
def read_enrollments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    course_id: int | None = None,
    user_id: int | None = None,
):
    """
    Lista inscrições.
    - Admin pode ver tudo ou filtrar por course_id e user_id.
    - Estudantes veem apenas as suas.
    """
    if current_user.is_superuser:
        query = db.query(EnrollmentModel)
        if course_id:
            query = query.filter(EnrollmentModel.course_id == course_id)
        if user_id:
            query = query.filter(EnrollmentModel.user_id == user_id)
        return query.offset(skip).limit(limit).all()

    # Se não for admin, retorna apenas as suas (se for estudante)
    # Se for professor... depende da lógica de negócio. Por agora, professor vê participações nos SEUS módulos?
    # Para simplificar, assumimos que apenas Admins gerem isto globalmente, e alunos veem o seu.
    return (
        db.query(EnrollmentModel)
        .filter(EnrollmentModel.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=Enrollment)
def create_enrollment(
    enrollment_in: EnrollmentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(
        deps.get_current_active_superuser
    ),  # Apenas admin pode inscrever
):
    """
    Inscreve um aluno num curso. (Admin Only)
    """
    # Verificar se já existe inscrição
    existing = (
        db.query(EnrollmentModel)
        .filter(
            EnrollmentModel.user_id == enrollment_in.user_id,
            EnrollmentModel.course_id == enrollment_in.course_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="O aluno já está inscrito neste curso."
        )

    enrollment = EnrollmentModel(**enrollment_in.model_dump())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.put("/{enrollment_id}", response_model=Enrollment)
def update_enrollment(
    enrollment_id: int,
    enrollment_in: EnrollmentUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza estado ou nota final de uma inscrição.
    """
    enrollment = (
        db.query(EnrollmentModel).filter(EnrollmentModel.id == enrollment_id).first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada")

    update_data = enrollment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(enrollment, field, value)

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete("/{enrollment_id}")
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Remove uma inscrição (Cuidado: apaga histórico).
    Talvez seja melhor apenas mudar o estado para 'dropped'.
    """
    enrollment = (
        db.query(EnrollmentModel).filter(EnrollmentModel.id == enrollment_id).first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada")

    db.delete(enrollment)
    db.commit()
    return {"message": "Inscrição removida com sucesso", "id": enrollment_id}
