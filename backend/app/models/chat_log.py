from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ChatLog(Base):
    """
    Histórico de conversas com o ChatBot.
    """

    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Pode ser anónimo
    session_id = Column(String, index=True, nullable=True)

    message_content = Column(String, nullable=False)
    bot_response = Column(String, nullable=False)

    created_at = Column(DateTime, default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="chat_logs")
