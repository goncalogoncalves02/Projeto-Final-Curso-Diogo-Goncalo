"""
Modelo de Aula (Lesson)
-----------------------
Representa uma sessão específica de formação no calendário.
É o bloco fundamental para o horário escolar.

Funcionalidades:
- Data, Hora de Início e Fim.
- Sala específica (pode substituir a sala padrão do módulo).
- Sumários ou notas sobre a aula.
"""

from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Lesson(Base):


    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)

    # Ligações Externas
    course_module_id = Column(
        Integer,
        ForeignKey("course_modules.id"),
        nullable=False,
        doc="A que módulo/professor pertence esta aula",
    )
    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=True,
        doc="Sala onde ocorre (pode ser diferente da padrão do módulo)",
    )

    # Agendamento
    date = Column(Date, nullable=False, doc="Dia da aula")
    start_time = Column(Time, nullable=False, doc="Hora de início")
    end_time = Column(Time, nullable=False, doc="Hora de fim")

    # Conteúdo
    notes = Column(String, nullable=True, doc="Sumário da aula ou observações")

    # RELACIONAMENTOS

    # 1. Módulo Associado (Permite saber quem é o professor e qual a turma)
    course_module = relationship("CourseModule", back_populates="lessons")

    # 2. Sala da Aula
    classroom = relationship("Classroom", back_populates="lessons")
