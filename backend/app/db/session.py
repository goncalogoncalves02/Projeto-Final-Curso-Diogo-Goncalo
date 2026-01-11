from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Criação do motor da base de dados (Engine)
# check_same_thread=False é necessário apenas para SQLite
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

# Criação da classe SessionLocal
# Cada instância de SessionLocal será uma sessão de base de dados
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Dependência para obter a sessão da DB nos endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
