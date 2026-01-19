from sqlalchemy import Column, Integer, String, Date, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class CourseStatus(str, enum.Enum):
    active = "active"
    planned = "planned"
    finished = "finished"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    area = Column(String, nullable=False)  # Ex: Informática, Robótica
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(CourseStatus), default=CourseStatus.planned)

    # Relacionamentos
    modules = relationship("CourseModule", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
