from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.module import Module as ModuleModel
from app.schemas.module import Module, ModuleCreate, ModuleUpdate
from app.api import deps

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
    modules = db.query(ModuleModel).offset(skip).limit(limit).all()
    return modules


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
    module = ModuleModel(
        name=module_in.name,
        area=module_in.area,
        default_duration_hours=module_in.default_duration_hours,
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


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
    module = db.query(ModuleModel).filter(ModuleModel.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    update_data = module_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)

    db.add(module)
    db.commit()
    db.refresh(module)
    return module


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
    module = db.query(ModuleModel).filter(ModuleModel.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(module)
    db.commit()
    return module
