"""
Router de Geração Automática de Horários
-----------------------------------------
Endpoints para pré-visualizar e gerar horários automáticos.
Acesso restrito a Admin e Secretaria.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.services.schedule_generator import generate_schedule

router = APIRouter()


@router.post("/{course_id}/preview")
async def preview_schedule(
    course_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_or_secretaria),
):
    """
    Pré-visualiza a geração automática de horário para um curso.
    Não cria aulas na BD — mostra apenas o que seria gerado.
    """
    result = generate_schedule(db, course_id, dry_run=True)

    if not result.get("success"):
        raise HTTPException(
            status_code=400, detail=result.get("error", "Erro na geração")
        )

    return result


@router.post("/{course_id}/generate")
async def generate_schedule_endpoint(
    course_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_or_secretaria),
):
    """
    Gera automaticamente o horário de um curso e cria as aulas na BD.
    """
    result = generate_schedule(db, course_id, dry_run=False)

    if not result.get("success"):
        raise HTTPException(
            status_code=400, detail=result.get("error", "Erro na geração")
        )

    return result
