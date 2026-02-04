"""
Schemas Pydantic para ChatLog e ChatBot
---------------------------------------
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# === Schemas base ===

class ChatLogBase(BaseModel):
    session_id: Optional[str] = None
    message_content: str


class ChatLogCreate(ChatLogBase):
    user_id: Optional[int] = None
    bot_response: str


class ChatLogUpdate(BaseModel):
    pass  # Logs não são editáveis


class ChatLog(ChatLogBase):
    id: int
    user_id: Optional[int]
    bot_response: str
    created_at: datetime

    class Config:
        from_attributes = True


# === Schemas para API do ChatBot ===

class ChatMessage(BaseModel):
    """Mensagem enviada pelo utilizador ao ChatBot."""
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Resposta do ChatBot."""
    response: str
    session_id: str
