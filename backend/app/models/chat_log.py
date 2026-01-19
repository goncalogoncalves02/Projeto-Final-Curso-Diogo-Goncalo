"""
Modelo de Histórico de Chat (ChatLog)
-------------------------------------
Guarda as interações entre os utilizadores e o ChatBot (IA).
Útil para auditoria, melhoria do modelo e histórico para o utilizador.

Funcionalidades:
- Registo da pergunta (prompt) e resposta (completion).
- Ligação ao utilizador (opcional, para permitir chats anónimos/visitantes).
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ChatLog(Base):

    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Identificação da Sessão
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        doc="Utilizador (pode ser Null se anónimo)",
    )
    session_id = Column(
        String,
        index=True,
        nullable=True,
        doc="ID para agrupar mensagens da mesma conversa",
    )

    # Conteúdo da Conversa
    message_content = Column(String, nullable=False, doc="Mensagem enviada pelo humano")
    bot_response = Column(String, nullable=False, doc="Resposta gerada pela IA")

    # Metadados
    created_at = Column(DateTime, default=func.now(), doc="Data e hora da interação")

    # RELACIONAMENTOS

    # 1. Utilizador
    user = relationship("User", back_populates="chat_logs")
