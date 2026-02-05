from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import math
from app.db.session import get_db
from app.schemas.module import Module, ModuleCreate, ModuleUpdate
from app.api import deps
from app.crud import module as module_crud
from app.models.module import Module as ModuleModel

router = APIRouter()


@router.get("/")
def read_modules(
    q: Optional[str] = Query(None, min_length=2, description="Termo de pesquisa"),
    page: int = Query(1, ge=1, description="Página atual"),
    limit: int = Query(20, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """
    Lista todos os módulos com paginação.
    """
    query = db.query(ModuleModel)

    # Aplicar filtro de pesquisa se fornecido
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                ModuleModel.name.ilike(search_term),
                ModuleModel.area.ilike(search_term),
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
