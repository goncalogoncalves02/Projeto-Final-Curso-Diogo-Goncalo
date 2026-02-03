"""
Serviço de Atualização Automática de Status dos Cursos
------------------------------------------------------
Verifica periodicamente os cursos e atualiza o status baseado nas datas:
- planned -> active: quando start_date <= hoje < end_date
- active/planned -> finished: quando end_date <= hoje

Cursos com status 'cancelled' não são alterados automaticamente.
"""

import asyncio
import logging
from datetime import date
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.course import Course, CourseStatus

logger = logging.getLogger(__name__)


def update_course_statuses(db: Session) -> dict:
    """
    Atualiza status dos cursos baseado nas datas.
    Retorna contagem de cursos atualizados.
    """
    today = date.today()
    updated = {"to_active": 0, "to_finished": 0}

    # Planned -> Active (início chegou, mas ainda não terminou)
    planned_to_active = (
        db.query(Course)
        .filter(
            Course.status == CourseStatus.planned,
            Course.start_date <= today,
            Course.end_date > today,
        )
        .all()
    )

    for course in planned_to_active:
        course.status = CourseStatus.active
        updated["to_active"] += 1
        logger.info(f"Curso '{course.name}' (ID:{course.id}) -> ACTIVE")

    # Active/Planned -> Finished (fim chegou)
    to_finished = (
        db.query(Course)
        .filter(
            Course.status.in_([CourseStatus.active, CourseStatus.planned]),
            Course.end_date <= today,
        )
        .all()
    )

    for course in to_finished:
        course.status = CourseStatus.finished
        updated["to_finished"] += 1
        logger.info(f"Curso '{course.name}' (ID:{course.id}) -> FINISHED")

    db.commit()
    return updated


async def course_status_scheduler(interval_minutes: int = 60):
    """
    Loop assíncrono que verifica status dos cursos periodicamente.

    Args:
        interval_minutes: Intervalo entre verificações (default: 60 minutos)
    """
    logger.info(
        f"Course status scheduler iniciado (intervalo: {interval_minutes} minutos)"
    )

    while True:
        try:
            db = SessionLocal()
            result = update_course_statuses(db)

            if result["to_active"] or result["to_finished"]:
                logger.info(
                    f"Status de cursos atualizado: "
                    f"{result['to_active']} -> active, "
                    f"{result['to_finished']} -> finished"
                )
            db.close()
        except Exception as e:
            logger.error(f"Erro ao atualizar status dos cursos: {e}")

        # Aguardar até próxima verificação
        await asyncio.sleep(interval_minutes * 60)
