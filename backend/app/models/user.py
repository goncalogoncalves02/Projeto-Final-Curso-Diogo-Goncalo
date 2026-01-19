"""
Modelo de Utilizador (User)
---------------------------
Este modelo é central na aplicação e representa todos os utilizadores do sistema,
sejam eles Estudantes, Professores, Funcionários da Secretaria ou Administradores.

Funcionalidades principais:
- Autenticação (Email/Password e Social Login)
- Controlo de Acesso (RBAC via campo 'role')
- Segurança (2FA, ativação de conta via email)
- Perfil (Nome, Avatar, Telemóvel)
"""

from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    # Chave Primária
    id = Column(Integer, primary_key=True, index=True)

    # Credenciais e Identificação
    email = Column(
        String, unique=True, index=True, nullable=False, doc="Email único do utilizador"
    )
    hashed_password = Column(
        String,
        nullable=True,
        doc="Hash da password (pode ser nulo se usar login Google/Facebook)",
    )

    # Informações Pessoais
    full_name = Column(String, nullable=True, doc="Nome completo do utilizador")
    phone_number = Column(
        String, nullable=True, doc="Número de telemóvel para contacto rápido"
    )
    avatar_url = Column(String, nullable=True, doc="URL da imagem de perfil")

    # Controlo de Acesso e Estado da Conta
    is_active = Column(
        Boolean,
        default=False,
        doc="Indica se a conta está ativa (geralmente após confirmar email)",
    )
    activation_token = Column(
        String,
        nullable=True,
        doc="Token temporário enviado por email para ativar a conta",
    )
    is_superuser = Column(
        Boolean,
        default=False,
        doc="Se True, tem acesso total ao sistema (Admin supremo)",
    )
    role = Column(
        String,
        default="estudante",
        doc="Papel do utilizador: 'estudante', 'professor', 'secretaria', 'admin'",
    )

    # Social Login (Google, Facebook, etc.)
    auth_provider = Column(
        String,
        default="local",
        doc="Provedor de autenticação: 'local', 'google', 'facebook'",
    )
    provider_id = Column(
        String, nullable=True, doc="ID único do utilizador no provedor externo"
    )

    # Autenticação de Dois Fatores (2FA)
    is_2fa_enabled = Column(
        Boolean, default=False, doc="Se True, exige código OTP no login"
    )
    otp_code = Column(
        String, nullable=True, doc="Código temporário de 6 dígitos para 2FA"
    )
    otp_expires_at = Column(
        String, nullable=True, doc="Data/Hora de expiração do código OTP (ISO format)"
    )

    # Metadados
    created_at = Column(
        DateTime, default=func.now(), doc="Data de registo do utilizador"
    )

    # RELACIONAMENTOS (Ligações com outras tabelas)

    # 1. Ficheiros anexados ao utilizador (CVs, Fichas de inscrição, etc.)
    files = relationship(
        "UserFile", back_populates="user", cascade="all, delete-orphan"
    )

    # 2. Inscrições em cursos (apenas para estudantes)
    enrollments = relationship(
        "Enrollment", back_populates="user", cascade="all, delete-orphan"
    )

    # 3. Módulos que o utilizador leciona (apenas para professores)
    teaching_modules = relationship("CourseModule", back_populates="trainer")

    # 4. Disponibilidade do formador (horários em que pode dar aulas)
    availabilities = relationship(
        "TrainerAvailability", back_populates="trainer", cascade="all, delete-orphan"
    )

    # 5. Histórico de conversas com o ChatBot
    chat_logs = relationship("ChatLog", back_populates="user")
