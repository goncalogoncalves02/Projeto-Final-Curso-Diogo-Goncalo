from typing import Optional, List
from datetime import date
from pydantic import BaseModel
from app.models.course import CourseStatus


# Base
class CourseBase(BaseModel):
    name: str
    area: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    status: Optional[CourseStatus] = CourseStatus.planned


# Create
class CourseCreate(CourseBase):
    pass


# Update
class CourseUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[CourseStatus] = None


# Response
class Course(CourseBase):
    id: int
    # Podemos adicionar 'modules' ou 'enrollments' aqui se quisermos devolver logo
    # Mas cuidado com a recursividade. Para já, simples.

    class Config:
        from_attributes = True
