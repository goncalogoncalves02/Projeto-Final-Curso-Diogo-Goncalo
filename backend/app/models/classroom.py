from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=True)  # Ex: Teórica, Prática
    capacity = Column(Integer, default=20)
    is_available = Column(Boolean, default=True)

    # Relacionamentos
    course_modules = relationship("CourseModule", back_populates="classroom")
    lessons = relationship("Lesson", back_populates="classroom")
