from contextlib import asynccontextmanager
import asyncio
import logging

from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine, SessionLocal
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
    statistics,
    user_files,
    lessons,
    search,
)

from fastapi.staticfiles import StaticFiles
import os

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings

# Serviço de atualização automática de status dos cursos
from app.services.course_status_updater import (
    update_course_statuses,
    course_status_scheduler,
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cria as tabelas na base de dados (caso não existam)
# Em produção, usaremos Alembic para migrações, mas aqui o create_all serve
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager para inicialização e limpeza da aplicação.
    - Startup: Atualiza status dos cursos e inicia scheduler
    - Shutdown: Cancela o scheduler
    """
    # === STARTUP ===
    logger.info("A iniciar aplicação...")

    # Atualizar status dos cursos imediatamente ao iniciar
    db = SessionLocal()
    try:
        result = update_course_statuses(db)
        if result["to_active"] or result["to_finished"]:
            logger.info(
                f"Status de cursos atualizado no startup: "
                f"{result['to_active']} -> active, {result['to_finished']} -> finished"
            )
    finally:
        db.close()

    # Iniciar scheduler em background (verifica a cada 60 minutos)
    scheduler_task = asyncio.create_task(course_status_scheduler(interval_minutes=60))

    yield  # Aplicação a correr

    # === SHUTDOWN ===
    logger.info("A encerrar aplicação...")
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="ATEC Gestão Escolar API",
    description="API para gestão de escola com autenticação avançada",
    version="1.0.0",
    lifespan=lifespan,
)

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
app.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
app.include_router(user_files.router, prefix="/users", tags=["user_files"])
app.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
app.include_router(search.router, prefix="/search", tags=["search"])

# Montar pasta de uploads como estática (backend/uploads/)
uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")
