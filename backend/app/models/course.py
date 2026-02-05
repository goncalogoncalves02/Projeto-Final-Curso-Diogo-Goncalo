"""
Modelo de Curso (Course)
------------------------
Representa uma edição específica de um curso (ex: "TPSI Programação - Edição Jan 2026").
Agrupa um conjunto de módulos e alunos.

Funcionalidades:
- Definição de datas de início e fim.
- Área de formação (ex: Informática).
- Estado do curso (Planeado, Ativo, Terminado).
"""

from sqlalchemy import Column, Integer, String, Date, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class CourseStatus(str, enum.Enum):
    active = "active"  # Curso a decorrer
    planned = "planned"  # Curso planeado mas ainda não iniciou
    finished = "finished"  # Curso terminado
    cancelled = "cancelled"  # Curso cancelado


class Course(Base):
    """
    Tabela 'courses' na base de dados.
    """

    __tablename__ = "courses"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, doc="Nome da edição do curso")
    description = Column(
        String, nullable=True, doc="Descrição detalhada ou observações"
    )
    area = Column(
        String, nullable=False, doc="Área de formação (ex: 'Informática', 'Robótica')"
    )

    # Planeamento Temporal
    start_date = Column(Date, nullable=False, doc="Data de início previsto")
    end_date = Column(Date, nullable=False, doc="Data de fim previsto")

    # Estado
    status = Column(
        Enum(CourseStatus), default=CourseStatus.planned, doc="Estado atual do curso"
    )

    # RELACIONAMENTOS

    # 1. Módulos do curso (tabela de ligação CourseModule)
    # Lista de módulos que compõem esta edição do curso
    modules = relationship(
        "CourseModule", back_populates="course", cascade="all, delete-orphan"
    )

    # 2. Inscrições (Enrollment)
    # Lista de alunos inscritos nesta edição
    enrollments = relationship(
        "Enrollment", back_populates="course", cascade="all, delete-orphan"
    )
