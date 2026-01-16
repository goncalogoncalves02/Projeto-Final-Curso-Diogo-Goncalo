from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import user as user_crud
from app.schemas import user as user_schema
from app.models.user import User

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[user_schema.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Lista todos os utilizadores (Apenas Admin).
    """
    users = user_crud.get_users(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=user_schema.User)
def create_user(
    user_in: user_schema.UserCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Cria novo utilizador (Apenas Admin).
    """
    user = user_crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email já registado.")
    user = user_crud.create_user(db, user=user_in)
    return user


@router.put("/me", response_model=user_schema.User)
def update_user_me(
    user_in: user_schema.UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Atualiza o próprio perfil.
    """
    # Impedir que o utilizador altere o seu próprio role ou permissões
    if user_in.role or user_in.is_superuser or user_in.is_active is not None:
        # Podes levantar erro ou simplesmente ignorar. Vamos ignorar por segurança/simplicidade.
        # Mas para garantir, forçamos os valores a None antes do update
        user_in.role = None
        user_in.is_superuser = None
        user_in.is_active = None

    user = user_crud.update_user(db, db_user=current_user, user_in=user_in)
    return user


@router.get("/{user_id}", response_model=user_schema.User)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Obtém detalhe de um utilizador (Apenas Admin).
    """
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    return user


@router.put("/{user_id}", response_model=user_schema.User)
def update_user(
    user_id: int,
    user_in: user_schema.UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza um utilizador (Apenas Admin).
    """
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    user = user_crud.update_user(db, db_user=user, user_in=user_in)
    return user


@router.delete("/{user_id}", response_model=user_schema.User)
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Remove um utilizador (Apenas Admin).
    """
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    user = user_crud.delete_user(db, user_id=user_id)
    return user
