"""
Router para gestão de ficheiros de utilizadores
------------------------------------------------
Endpoints para upload, listagem, download e eliminação de ficheiros.
"""

import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api import deps
from app.models.user import User
from app.schemas.user_file import UserFile
from app.crud import user_file as user_file_crud
from app.crud import user as user_crud

router = APIRouter()

# Pasta base para uploads
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "users"
)


@router.get("/{user_id}/files", response_model=List[UserFile])
def list_user_files(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Lista todos os ficheiros de um utilizador. (Admin Only)
    """
    return user_file_crud.get_by_user(db, user_id=user_id)


@router.post("/{user_id}/files", response_model=UserFile)
async def upload_user_file(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Faz upload de um ficheiro para o utilizador. (Admin Only)
    """
    # Verificar se utilizador existe
    user = user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # Criar pasta do utilizador se não existir
    user_folder = os.path.join(UPLOAD_DIR, str(user_id))
    os.makedirs(user_folder, exist_ok=True)

    # Gerar nome único para evitar colisões
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(user_folder, unique_filename)

    # Guardar ficheiro
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao guardar ficheiro: {str(e)}"
        )

    # Criar registo na BD usando o CRUD
    return user_file_crud.create_for_user(
        db,
        user_id=user_id,
        filename=file.filename,
        file_path=f"uploads/users/{user_id}/{unique_filename}",
        file_type=file.content_type or file_ext.lstrip("."),
    )


@router.get("/{user_id}/files/{file_id}/download")
def download_user_file(
    user_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Download de um ficheiro. (Admin Only)
    """
    db_file = user_file_crud.get_by_user_and_id(db, user_id=user_id, file_id=file_id)

    if not db_file:
        raise HTTPException(status_code=404, detail="Ficheiro não encontrado")

    # Construir caminho absoluto
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), db_file.file_path
    )

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404, detail="Ficheiro não encontrado no servidor"
        )

    return FileResponse(
        path=file_path,
        filename=db_file.filename,
        media_type=db_file.file_type or "application/octet-stream",
    )


@router.delete("/{user_id}/files/{file_id}", response_model=UserFile)
def delete_user_file(
    user_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """
    Elimina um ficheiro do utilizador. (Admin Only)
    """
    db_file = user_file_crud.get_by_user_and_id(db, user_id=user_id, file_id=file_id)

    if not db_file:
        raise HTTPException(status_code=404, detail="Ficheiro não encontrado")

    # Eliminar ficheiro físico
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), db_file.file_path
    )
    if os.path.exists(file_path):
        os.remove(file_path)

    # Eliminar registo da BD usando o CRUD
    return user_file_crud.remove(db, id=file_id)
