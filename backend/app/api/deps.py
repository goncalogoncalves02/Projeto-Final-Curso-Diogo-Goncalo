from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.user import User
from app.crud.user import get_user_by_email
from app.schemas.token import TokenData

# Define que o token deve ser enviado no header "Authorization: Bearer <token>"
# O endpoint "login" é onde o cliente obtém o token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_db() -> Generator:
    """
    Dependência para obter sessão da base de dados.
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """
    Valida o token JWT e retorna o utilizador atual.
    Lança exceção se o token for inválido ou o utilizador não existir.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificar o token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    # Buscar utilizador na BD
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Verifica se o utilizador está ativo.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Utilizador inativo")
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Verifica se o utilizador é um superuser (Admin).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O utilizador não tem privilégios suficientes",
        )
    return current_user
