from typing import Optional
from pydantic import BaseModel
from .module import Module
from .user import User


class CourseModuleBase(BaseModel):
    module_id: int
    trainer_id: int
    classroom_id: Optional[int] = None
    order: int = 0
    total_hours: int = 25


class CourseModuleCreate(CourseModuleBase):
    pass


class CourseModuleUpdate(BaseModel):
    trainer_id: Optional[int] = None
    classroom_id: Optional[int] = None
    order: Optional[int] = None
    total_hours: Optional[int] = None


class CourseModule(CourseModuleBase):
    id: int
    #    course_id: int # Often redundant if nested, but good to have
    module: Module  # Nested response for UI convenience
    trainer: User  # Nested response for UI convenience

    class Config:
        from_attributes = True
