from typing import Optional
from pydantic import BaseModel, EmailStr


# Propriedades partilhadas (Base)
class UserBase(BaseModel):
    email: EmailStr
    is_active: Optional[bool] = False  # Por omissão, inativo até validar email
    is_superuser: bool = False
    full_name: Optional[str] = None
    role: str = "estudante"


# Propriedades para receber na criação de conta (API input)
class UserCreate(UserBase):
    password: str


# Propriedades para atualizar conta (API input)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_2fa_enabled: Optional[bool] = None
    full_name: Optional[str] = None
    role: Optional[str] = None


# Propriedades para devolver ao cliente (API output)
# Omitimos a password aqui por segurança!
class User(UserBase):
    id: int
    is_2fa_enabled: bool

    class Config:
        orm_mode = True  # Permite ler dados diretamente dos modelos SQLAlchemy


# Schema para Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str
