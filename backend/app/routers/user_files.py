"""
Router para gestão de ficheiros de utilizadores
------------------------------------------------
Endpoints para upload, listagem, download e eliminação de ficheiros.
"""

import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api import deps
from app.models.user_files import UserFile as UserFileModel
from app.models.user import User
from app.schemas.user_file import UserFile

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
    files = db.query(UserFileModel).filter(UserFileModel.user_id == user_id).all()
    return files


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
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # Criar pasta do utilizador se não existir
    user_folder = os.path.join(UPLOAD_DIR, str(user_id))
    os.makedirs(user_folder, exist_ok=True)

    # Gerar nome único para evitar colisões
    import uuid

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

    # Criar registo na BD
    db_file = UserFileModel(
        user_id=user_id,
        filename=file.filename,
        file_path=f"uploads/users/{user_id}/{unique_filename}",
        file_type=file.content_type or file_ext.lstrip("."),
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


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
    db_file = (
        db.query(UserFileModel)
        .filter(UserFileModel.id == file_id, UserFileModel.user_id == user_id)
        .first()
    )

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
    db_file = (
        db.query(UserFileModel)
        .filter(UserFileModel.id == file_id, UserFileModel.user_id == user_id)
        .first()
    )

    if not db_file:
        raise HTTPException(status_code=404, detail="Ficheiro não encontrado")

    # Eliminar ficheiro físico
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), db_file.file_path
    )
    if os.path.exists(file_path):
        os.remove(file_path)

    # Eliminar registo da BD
    db.delete(db_file)
    db.commit()

    return db_file
