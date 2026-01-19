"""
Modelo de Sala (Classroom)
--------------------------
Representa um espaço físico onde decorrem as aulas.

Funcionalidades:
- Gestão de capacidade (para evitar sobrelotação).
- Tipologia (Informática vs Teórica) para alocação inteligente.
- Estado de disponibilidade (Manutenção vs Ativo).
"""

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base


class Classroom(Base):
    """
    Tabela 'classrooms' na base de dados.
    """

    __tablename__ = "classrooms"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    name = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
        doc="Nome ou número da sala (ex: 'C.2.1')",
    )

    # Características
    type = Column(
        String, nullable=True, doc="Tipo de sala (ex: 'Laboratório', 'Teórica')"
    )
    capacity = Column(Integer, default=20, doc="Lotação máxima de alunos")
    is_available = Column(
        Boolean, default=True, doc="Se False, a sala está indisponível (ex: obras)"
    )

    # RELACIONAMENTOS

    # 1. Módulos que têm esta sala como 'Predefinida'
    course_modules = relationship("CourseModule", back_populates="classroom")

    # 2. Aulas calendarizadas nesta sala
    lessons = relationship("Lesson", back_populates="classroom")
