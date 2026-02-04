"""
CRUD para ChatLog
-----------------
Operações de base de dados para histórico de chat.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.chat_log import ChatLog
from app.schemas.chat_log import ChatLogCreate, ChatLogUpdate


class CRUDChatLog(CRUDBase[ChatLog, ChatLogCreate, ChatLogUpdate]):
    """
    CRUD para ChatLog.
    """

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 50
    ) -> List[ChatLog]:
        """
        Lista histórico de chat de um utilizador.
        """
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_session(
        self, db: Session, *, session_id: str
    ) -> List[ChatLog]:
        """
        Lista mensagens de uma sessão específica.
        """
        return (
            db.query(self.model)
            .filter(self.model.session_id == session_id)
            .order_by(self.model.created_at.asc())
            .all()
        )

    def create_log(
        self,
        db: Session,
        *,
        user_id: Optional[int],
        session_id: str,
        message_content: str,
        bot_response: str
    ) -> ChatLog:
        """
        Cria um registo de chat.
        """
        db_obj = self.model(
            user_id=user_id,
            session_id=session_id,
            message_content=message_content,
            bot_response=bot_response
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instância singleton
chat_log = CRUDChatLog(ChatLog)
