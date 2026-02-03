# 🎓 Sistema de Gestão Escolar ATEC

Sistema completo de gestão para a secretaria da ATEC, desenvolvido como projeto final do curso TPSI-PAL0525.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

## ✨ Funcionalidades

- 🔐 **Autenticação** - Login, Registo, OAuth (Google), Recuperação de Password
- 👥 **Gestão de Utilizadores** - Admin, Professores, Estudantes, Secretaria
- 📚 **Gestão de Cursos** - CRUD com estrutura curricular (módulos/professores/salas)
- 🏫 **Gestão de Salas e Módulos** - Catálogo completo
- 📅 **Sistema de Horários** - Calendário gráfico com validações de conflitos
- 📝 **Lançamento de Notas** - Por módulo e aluno
- 📊 **Dashboard** - Estatísticas e gráficos
- 📎 **Anexar Ficheiros** - Upload de documentos para perfis

---

## 🚀 Início Rápido (Docker)

A forma mais fácil de correr o projeto é com Docker.

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado

### Passos

```bash
# 1. Clonar o repositório
git clone https://github.com/goncalogoncalves02/Projeto-Final-Curso-Diogo-Goncalo.git
cd Projeto-Final-Curso-Diogo-Goncalo

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com os seus valores (ver secção Configuração)

# 3. Iniciar com Docker
docker-compose up

# 4. Abrir no browser
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
```

Para parar: `Ctrl+C` ou `docker-compose down`

---

## 🛠️ Desenvolvimento Local (Sem Docker)

Se preferires desenvolver sem Docker:

### Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
.\venv\Scripts\Activate.ps1

# Instalar dependências
pip install -r requirements.txt

# Correr servidor
uvicorn app.main:app --reload
# API disponível em http://localhost:8000
```

### Frontend (React + Vite)

```bash
cd frontend/app

# Instalar dependências
npm install

# Correr servidor de desenvolvimento
npm run dev
# Aplicação disponível em http://localhost:5173
```

---

## ⚙️ Configuração

Cria um ficheiro `.env` na raiz do projeto (ou copia de `.env.example`):

```env
# Obrigatório
SECRET_KEY=uma-chave-secreta-segura

# Email (para ativação de conta e reset password)
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-app-password
MAIL_FROM=seu-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

> 💡 **Dica:** Para o Gmail, usa uma [App Password](https://support.google.com/accounts/answer/185833) em vez da password normal.

---

## 📁 Estrutura do Projeto

```
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── routers/        # Endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   └── schemas/        # Pydantic schemas
│   └── Dockerfile
├── frontend/               # React + Vite
│   └── app/
│       ├── src/pages/      # Páginas
│       ├── src/components/ # Componentes
│       └── Dockerfile
├── docker-compose.yml      # Orquestração
└── .env.example           # Template de configuração
```

---

## 🧰 Tecnologias

| Camada        | Tecnologia                       |
| ------------- | -------------------------------- |
| Backend       | Python 3.11, FastAPI, SQLAlchemy |
| Frontend      | React 18, Vite, TailwindCSS      |
| Base de Dados | SQLite                           |
| Autenticação  | JWT, OAuth2, bcrypt              |
| Container     | Docker, Docker Compose           |

---

## 👥 Autores

- **Gonçalo Gonçalves** - [GitHub](https://github.com/goncalogoncalves02)
- **Diogo** - Colaborador

---

## 📄 Licença

Este projeto é para fins educativos - Projeto Final ATEC 2026.
