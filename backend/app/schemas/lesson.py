"""
Schemas Pydantic para Lesson (Aula)
-----------------------------------
Define os schemas de validação para criar, atualizar e ler aulas do horário.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date as DateType, time as TimeType


# ============================================
# SCHEMAS BASE
# ============================================


class LessonBase(BaseModel):
    """Campos comuns a todas as operações de Lesson."""

    date: DateType = Field(..., description="Data da aula")
    start_time: TimeType = Field(..., description="Hora de início")
    end_time: TimeType = Field(..., description="Hora de fim")
    notes: Optional[str] = Field(None, description="Sumário ou observações da aula")


class LessonCreate(LessonBase):
    """Schema para criar uma nova aula."""

    course_module_id: int = Field(..., description="ID do módulo do curso")
    classroom_id: Optional[int] = Field(
        None, description="ID da sala (usa a padrão do módulo se não especificado)"
    )

    # Opções de recorrência
    is_recurring: bool = Field(False, description="Se a aula é recorrente")
    recurrence_weeks: Optional[int] = Field(
        None, description="Número de semanas a repetir (se recorrente)"
    )


class LessonUpdate(BaseModel):
    """Schema para atualizar uma aula (todos os campos opcionais)."""

    date: Optional[DateType] = None
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    classroom_id: Optional[int] = None
    notes: Optional[str] = None


# ============================================
# SCHEMAS DE LEITURA
# ============================================


class Lesson(LessonBase):
    """Schema de leitura básico."""

    id: int
    course_module_id: int
    classroom_id: Optional[int]

    class Config:
        from_attributes = True


class LessonWithDetails(BaseModel):
    """Schema de leitura expandido com dados relacionados."""

    id: int
    date: DateType
    start_time: TimeType
    end_time: TimeType
    notes: Optional[str]

    # Dados do Módulo
    module_name: str
    module_id: int

    # Dados do Curso
    course_name: str
    course_id: int

    # Dados do Professor
    trainer_name: str
    trainer_id: int

    # Dados da Sala
    classroom_name: Optional[str]
    classroom_id: Optional[int]

    # Horas calculadas
    duration_hours: float

    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE RESPOSTA/VALIDAÇÃO
# ============================================


class LessonConflictError(BaseModel):
    """Schema para erros de conflito."""

    error_type: str = Field(
        ..., description="Tipo de conflito: 'classroom', 'trainer', 'hours'"
    )
    message: str = Field(..., description="Mensagem de erro detalhada")
    conflicting_lesson_id: Optional[int] = Field(
        None, description="ID da aula em conflito"
    )


class LessonHoursInfo(BaseModel):
    """Informação sobre horas do módulo."""

    total_hours: int = Field(..., description="Total de horas do módulo")
    scheduled_hours: float = Field(..., description="Horas já agendadas")
    remaining_hours: float = Field(..., description="Horas restantes")
    lesson_hours: float = Field(..., description="Horas desta aula")
    would_exceed: bool = Field(..., description="Se esta aula excederia o limite")


class LessonCreateResponse(BaseModel):
    """Resposta ao criar aulas (pode ter múltiplas se recorrente)."""

    created_lessons: List[Lesson]
    count: int
    hours_info: LessonHoursInfo
