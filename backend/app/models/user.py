from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    """
    Modelo de Utilizador para a Base de Dados.
    Representa a tabela 'users'.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Informações pessoais básicas
    full_name = Column(String, nullable=True)

    # Controlos de acesso e estado
    is_active = Column(Boolean, default=False)  # Para validação de email
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default="estudante")  # 'estudante', 'professor', 'admin'

    # Autenticação de Dois Fatores (2FA) - Email OTP
    is_2fa_enabled = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(
        String, nullable=True
    )  # Guardar como timestamp ou datetime string

    # Novos campos
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relacionamentos (Back Populates)
    files = relationship(
        "UserFile", back_populates="user", cascade="all, delete-orphan"
    )
    enrollments = relationship(
        "Enrollment", back_populates="user", cascade="all, delete-orphan"
    )
    teaching_modules = relationship("CourseModule", back_populates="trainer")
