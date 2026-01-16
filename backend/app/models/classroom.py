from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=True)  # Ex: Teórica, Prática

    # Relacionamentos
    course_modules = relationship("CourseModule", back_populates="classroom")
    lessons = relationship("Lesson", back_populates="classroom")
