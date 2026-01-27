"""
Router de Estatísticas
----------------------
Endpoint para obter métricas agregadas do sistema para o Dashboard.
"""

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api import deps
from app.models.course import Course as CourseModel, CourseStatus
from app.models.enrollment import Enrollment as EnrollmentModel, EnrollmentStatus
from app.models.course_module import CourseModule as CourseModuleModel
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Retorna estatísticas agregadas do sistema (Apenas Admin).

    i. Total de cursos terminados
    ii. Total de cursos a decorrer
    iii. Total de formandos a frequentar cursos no atual momento
    iv. Nº de cursos por área
    v. Top 10 de formadores com maior nº de horas lecionadas
    """

    # i. Total de cursos terminados
    courses_finished = (
        db.query(CourseModel)
        .filter(CourseModel.status == CourseStatus.finished)
        .count()
    )

    # ii. Total de cursos a decorrer (ativos)
    courses_active = (
        db.query(CourseModel).filter(CourseModel.status == CourseStatus.active).count()
    )

    # iii. Total de formandos ativos (inscrições ativas)
    students_active = (
        db.query(EnrollmentModel)
        .filter(EnrollmentModel.status == EnrollmentStatus.active)
        .count()
    )

    # iv. Nº de cursos por área
    courses_by_area_query = (
        db.query(CourseModel.area, func.count(CourseModel.id).label("count"))
        .group_by(CourseModel.area)
        .all()
    )

    courses_by_area = {row.area: row.count for row in courses_by_area_query}

    # v. Top 10 de formadores com maior nº de horas lecionadas
    top_trainers_query = (
        db.query(
            UserModel.id,
            UserModel.full_name,
            UserModel.email,
            func.sum(CourseModuleModel.total_hours).label("total_hours"),
        )
        .join(CourseModuleModel, CourseModuleModel.trainer_id == UserModel.id)
        .group_by(UserModel.id, UserModel.full_name, UserModel.email)
        .order_by(func.sum(CourseModuleModel.total_hours).desc())
        .limit(10)
        .all()
    )

    top_trainers = [
        {
            "id": row.id,
            "name": row.full_name or row.email,
            "hours": row.total_hours or 0,
        }
        for row in top_trainers_query
    ]

    return {
        "courses_finished": courses_finished,
        "courses_active": courses_active,
        "students_active": students_active,
        "courses_by_area": courses_by_area,
        "top_trainers": top_trainers,
    }
