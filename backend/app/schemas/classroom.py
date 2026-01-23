from typing import Optional
from pydantic import BaseModel


# Base
class ClassroomBase(BaseModel):
    name: str
    type: Optional[str] = None
    capacity: Optional[int] = 20
    is_available: Optional[bool] = True


# Create
class ClassroomCreate(ClassroomBase):
    pass


# Update
class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    is_available: Optional[bool] = None


# Response
class Classroom(ClassroomBase):
    id: int

    class Config:
        from_attributes = True
