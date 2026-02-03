"""
Router de Estatísticas
----------------------
Endpoint para obter métricas agregadas do sistema para o Dashboard.
"""

from typing import Any
from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api import deps
from app.models.course import Course as CourseModel, CourseStatus
from app.models.enrollment import Enrollment as EnrollmentModel, EnrollmentStatus
from app.models.course_module import CourseModule as CourseModuleModel
from app.models.lesson import Lesson as LessonModel
from app.models.user import User as UserModel

router = APIRouter()


def calculate_lesson_duration_hours(start_time: time, end_time: time) -> float:
    """Calcula a duração de uma aula em horas."""
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)
    duration = (end_dt - start_dt).total_seconds() / 3600
    return round(duration, 2)


@router.get("/")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Retorna estatísticas agregadas do sistema (Admin e Secretaria).

    i. Total de cursos terminados
    ii. Total de cursos a decorrer
    iii. Total de formandos a frequentar cursos no atual momento
    iv. Nº de cursos por área
    v. Top 10 de professores com maior nº de horas lecionadas (HORAS REAIS - aulas já dadas)
    vi. Lista de cursos a decorrer (detalhes)
    vii. Lista de cursos a iniciar nos próximos 60 dias
    """

    today = date.today()

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

    # iii. Total de formandos ativos (utilizadores únicos com role='estudante' e inscrições ativas)
    students_active = (
        db.query(func.count(func.distinct(EnrollmentModel.user_id)))
        .join(UserModel, EnrollmentModel.user_id == UserModel.id)
        .filter(
            EnrollmentModel.status == EnrollmentStatus.active,
            UserModel.role == "estudante",
        )
        .scalar()
    )

    # iv. Nº de cursos por área
    courses_by_area_query = (
        db.query(CourseModel.area, func.count(CourseModel.id).label("count"))
        .group_by(CourseModel.area)
        .all()
    )

    courses_by_area = {row.area: row.count for row in courses_by_area_query}

    # v. Top 10 de professores com maior nº de horas REALMENTE lecionadas
    # Agora calculamos com base nas aulas (lessons) que já aconteceram (date <= hoje)

    # Obter todas as aulas passadas com os dados do módulo
    past_lessons = (
        db.query(LessonModel, CourseModuleModel)
        .join(CourseModuleModel, LessonModel.course_module_id == CourseModuleModel.id)
        .filter(LessonModel.date <= today)
        .all()
    )

    # Calcular horas por professor
    trainer_hours = {}
    for lesson, course_module in past_lessons:
        trainer_id = course_module.trainer_id
        hours = calculate_lesson_duration_hours(lesson.start_time, lesson.end_time)

        if trainer_id not in trainer_hours:
            trainer_hours[trainer_id] = 0.0
        trainer_hours[trainer_id] += hours

    # Obter dados dos professores e ordenar
    top_trainers = []
    if trainer_hours:
        trainer_ids = list(trainer_hours.keys())
        trainers = db.query(UserModel).filter(UserModel.id.in_(trainer_ids)).all()
        trainer_map = {t.id: t for t in trainers}

        sorted_trainers = sorted(
            trainer_hours.items(), key=lambda x: x[1], reverse=True
        )[:10]

        for trainer_id, hours in sorted_trainers:
            trainer = trainer_map.get(trainer_id)
            if trainer:
                top_trainers.append(
                    {
                        "id": trainer_id,
                        "name": trainer.full_name or trainer.email,
                        "hours": round(hours, 1),
                    }
                )

    # vi. Lista de cursos a decorrer (detalhes)
    courses_running = (
        db.query(CourseModel)
        .filter(CourseModel.status == CourseStatus.active)
        .order_by(CourseModel.start_date.desc())
        .all()
    )

    courses_running_list = [
        {
            "id": c.id,
            "name": c.name,
            "area": c.area,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
        }
        for c in courses_running
    ]

    # vii. Lista de cursos a iniciar nos próximos 60 dias
    sixty_days_later = today + timedelta(days=60)
    courses_starting_soon = (
        db.query(CourseModel)
        .filter(
            CourseModel.status == CourseStatus.planned,
            CourseModel.start_date >= today,
            CourseModel.start_date <= sixty_days_later,
        )
        .order_by(CourseModel.start_date.asc())
        .all()
    )

    courses_starting_soon_list = [
        {
            "id": c.id,
            "name": c.name,
            "area": c.area,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "days_until_start": (c.start_date - today).days if c.start_date else None,
        }
        for c in courses_starting_soon
    ]

    return {
        "courses_finished": courses_finished,
        "courses_active": courses_active,
        "students_active": students_active,
        "courses_by_area": courses_by_area,
        "top_trainers": top_trainers,
        "courses_running": courses_running_list,
        "courses_starting_soon": courses_starting_soon_list,
    }
