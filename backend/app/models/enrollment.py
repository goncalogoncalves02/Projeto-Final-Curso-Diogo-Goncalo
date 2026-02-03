"""
Modelo de Inscrição (Enrollment)
--------------------------------
Representa a matrícula de um aluno numa edição específica de um curso.
Gere o ciclo de vida do aluno no curso (Ativo -> Concluído/Desistente).

Funcionalidades:
- Estado da matrícula.
- Nota final global.
- Ligação ao Certificado final.
"""

from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class EnrollmentStatus(str, enum.Enum):
    active = "active"  # A frequentar
    completed = "completed"  # Aprovado/Terminado
    dropped = "dropped"  # Desistiu


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)

    # Ligações
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, doc="Aluno inscrito"
    )
    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False,
        doc="Curso em que se inscreveu",
    )

    # Detalhes da Inscrição
    enrollment_date = Column(Date, nullable=False, doc="Data de matrícula")
    status = Column(
        Enum(EnrollmentStatus), default=EnrollmentStatus.active, doc="Estado atual"
    )

    # Avaliação Final
    final_grade = Column(Integer, nullable=True, doc="Nota final do curso (0-20)")
    final_certificate_url = Column(
        String, nullable=True, doc="Link para download do certificado PDF"
    )

    # RELACIONAMENTOS

    # 1. Aluno
    user = relationship("User", back_populates="enrollments")

    # 2. Curso
    course = relationship("Course", back_populates="enrollments")

    # 3. Notas Detalhadas (Módulo a Módulo)
    # Permite aceder a todas as notas parciais deste aluno neste curso
    module_grades = relationship(
        "ModuleGrade", back_populates="enrollment", cascade="all, delete-orphan"
    )
