from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
)


async def send_verification_email(email_to: str, token: str):
    """
    Envia email de verificação de conta.
    """
    html = f"""
    <h3>Bem-vindo à ATEC!</h3>
    <p>Por favor, confirma a tua conta clicando no link abaixo:</p>
    <a href="http://localhost:5173/verify-email?token={token}">Confirmar Email</a>
    <p>Este link expira em 24 horas.</p>
    <br>
    <p>Se não pediste este registo, ignora este email.</p>
    """

    message = MessageSchema(
        subject="Confirmação de Registo - ATEC",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"ERRO ao enviar email: {e}")


async def send_reset_password_email(email_to: str, token: str):
    """
    Envia email para redefinição de password.
    """
    html = f"""
    <h3>Recuperação de Password - ATEC</h3>
    <p>Recebemos um pedido para redefinir a tua password.</p>
    <p>Clica no link abaixo para criar uma nova password:</p>
    <a href="http://localhost:5173/reset-password?token={token}">Redefinir Password</a>
    <p>Este link expira em 1 hora.</p>
    <br>
    <p>Se não pediste esta alteração, ignora este email.</p>
    """

    message = MessageSchema(
        subject="Recuperação de Password - ATEC",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"ERRO ao enviar email de reset: {e}")


async def send_2fa_email(email_to: str, code: str):
    """
    Envia email com código de autenticação (2FA).
    """
    html = f"""
    <h3>Código de Autenticação - ATEC</h3>
    <p>O teu código de verificação é:</p>
    <h2 style="background-color: #f3f4f6; padding: 10px; display: inline-block; letter-spacing: 5px;">{code}</h2>
    <p>Este código expira em 5 minutos.</p>
    <br>
    <p>Se não tentaste fazer login, altera a tua password imediatamente.</p>
    """

    message = MessageSchema(
        subject="Código de Verificação 2FA - ATEC",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"ERRO ao enviar email 2FA: {e}")
