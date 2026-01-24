from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine
from app import (
    models,
)  # Importar todos os modelos para garantir que são criados (via __init__.py)

# Incluir routers
from app.routers import (
    auth,
    users,
    modules,
    classrooms,
    courses,
    trainer_availability,
    enrollments,
    module_grades,
)

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings

app = FastAPI(
    title="ATEC Gestão Escolar API",
    description="API para gestão de escola com autenticação avançada",
    version="1.0.0",
)

# Cria as tabelas na base de dados (caso não existam)
# Em produção, usaremos Alembic para migrações, mas aqui o create_all serve
Base.metadata.create_all(bind=engine)

# Session Middleware é necessário para o OAuth (gerir estados)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Configuração CORS (Cross-Origin Resource Sharing)
# Permite que o Frontend (React) comunique com este Backend
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """
    Endpoint de teste para verificar se a API está a correr.
    """
    return {"message": "Bem-vindo à API da ATEC! O sistema está online."}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(modules.router, prefix="/modules", tags=["modules"])
app.include_router(classrooms.router, prefix="/classrooms", tags=["classrooms"])
app.include_router(courses.router, prefix="/courses", tags=["courses"])
app.include_router(
    trainer_availability.router, prefix="/availability", tags=["availability"]
)
app.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
app.include_router(
    module_grades.router, prefix="/module_grades", tags=["module_grades"]
)
