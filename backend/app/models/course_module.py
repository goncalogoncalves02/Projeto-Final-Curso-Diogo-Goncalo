from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(Integer, primary_key=True, index=True)

    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    trainer_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Pode não ter formador atribuído ainda
    classroom_id = Column(
        Integer, ForeignKey("classrooms.id"), nullable=True
    )  # Sala preferencial

    order = Column(Integer, nullable=False, default=1)
    total_hours = Column(Integer, nullable=False, default=25)

    # Relacionamentos
    course = relationship("Course", back_populates="modules")
    module = relationship("Module", back_populates="course_modules")
    trainer = relationship("User", back_populates="teaching_modules")
    classroom = relationship("Classroom", back_populates="course_modules")

    lessons = relationship("Lesson", back_populates="course_module")
