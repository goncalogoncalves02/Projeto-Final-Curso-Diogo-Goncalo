from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_module_id = Column(Integer, ForeignKey("course_modules.id"), nullable=False)
    classroom_id = Column(
        Integer, ForeignKey("classrooms.id"), nullable=True
    )  # Pode substituir a sala do módulo

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    notes = Column(String, nullable=True)

    # Relacionamentos
    course_module = relationship("CourseModule", back_populates="lessons")
    classroom = relationship("Classroom", back_populates="lessons")
