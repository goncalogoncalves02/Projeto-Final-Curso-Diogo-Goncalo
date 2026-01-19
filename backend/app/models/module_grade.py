from sqlalchemy import Column, Integer, ForeignKey, Float, String, Date
from sqlalchemy.orm import relationship
from app.db.base import Base


class ModuleGrade(Base):
    """
    Notas detalhadas de uma inscrição num módulo específico.
    """

    __tablename__ = "module_grades"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    course_module_id = Column(Integer, ForeignKey("course_modules.id"), nullable=False)

    grade = Column(Float, nullable=False)  # Nota do módulo (0-20)
    comments = Column(String, nullable=True)
    evaluated_at = Column(Date, nullable=False)

    # Relacionamentos
    enrollment = relationship("Enrollment", back_populates="module_grades")
    course_module = relationship("CourseModule")
