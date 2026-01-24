"""
Modelo de Módulo do Curso (CourseModule)
----------------------------------------
Tabela de ligação crítica que define a estrutura de um curso ("Receita do Curso").
Associa um Módulo (Template) a uma edição de Curso (Course), atribuindo um professor e uma sala.

Funcionalidades:
- Definição do professor responsável por este módulo nesta edição.
- Sala preferencial/padrão.
- Ordem sequencial no curso.
- Carga horária específica.
"""

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class CourseModule(Base):

    __tablename__ = "course_modules"

    id = Column(Integer, primary_key=True, index=True)

    # Chaves Estrangeiras (Quem liga a quem)
    course_id = Column(
        Integer, ForeignKey("courses.id"), nullable=False, doc="Curso a que pertence"
    )
    module_id = Column(
        Integer, ForeignKey("modules.id"), nullable=False, doc="Módulo lecionado"
    )
    trainer_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, doc="Professor responsável"
    )
    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=True,
        doc="Sala padrão (pode ser trocada em aulas específicas)",
    )

    # Atributos Específicos desta Associação
    order = Column(
        Integer, default=0, doc="Ordem sequencial do módulo no curso (1º, 2º, etc)"
    )
    total_hours = Column(
        Integer, default=25, doc="Carga horária real nesta edição do curso"
    )

    # RELACIONAMENTOS

    # 1. Curso
    course = relationship("Course", back_populates="modules")

    # 2. Módulo Base
    module = relationship("Module", back_populates="course_modules")

    # 3. Professor
    trainer = relationship("User", back_populates="teaching_modules")

    # 4. Sala
    classroom = relationship("Classroom", back_populates="course_modules")

    # 5. Aulas (Agenda real) geradas para este módulo
    lessons = relationship(
        "Lesson", back_populates="course_module", cascade="all, delete-orphan"
    )
