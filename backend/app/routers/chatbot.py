"""
Router do ChatBot
-----------------
Endpoint para interação com o assistente virtual.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api import deps
from app.schemas.chat_log import ChatMessage, ChatResponse, ChatLog
from app.services.chatbot import chatbot_service
from app.crud import chat_log as chat_log_crud
from app.models.user import User

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(
    chat_in: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Envia uma mensagem ao ChatBot e recebe a resposta.

    O ChatBot usa Function Calling para consultar dados reais da BD
    baseando-se no role do utilizador autenticado.
    """
    # Gerar session_id se não fornecido
    session_id = chat_in.session_id or str(uuid.uuid4())

    try:
        # Obter histórico da sessão para contexto (últimas 10 mensagens)
        history_logs = chat_log_crud.get_by_session(db, session_id=session_id)

        conversation_history = []
        for log in history_logs[-10:]:  # Limitar a 10 mensagens
            conversation_history.append({"role": "user", "content": log.message_content})
            conversation_history.append({"role": "assistant", "content": log.bot_response})

        # Processar mensagem
        response = chatbot_service.chat(
            message=chat_in.message,
            user=current_user,
            db=db,
            conversation_history=conversation_history if conversation_history else None
        )

        # Guardar no histórico
        chat_log_crud.create_log(
            db,
            user_id=current_user.id,
            session_id=session_id,
            message_content=chat_in.message,
            bot_response=response
        )

        return ChatResponse(response=response, session_id=session_id)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar mensagem: {str(e)}"
        )


@router.get("/history", response_model=list[ChatLog])
async def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 50,
):
    """
    Obtém o histórico de conversas do utilizador.
    """
    return chat_log_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
