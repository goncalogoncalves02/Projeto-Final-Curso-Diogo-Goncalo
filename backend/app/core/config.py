import os
from dotenv import load_dotenv

load_dotenv()

# Definições de configuração do projeto
# Em um ambiente real, valores como SECRET_KEY devem vir de variáveis de ambiente


class Settings:
    PROJECT_NAME: str = "ATEC Gestão Escolar"
    PROJECT_VERSION: str = "1.0.0"

    # Chave secreta para assinar tokens JWT (JSON Web Tokens)
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    # Tempo de expiração do token de acesso em minutos
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Configuração da Base de Dados (SQLite por enquanto para facilidade)
    # O ficheiro será criado na pasta backend
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Configuração de Email
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER")
    MAIL_FROM_NAME: str = "ATEC Gestão Escolar"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET")


settings = Settings()
