"""
Router de Lessons (Aulas/Horários)
----------------------------------
CRUD completo para gestão de aulas com validações críticas:
1. Não sobrepor aulas na mesma sala
2. Não alocar professor em 2 aulas ao mesmo tempo
3. Não ultrapassar horas do módulo

Também inclui endpoints de consulta por turma, formador e sala.
"""

from typing import List, Any, Optional
from datetime import date, time, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from app.db.session import get_db
from app.api import deps
from app.models.lesson import Lesson as LessonModel
from app.models.course_module import CourseModule as CourseModuleModel
from app.models.course import Course as CourseModel
from app.models.module import Module as ModuleModel
from app.models.classroom import Classroom as ClassroomModel
from app.models.user import User as UserModel
from app.schemas.lesson import (
    Lesson,
    LessonCreate,
    LessonUpdate,
    LessonWithDetails,
    LessonConflictError,
    LessonHoursInfo,
    LessonCreateResponse,
)

router = APIRouter()


# ============================================
# FUNÇÕES AUXILIARES DE VALIDAÇÃO
# ============================================


def calculate_lesson_hours(start_time: time, end_time: time) -> float:
    """Calcula a duração de uma aula em horas."""
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)
    duration = (end_dt - start_dt).total_seconds() / 3600
    return round(duration, 2)


def check_time_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    """Verifica se dois intervalos de tempo se sobrepõem."""
    return start1 < end2 and end1 > start2


def get_scheduled_hours_for_module(
    db: Session, course_module_id: int, exclude_lesson_id: int = None
) -> float:
    """Calcula o total de horas já agendadas para um módulo."""
    query = db.query(LessonModel).filter(
        LessonModel.course_module_id == course_module_id
    )

    if exclude_lesson_id:
        query = query.filter(LessonModel.id != exclude_lesson_id)

    lessons = query.all()
    total = 0.0
    for lesson in lessons:
        total += calculate_lesson_hours(lesson.start_time, lesson.end_time)

    return round(total, 2)


def validate_lesson(
    db: Session,
    course_module_id: int,
    lesson_date: date,
    start_time: time,
    end_time: time,
    classroom_id: Optional[int],
    exclude_lesson_id: int = None,
) -> List[LessonConflictError]:
    """
    Valida uma aula contra as 3 regras críticas.
    Retorna lista de erros (vazia se válido).
    """
    errors = []

    # Obter dados do módulo
    course_module = (
        db.query(CourseModuleModel)
        .filter(CourseModuleModel.id == course_module_id)
        .first()
    )

    if not course_module:
        errors.append(
            LessonConflictError(
                error_type="not_found", message="Módulo do curso não encontrado"
            )
        )
        return errors

    # Determinar a sala (usa a do módulo se não especificada)
    actual_classroom_id = classroom_id or course_module.classroom_id

    # Query base para aulas no mesmo dia
    base_query = db.query(LessonModel).filter(LessonModel.date == lesson_date)
    if exclude_lesson_id:
        base_query = base_query.filter(LessonModel.id != exclude_lesson_id)

    lessons_same_day = base_query.all()

    for existing_lesson in lessons_same_day:
        # Verificar sobreposição de horário
        if not check_time_overlap(
            start_time, end_time, existing_lesson.start_time, existing_lesson.end_time
        ):
            continue

        # VALIDAÇÃO 1: Conflito de Sala
        existing_classroom = existing_lesson.classroom_id
        if existing_classroom is None:
            # Usar sala do módulo da aula existente
            existing_cm = (
                db.query(CourseModuleModel)
                .filter(CourseModuleModel.id == existing_lesson.course_module_id)
                .first()
            )
            if existing_cm:
                existing_classroom = existing_cm.classroom_id

        if actual_classroom_id and existing_classroom == actual_classroom_id:
            errors.append(
                LessonConflictError(
                    error_type="classroom",
                    message=f"A sala já está ocupada neste horário (aula #{existing_lesson.id})",
                    conflicting_lesson_id=existing_lesson.id,
                )
            )

        # VALIDAÇÃO 2: Conflito de Professor
        existing_cm = (
            db.query(CourseModuleModel)
            .filter(CourseModuleModel.id == existing_lesson.course_module_id)
            .first()
        )

        if existing_cm and existing_cm.trainer_id == course_module.trainer_id:
            errors.append(
                LessonConflictError(
                    error_type="trainer",
                    message=f"O professor já tem outra aula neste horário (aula #{existing_lesson.id})",
                    conflicting_lesson_id=existing_lesson.id,
                )
            )

    # VALIDAÇÃO 3: Limite de Horas do Módulo
    lesson_hours = calculate_lesson_hours(start_time, end_time)
    scheduled_hours = get_scheduled_hours_for_module(
        db, course_module_id, exclude_lesson_id
    )
    total_hours = course_module.total_hours or 0

    if scheduled_hours + lesson_hours > total_hours:
        errors.append(
            LessonConflictError(
                error_type="hours",
                message=f"Esta aula excede o limite de horas do módulo. "
                f"Limite: {total_hours}h, Agendado: {scheduled_hours}h, "
                f"Esta aula: {lesson_hours}h, Total seria: {scheduled_hours + lesson_hours}h",
            )
        )

    return errors


def build_lesson_with_details(db: Session, lesson: LessonModel) -> LessonWithDetails:
    """Constrói um LessonWithDetails a partir de um modelo."""
    course_module = (
        db.query(CourseModuleModel)
        .options(
            joinedload(CourseModuleModel.module),
            joinedload(CourseModuleModel.course),
            joinedload(CourseModuleModel.trainer),
            joinedload(CourseModuleModel.classroom),
        )
        .filter(CourseModuleModel.id == lesson.course_module_id)
        .first()
    )

    # Sala da aula (pode ser diferente da padrão do módulo)
    classroom = None
    if lesson.classroom_id:
        classroom = (
            db.query(ClassroomModel)
            .filter(ClassroomModel.id == lesson.classroom_id)
            .first()
        )
    elif course_module and course_module.classroom:
        classroom = course_module.classroom

    return LessonWithDetails(
        id=lesson.id,
        date=lesson.date,
        start_time=lesson.start_time,
        end_time=lesson.end_time,
        notes=lesson.notes,
        module_name=course_module.module.name
        if course_module and course_module.module
        else "N/A",
        module_id=course_module.module.id
        if course_module and course_module.module
        else 0,
        course_name=course_module.course.name
        if course_module and course_module.course
        else "N/A",
        course_id=course_module.course.id
        if course_module and course_module.course
        else 0,
        trainer_name=course_module.trainer.full_name or course_module.trainer.email
        if course_module and course_module.trainer
        else "N/A",
        trainer_id=course_module.trainer.id
        if course_module and course_module.trainer
        else 0,
        classroom_name=classroom.name if classroom else None,
        classroom_id=classroom.id if classroom else None,
        duration_hours=calculate_lesson_hours(lesson.start_time, lesson.end_time),
    )


# ============================================
# ENDPOINTS CRUD
# ============================================


@router.get("/", response_model=List[LessonWithDetails])
def list_lessons(
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    start_date: Optional[date] = Query(None, description="Filtrar a partir desta data"),
    end_date: Optional[date] = Query(None, description="Filtrar até esta data"),
    skip: int = 0,
    limit: int = 100,
):
    """Lista todas as aulas com filtros opcionais."""
    query = db.query(LessonModel)

    if start_date:
        query = query.filter(LessonModel.date >= start_date)
    if end_date:
        query = query.filter(LessonModel.date <= end_date)

    query = query.order_by(LessonModel.date, LessonModel.start_time)
    lessons = query.offset(skip).limit(limit).all()

    return [build_lesson_with_details(db, lesson) for lesson in lessons]


@router.get("/hours-info/{course_module_id}", response_model=LessonHoursInfo)
def get_module_hours_info(
    course_module_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
):
    """Retorna informação sobre as horas de um módulo."""
    course_module = (
        db.query(CourseModuleModel)
        .filter(CourseModuleModel.id == course_module_id)
        .first()
    )

    if not course_module:
        raise HTTPException(status_code=404, detail="Módulo do curso não encontrado")

    total_hours = course_module.total_hours or 0
    scheduled_hours = get_scheduled_hours_for_module(db, course_module_id)
    remaining_hours = max(0, total_hours - scheduled_hours)

    return LessonHoursInfo(
        total_hours=total_hours,
        scheduled_hours=scheduled_hours,
        remaining_hours=remaining_hours,
        lesson_hours=0,
        would_exceed=False,
    )


@router.post("/", response_model=LessonCreateResponse)
def create_lesson(
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """
    Cria uma ou mais aulas (com suporte a recorrência).
    Aplica todas as validações de conflito.
    """
    created_lessons = []
    dates_to_create = [lesson_in.date]

    # Se recorrente, calcular todas as datas
    if lesson_in.is_recurring and lesson_in.recurrence_weeks:
        for week in range(1, lesson_in.recurrence_weeks):
            dates_to_create.append(lesson_in.date + timedelta(weeks=week))

    # Obter dados do módulo para info de horas
    course_module = (
        db.query(CourseModuleModel)
        .filter(CourseModuleModel.id == lesson_in.course_module_id)
        .first()
    )

    if not course_module:
        raise HTTPException(status_code=404, detail="Módulo do curso não encontrado")

    # Calcular horas totais das aulas a criar
    single_lesson_hours = calculate_lesson_hours(
        lesson_in.start_time, lesson_in.end_time
    )
    total_new_hours = single_lesson_hours * len(dates_to_create)
    scheduled_hours = get_scheduled_hours_for_module(db, lesson_in.course_module_id)
    module_total_hours = course_module.total_hours or 0

    # Verificar se excede o limite antes de criar qualquer aula
    if scheduled_hours + total_new_hours > module_total_hours:
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível criar {len(dates_to_create)} aula(s). "
            f"Limite: {module_total_hours}h, Agendado: {scheduled_hours}h, "
            f"Novas aulas: {total_new_hours}h, "
            f"Total seria: {scheduled_hours + total_new_hours}h",
        )

    # Validar e criar cada aula
    for lesson_date in dates_to_create:
        # Validar esta aula específica
        errors = validate_lesson(
            db,
            lesson_in.course_module_id,
            lesson_date,
            lesson_in.start_time,
            lesson_in.end_time,
            lesson_in.classroom_id,
        )

        # Filtrar apenas erros de sala e professor (horas já verificadas acima)
        critical_errors = [
            e for e in errors if e.error_type in ("classroom", "trainer")
        ]

        if critical_errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Conflito encontrado para {lesson_date}",
                    "errors": [e.model_dump() for e in critical_errors],
                },
            )

        # Criar a aula
        lesson = LessonModel(
            course_module_id=lesson_in.course_module_id,
            classroom_id=lesson_in.classroom_id,
            date=lesson_date,
            start_time=lesson_in.start_time,
            end_time=lesson_in.end_time,
            notes=lesson_in.notes,
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        created_lessons.append(lesson)

    # Preparar resposta com info de horas atualizada
    new_scheduled = scheduled_hours + total_new_hours
    hours_info = LessonHoursInfo(
        total_hours=module_total_hours,
        scheduled_hours=new_scheduled,
        remaining_hours=max(0, module_total_hours - new_scheduled),
        lesson_hours=total_new_hours,
        would_exceed=False,
    )

    return LessonCreateResponse(
        created_lessons=[Lesson.model_validate(l) for l in created_lessons],
        count=len(created_lessons),
        hours_info=hours_info,
    )


@router.put("/{lesson_id}", response_model=Lesson)
def update_lesson(
    lesson_id: int,
    lesson_in: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """Atualiza uma aula existente (com validações)."""
    lesson = db.query(LessonModel).filter(LessonModel.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    # Preparar dados para validação
    new_date = lesson_in.date if lesson_in.date else lesson.date
    new_start = lesson_in.start_time if lesson_in.start_time else lesson.start_time
    new_end = lesson_in.end_time if lesson_in.end_time else lesson.end_time
    new_classroom = (
        lesson_in.classroom_id
        if lesson_in.classroom_id is not None
        else lesson.classroom_id
    )

    # Validar alterações
    errors = validate_lesson(
        db,
        lesson.course_module_id,
        new_date,
        new_start,
        new_end,
        new_classroom,
        exclude_lesson_id=lesson_id,
    )

    if errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Conflito encontrado",
                "errors": [e.model_dump() for e in errors],
            },
        )

    # Aplicar alterações
    update_data = lesson_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", response_model=Lesson)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_superuser),
):
    """Remove uma aula."""
    lesson = db.query(LessonModel).filter(LessonModel.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    db.delete(lesson)
    db.commit()
    return lesson


# ============================================
# ENDPOINTS DE CONSULTA
# ============================================


@router.get("/by-course/{course_id}", response_model=List[LessonWithDetails])
def get_lessons_by_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    start_date: Optional[date] = Query(None, description="Filtrar a partir desta data"),
    end_date: Optional[date] = Query(None, description="Filtrar até esta data"),
):
    """
    Lista o horário de um curso/turma.
    Requisito 1.k: Consulta rápida de horário de turma com filtro por tempo.
    """
    # Obter todos os módulos deste curso
    course_modules = (
        db.query(CourseModuleModel)
        .filter(CourseModuleModel.course_id == course_id)
        .all()
    )

    if not course_modules:
        return []

    module_ids = [cm.id for cm in course_modules]

    # Obter todas as aulas desses módulos
    query = db.query(LessonModel).filter(LessonModel.course_module_id.in_(module_ids))

    if start_date:
        query = query.filter(LessonModel.date >= start_date)
    if end_date:
        query = query.filter(LessonModel.date <= end_date)

    query = query.order_by(LessonModel.date, LessonModel.start_time)
    lessons = query.all()

    return [build_lesson_with_details(db, lesson) for lesson in lessons]


@router.get("/by-trainer/{trainer_id}", response_model=List[LessonWithDetails])
def get_lessons_by_trainer(
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    start_date: Optional[date] = Query(None, description="Filtrar a partir desta data"),
    end_date: Optional[date] = Query(None, description="Filtrar até esta data"),
):
    """
    Lista o horário de um professor/formador.
    Requisito 1.l: Consulta rápida de horário de formador com filtro por tempo.
    """
    # Obter todos os módulos deste professor
    course_modules = (
        db.query(CourseModuleModel)
        .filter(CourseModuleModel.trainer_id == trainer_id)
        .all()
    )

    if not course_modules:
        return []

    module_ids = [cm.id for cm in course_modules]

    # Obter todas as aulas desses módulos
    query = db.query(LessonModel).filter(LessonModel.course_module_id.in_(module_ids))

    if start_date:
        query = query.filter(LessonModel.date >= start_date)
    if end_date:
        query = query.filter(LessonModel.date <= end_date)

    query = query.order_by(LessonModel.date, LessonModel.start_time)
    lessons = query.all()

    return [build_lesson_with_details(db, lesson) for lesson in lessons]


@router.get("/by-classroom/{classroom_id}", response_model=List[LessonWithDetails])
def get_lessons_by_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    target_date: Optional[date] = Query(
        None, alias="date", description="Filtrar por dia específico"
    ),
    start_date: Optional[date] = Query(None, description="Filtrar a partir desta data"),
    end_date: Optional[date] = Query(None, description="Filtrar até esta data"),
):
    """
    Lista a alocação de uma sala.
    Requisito 1.m: Consulta rápida de alocação de sala para um dia.
    """
    # Primeiro, aulas com classroom_id explícito
    query = db.query(LessonModel).filter(LessonModel.classroom_id == classroom_id)

    # Também incluir aulas onde a sala vem do módulo
    modules_with_classroom = (
        db.query(CourseModuleModel.id)
        .filter(CourseModuleModel.classroom_id == classroom_id)
        .all()
    )
    module_ids = [m.id for m in modules_with_classroom]

    if module_ids:
        # Aulas do módulo SEM override de sala
        query = db.query(LessonModel).filter(
            or_(
                LessonModel.classroom_id == classroom_id,
                and_(
                    LessonModel.course_module_id.in_(module_ids),
                    LessonModel.classroom_id.is_(None),
                ),
            )
        )

    # Aplicar filtros de data
    if target_date:
        query = query.filter(LessonModel.date == target_date)
    else:
        if start_date:
            query = query.filter(LessonModel.date >= start_date)
        if end_date:
            query = query.filter(LessonModel.date <= end_date)

    query = query.order_by(LessonModel.date, LessonModel.start_time)
    lessons = query.all()

    return [build_lesson_with_details(db, lesson) for lesson in lessons]
