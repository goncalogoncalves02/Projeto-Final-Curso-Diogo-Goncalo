from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
import math
import os
import uuid
from app.api import deps
from app.crud import user as user_crud
from app.schemas import user as user_schema
from app.models.user import User

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars"
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
def read_users(
    q: Optional[str] = Query(None, min_length=2, description="Termo de pesquisa"),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Lista todos os utilizadores com paginação (Apenas Admin).
    """
    query = db.query(User)

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


@router.post("/me/avatar", response_model=user_schema.User)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Upload de foto de perfil do utilizador autenticado.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Tipo de ficheiro não permitido. Use JPEG, PNG, GIF ou WebP.",
        )

    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Ficheiro demasiado grande. Máximo 5MB.",
        )

    # Criar pasta do utilizador
    user_folder = os.path.join(UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_folder, exist_ok=True)

    # Apagar avatar anterior se existir
    if current_user.avatar_url:
        old_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            current_user.avatar_url.lstrip("/"),
        )
        if os.path.exists(old_path):
            os.remove(old_path)

    # Guardar novo avatar com nome UUID
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(user_folder, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # Atualizar avatar_url na BD
    avatar_url = f"uploads/avatars/{current_user.id}/{unique_filename}"
    current_user.avatar_url = avatar_url
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return current_user


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
