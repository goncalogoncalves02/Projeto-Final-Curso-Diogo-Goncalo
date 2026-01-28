"""
Schemas para UserFile (Ficheiros anexos ao utilizador)
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserFileBase(BaseModel):
    filename: str
    file_type: Optional[str] = None


class UserFileCreate(UserFileBase):
    """Schema para criação - file_path é gerado pelo servidor"""
    pass


class UserFile(UserFileBase):
    """Schema de resposta"""
    id: int
    user_id: int
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
