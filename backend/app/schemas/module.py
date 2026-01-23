from typing import Optional
from pydantic import BaseModel

# Base
class ModuleBase(BaseModel):
    name: str
    area: Optional[str] = None
    default_duration_hours: Optional[int] = 25

# Create
class ModuleCreate(ModuleBase):
    pass

# Update
class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    default_duration_hours: Optional[int] = None

# Response
class Module(ModuleBase):
    id: int

    class Config:
        from_attributes = True
