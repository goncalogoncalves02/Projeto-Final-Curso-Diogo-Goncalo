from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.module import Module, ModuleCreate, ModuleUpdate
from app.api import deps
from app.crud import module as module_crud

router = APIRouter()


@router.get("/", response_model=List[Module])
def read_modules(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista todos os módulos (biblioteca de UCs).
    """
    return module_crud.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=Module)
def create_module(
    *,
    db: Session = Depends(get_db),
    module_in: ModuleCreate,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Cria um novo módulo (Apenas Admin).
    """
    return module_crud.create(db, obj_in=module_in)


@router.put("/{module_id}", response_model=Module)
def update_module(
    *,
    db: Session = Depends(get_db),
    module_id: int,
    module_in: ModuleUpdate,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Atualiza um módulo (Apenas Admin).
    """
    module = module_crud.get(db, id=module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return module_crud.update(db, db_obj=module, obj_in=module_in)


@router.delete("/{module_id}", response_model=Module)
def delete_module(
    *,
    db: Session = Depends(get_db),
    module_id: int,
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Remove um módulo (Apenas Admin).
    """
    module = module_crud.get(db, id=module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return module_crud.remove(db, id=module_id)
