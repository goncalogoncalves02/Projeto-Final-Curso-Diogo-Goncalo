from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    default_duration_hours = Column(Integer, default=25)

    # Relacionamentos
    course_modules = relationship("CourseModule", back_populates="module")
