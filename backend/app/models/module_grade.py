"""
Modelo de Nota Módulo (ModuleGrade)
-----------------------------------
Representa a avaliação de um aluno num módulo específico de um curso.
Permite um registo granular do aproveitamento, em vez de apenas uma nota final de curso.

Funcionalidades:
- Registo da nota (0-20).
- Comentários qualitativos.
- Data de avaliação.
"""

from sqlalchemy import Column, Integer, ForeignKey, Float, String, Date
from sqlalchemy.orm import relationship
from app.db.base import Base


class ModuleGrade(Base):

    __tablename__ = "module_grades"

    id = Column(Integer, primary_key=True, index=True)

    # Ligações
    enrollment_id = Column(
        Integer,
        ForeignKey("enrollments.id"),
        nullable=False,
        doc="Ligação à inscrição do aluno",
    )
    course_module_id = Column(
        Integer,
        ForeignKey("course_modules.id"),
        nullable=False,
        doc="Módulo que foi avaliado",
    )

    # Avaliação
    grade = Column(Float, nullable=False, doc="Nota atribuída (0-20)")
    comments = Column(String, nullable=True, doc="Feedback do professor")
    evaluated_at = Column(Date, nullable=False, doc="Data da avaliação")

    # RELACIONAMENTOS

    # 1. Inscrição (Acesso ao aluno e curso)
    enrollment = relationship("Enrollment", back_populates="module_grades")

    # 2. Módulo do Curso (Acesso ao módulo e formador)
    course_module = relationship("CourseModule")
