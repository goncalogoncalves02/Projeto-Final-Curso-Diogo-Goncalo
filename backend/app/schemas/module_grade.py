from typing import Optional
from datetime import date
from pydantic import BaseModel


class ModuleGradeBase(BaseModel):
    grade: float
    comments: Optional[str] = None
    evaluated_at: date


class ModuleGradeCreate(ModuleGradeBase):
    enrollment_id: int
    course_module_id: int


class ModuleGradeUpdate(BaseModel):
    grade: Optional[float] = None
    comments: Optional[str] = None
    evaluated_at: Optional[date] = None


class ModuleGrade(ModuleGradeBase):
    id: int
    enrollment_id: int
    course_module_id: int

    class Config:
        from_attributes = True
