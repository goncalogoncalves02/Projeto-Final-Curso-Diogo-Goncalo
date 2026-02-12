"""
Serviço de Geração Automática de Horários
==========================================
Gera automaticamente o horário completo de um curso, respeitando:
- Sequência dos módulos (com paralelismo quando possível)
- Disponibilidade dos professores
- Conflitos de sala e professor
- Limites de horas por módulo
"""

from datetime import date, time, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.models.course import Course, ScheduleType
from app.models.course_module import CourseModule
from app.models.lesson import Lesson
from app.models.classroom import Classroom
from app.models.trainer_availability import TrainerAvailability


# ============================================
# CONFIGURAÇÃO DE BLOCOS HORÁRIOS
# ============================================

SCHEDULE_BLOCKS = {
    ScheduleType.day: [
        (time(8, 0), time(11, 0)),  # Manhã: 08:00-11:00
        (time(12, 0), time(15, 0)),  # Tarde: 12:00-15:00
    ],
    ScheduleType.night: [
        (time(16, 0), time(19, 0)),  # Início: 16:00-19:00
        (time(20, 0), time(23, 0)),  # Noite: 20:00-23:00
    ],
}

BLOCK_DURATION_HOURS = 3  # Cada bloco = 3 horas


# ============================================
# FUNÇÕES AUXILIARES
# ============================================


def _get_weekday_iso(d: date) -> int:
    """Retorna o dia da semana ISO (1=Segunda ... 7=Domingo)."""
    return d.isoweekday()


def _to_sql_day_of_week(iso_day: int) -> int:
    """
    Converte dia ISO (1=Seg...7=Dom) para o formato da BD (1=Dom, 2=Seg...7=Sáb).
    """
    # ISO: 1=Mon...7=Sun  ->  DB: 1=Sun, 2=Mon...7=Sat
    if iso_day == 7:
        return 1  # Domingo
    return iso_day + 1


def _time_overlaps(s1: time, e1: time, s2: time, e2: time) -> bool:
    """Verifica se dois intervalos de tempo se sobrepõem."""
    return s1 < e2 and s2 < e1


def _calculate_hours(start: time, end: time) -> float:
    """Calcula duração em horas entre dois tempos."""
    start_minutes = start.hour * 60 + start.minute
    end_minutes = end.hour * 60 + end.minute
    return (end_minutes - start_minutes) / 60


# ============================================
# VERIFICAÇÕES DE DISPONIBILIDADE E CONFLITO
# ============================================


def _is_trainer_available(
    db: Session,
    trainer_id: int,
    lesson_date: date,
    start_time: time,
    end_time: time,
) -> bool:
    """
    Verifica se o professor tem disponibilidade registada que cobre o bloco.
    Se o professor não tem nenhuma disponibilidade registada, assume disponível.
    """
    # Verificar se existem disponibilidades para este professor
    all_avails = (
        db.query(TrainerAvailability)
        .filter(TrainerAvailability.trainer_id == trainer_id)
        .all()
    )

    # Se não tem nenhuma disponibilidade registada, assume disponível
    if not all_avails:
        return True

    sql_day = _to_sql_day_of_week(_get_weekday_iso(lesson_date))

    # 1. Verificar disponibilidade para data específica
    specific_avails = (
        db.query(TrainerAvailability)
        .filter(
            TrainerAvailability.trainer_id == trainer_id,
            TrainerAvailability.specific_date == lesson_date,
        )
        .all()
    )
    if specific_avails:
        # Se tem disponibilidade específica para esta data, usar essa
        for avail in specific_avails:
            if avail.start_time <= start_time and avail.end_time >= end_time:
                return True
        return False

    # 2. Verificar disponibilidade recorrente (dia da semana)
    recurring_avails = (
        db.query(TrainerAvailability)
        .filter(
            TrainerAvailability.trainer_id == trainer_id,
            TrainerAvailability.day_of_week == sql_day,
            TrainerAvailability.is_recurring.is_(True),
        )
        .all()
    )
    for avail in recurring_avails:
        if avail.start_time <= start_time and avail.end_time >= end_time:
            return True

    return False


def _has_trainer_conflict(
    db: Session,
    trainer_id: int,
    lesson_date: date,
    start_time: time,
    end_time: time,
    generated_lessons: List[Dict],
) -> bool:
    """
    Verifica se o professor já tem aula nesse horário
    (nas aulas existentes na BD + nas aulas já geradas nesta execução).
    """
    # 1. Verificar na BD
    existing = (
        db.query(Lesson)
        .join(CourseModule, Lesson.course_module_id == CourseModule.id)
        .filter(
            Lesson.date == lesson_date,
            CourseModule.trainer_id == trainer_id,
        )
        .all()
    )
    for lesson in existing:
        if _time_overlaps(start_time, end_time, lesson.start_time, lesson.end_time):
            return True

    # 2. Verificar nas aulas já geradas nesta execução
    for gen in generated_lessons:
        if (
            gen["trainer_id"] == trainer_id
            and gen["date"] == lesson_date
            and _time_overlaps(start_time, end_time, gen["start_time"], gen["end_time"])
        ):
            return True

    return False


def _has_classroom_conflict(
    db: Session,
    classroom_id: int,
    lesson_date: date,
    start_time: time,
    end_time: time,
    generated_lessons: List[Dict],
) -> bool:
    """
    Verifica se a sala já tem aula nesse horário
    (na BD + aulas geradas nesta execução).
    """
    if not classroom_id:
        return False

    # 1. Verificar na BD
    existing = (
        db.query(Lesson)
        .filter(
            Lesson.date == lesson_date,
            Lesson.classroom_id == classroom_id,
        )
        .all()
    )
    for lesson in existing:
        if _time_overlaps(start_time, end_time, lesson.start_time, lesson.end_time):
            return True

    # 2. Verificar nas aulas geradas
    for gen in generated_lessons:
        if (
            gen["classroom_id"] == classroom_id
            and gen["date"] == lesson_date
            and _time_overlaps(start_time, end_time, gen["start_time"], gen["end_time"])
        ):
            return True

    return False


def _is_course_block_occupied(
    db: Session,
    course_id: int,
    lesson_date: date,
    start_time: time,
    end_time: time,
    generated_lessons: List[Dict],
) -> bool:
    """
    Verifica se a turma (curso) já tem aula nesse bloco horário.
    Previne que a turma tenha 2 aulas no mesmo horário.
    """
    # 1. Verificar na BD — aulas existentes do mesmo curso
    existing = (
        db.query(Lesson)
        .join(CourseModule, Lesson.course_module_id == CourseModule.id)
        .filter(
            CourseModule.course_id == course_id,
            Lesson.date == lesson_date,
        )
        .all()
    )
    for lesson in existing:
        if _time_overlaps(start_time, end_time, lesson.start_time, lesson.end_time):
            return True

    # 2. Verificar nas aulas geradas
    for gen in generated_lessons:
        if (
            gen["course_id"] == course_id
            and gen["date"] == lesson_date
            and _time_overlaps(start_time, end_time, gen["start_time"], gen["end_time"])
        ):
            return True

    return False


def _find_alternative_classroom(
    db: Session,
    lesson_date: date,
    start_time: time,
    end_time: time,
    generated_lessons: List[Dict],
    exclude_id: Optional[int] = None,
) -> Optional[int]:
    """
    Tenta encontrar uma sala alternativa disponível para o bloco.
    Retorna o ID da sala ou None se nenhuma está livre.
    """
    classrooms = db.query(Classroom).filter(Classroom.is_available.is_(True)).all()

    for classroom in classrooms:
        if classroom.id == exclude_id:
            continue
        if not _has_classroom_conflict(
            db, classroom.id, lesson_date, start_time, end_time, generated_lessons
        ):
            return classroom.id

    return None


# ============================================
# FUNÇÃO PRINCIPAL DE GERAÇÃO
# ============================================


def _get_scheduled_hours(db: Session, course_module_id: int) -> float:
    """Calcula as horas já agendadas para um módulo (aulas existentes na BD)."""
    lessons = db.query(Lesson).filter(Lesson.course_module_id == course_module_id).all()
    total = 0.0
    for lesson in lessons:
        total += _calculate_hours(lesson.start_time, lesson.end_time)
    return total


def generate_schedule(
    db: Session,
    course_id: int,
    dry_run: bool = True,
) -> Dict:
    """
    Gera o horário automático para um curso.

    Args:
        db: Sessão da base de dados
        course_id: ID do curso
        dry_run: Se True, simula sem criar aulas

    Returns:
        Dict com resultado da geração (sucesso, resumo, warnings, etc.)
    """
    # 1. Carregar dados do curso
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return {"success": False, "error": "Curso não encontrado"}

    schedule_type = course.schedule_type or ScheduleType.day
    blocks = SCHEDULE_BLOCKS[schedule_type]

    # 2. Carregar módulos do curso (ordenados por order)
    course_modules = (
        db.query(CourseModule)
        .filter(CourseModule.course_id == course_id)
        .order_by(CourseModule.order)
        .all()
    )

    if not course_modules:
        return {"success": False, "error": "Curso não tem módulos configurados"}

    # 3. Calcular horas restantes por módulo (respeitar aulas manuais existentes)
    module_info = []
    for cm in course_modules:
        scheduled = _get_scheduled_hours(db, cm.id)
        remaining = max(0, (cm.total_hours or 0) - scheduled)

        # Obter nome do módulo
        module_name = "Módulo Desconhecido"
        if cm.module:
            module_name = cm.module.name

        module_info.append(
            {
                "course_module": cm,
                "module_name": module_name,
                "total_hours": cm.total_hours or 0,
                "already_scheduled": scheduled,
                "remaining_hours": remaining,
                "lessons_created": 0,
            }
        )

    # 4. Iterar pelos dias do curso (nunca gerar aulas no passado)
    generated_lessons: List[Dict] = []
    warnings: List[str] = []
    today = date.today()
    current_date = max(course.start_date, today)

    while current_date <= course.end_date:
        iso_day = _get_weekday_iso(current_date)

        # Só dias úteis (Seg-Sex)
        if iso_day <= 5:
            # Para cada bloco do dia
            for block_start, block_end in blocks:
                # Verificar se a turma já tem aula neste bloco
                if _is_course_block_occupied(
                    db,
                    course_id,
                    current_date,
                    block_start,
                    block_end,
                    generated_lessons,
                ):
                    continue

                # Tentar agendar um módulo (por prioridade/order)
                for mi in module_info:
                    if mi["remaining_hours"] <= 0:
                        continue

                    cm = mi["course_module"]

                    # Verificar disponibilidade do professor
                    if not _is_trainer_available(
                        db, cm.trainer_id, current_date, block_start, block_end
                    ):
                        continue

                    # Verificar conflito de professor (noutro curso)
                    if _has_trainer_conflict(
                        db,
                        cm.trainer_id,
                        current_date,
                        block_start,
                        block_end,
                        generated_lessons,
                    ):
                        continue

                    # Verificar sala
                    classroom_id = cm.classroom_id
                    if classroom_id and _has_classroom_conflict(
                        db,
                        classroom_id,
                        current_date,
                        block_start,
                        block_end,
                        generated_lessons,
                    ):
                        # Tentar sala alternativa
                        alt = _find_alternative_classroom(
                            db,
                            current_date,
                            block_start,
                            block_end,
                            generated_lessons,
                            exclude_id=classroom_id,
                        )
                        if alt:
                            classroom_id = alt
                        else:
                            continue  # Sem sala disponível

                    # Gerar a aula!
                    lesson_data = {
                        "course_module_id": cm.id,
                        "classroom_id": classroom_id,
                        "date": current_date,
                        "start_time": block_start,
                        "end_time": block_end,
                        "trainer_id": cm.trainer_id,
                        "course_id": course_id,
                        "module_name": mi["module_name"],
                    }
                    generated_lessons.append(lesson_data)
                    mi["remaining_hours"] -= BLOCK_DURATION_HOURS
                    mi["lessons_created"] += 1
                    break  # Bloco ocupado, passar ao próximo bloco

        current_date += timedelta(days=1)

    # 5. Verificar módulos incompletos
    for mi in module_info:
        if mi["remaining_hours"] > 0:
            warnings.append(
                f"Módulo '{mi['module_name']}': faltam {mi['remaining_hours']}h por agendar "
                f"(professor sem disponibilidade suficiente ou sem slots livres)"
            )

    # 6. Criar aulas na BD se não é dry_run
    if not dry_run and generated_lessons:
        for lesson_data in generated_lessons:
            db_lesson = Lesson(
                course_module_id=lesson_data["course_module_id"],
                classroom_id=lesson_data["classroom_id"],
                date=lesson_data["date"],
                start_time=lesson_data["start_time"],
                end_time=lesson_data["end_time"],
                notes=f"[Auto-gerada] {lesson_data['module_name']}",
            )
            db.add(db_lesson)
        db.commit()

    # 7. Construir resposta
    total_hours = sum(
        mi["lessons_created"] * BLOCK_DURATION_HOURS for mi in module_info
    )
    schedule_label = "Diurno" if schedule_type == ScheduleType.day else "Noturno"

    modules_summary = []
    for mi in module_info:
        status = "complete" if mi["remaining_hours"] <= 0 else "partial"
        if mi["lessons_created"] == 0 and mi["remaining_hours"] > 0:
            status = "failed"

        modules_summary.append(
            {
                "module_name": mi["module_name"],
                "hours_total": mi["total_hours"],
                "hours_already_scheduled": mi["already_scheduled"],
                "hours_new": mi["lessons_created"] * BLOCK_DURATION_HOURS,
                "hours_remaining": max(0, mi["remaining_hours"]),
                "lessons_count": mi["lessons_created"],
                "status": status,
            }
        )

    # Preview das aulas (só no dry_run)
    lessons_preview = []
    if dry_run:
        for ld in generated_lessons:
            lessons_preview.append(
                {
                    "module_name": ld["module_name"],
                    "date": ld["date"].isoformat(),
                    "start_time": ld["start_time"].strftime("%H:%M"),
                    "end_time": ld["end_time"].strftime("%H:%M"),
                    "classroom_id": ld["classroom_id"],
                }
            )

    return {
        "success": True,
        "course_name": course.name,
        "schedule_type": schedule_type.value,
        "schedule_label": schedule_label,
        "lessons_created": len(generated_lessons),
        "total_hours_scheduled": total_hours,
        "modules_summary": modules_summary,
        "warnings": warnings,
        "lessons_preview": lessons_preview,
    }
