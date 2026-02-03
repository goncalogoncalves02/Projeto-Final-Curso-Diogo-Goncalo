from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas import Enrollment, EnrollmentCreate, EnrollmentUpdate
from app.models.user import User
from app.crud import enrollment as enrollment_crud

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
        return enrollment_crud.get_multi_filtered(
            db, course_id=course_id, user_id=user_id, skip=skip, limit=limit
        )

    # Se não for admin, retorna apenas as suas
    return enrollment_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/", response_model=Enrollment)
def create_enrollment(
    enrollment_in: EnrollmentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Inscreve um aluno num curso. (Admin Only)
    """
    # Verificar se já existe inscrição
    existing = enrollment_crud.get_by_user_and_course(
        db, user_id=enrollment_in.user_id, course_id=enrollment_in.course_id
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="O aluno já está inscrito neste curso."
        )

    return enrollment_crud.create(db, obj_in=enrollment_in)


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
    enrollment = enrollment_crud.get(db, id=enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada")

    return enrollment_crud.update(db, db_obj=enrollment, obj_in=enrollment_in)


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
    enrollment = enrollment_crud.get(db, id=enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada")

    enrollment_crud.remove(db, id=enrollment_id)
    return {"message": "Inscrição removida com sucesso", "id": enrollment_id}
