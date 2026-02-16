# Sistema de Gestão Escolar ATEC

Sistema completo de gestão para a secretaria da ATEC, com aplicação web (backoffice + frontend), aplicação mobile Android e chatbot com inteligência artificial. Desenvolvido como projeto final do curso **TPSI-PAL0525** (Especialista em Tecnologias e Programação de Sistemas de Informação).

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=flat&logo=kotlin&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=flat&logo=android&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)

---

## Funcionalidades

### Autenticacao e Seguranca
- Login com email/password (JWT)
- Login com Google OAuth e Facebook OAuth
- Registo de conta com ativacao por email
- Recuperacao e reset de password
- Perfil de utilizador com upload de foto e telefone
- Protecao de rotas por role (admin, professor, estudante, secretaria)

### BackOffice Admin
- Gestao de utilizadores — CRUD completo com atribuicao de roles
- Gestao de cursos — CRUD com estrutura curricular (modulos, professores, salas)
- Gestao de modulos e salas — Catalogo com area, duracao e capacidade
- Gestao de inscricoes — Inscrever alunos em cursos
- Lancamento de notas — Por modulo e aluno com comentarios
- Disponibilidade de professores — Horarios recorrentes e pontuais com validacao de overlaps
- Upload de ficheiros — Anexar documentos a perfis de formandos e formadores

### Sistema de Horarios
- Calendario grafico interativo (vistas mes, semana, dia, agenda)
- Validacao de conflitos de sala, professor e limite de horas
- Geracao automatica de horarios — Algoritmo greedy com distribuicao equilibrada
- Suporte para horarios diurno (08-15h) e noturno (16-23h)
- Preview e confirmacao antes de aplicar horario gerado
- Cores diferenciadas para aulas passadas (laranja) e futuras (azul)
- Tabela de horas por modulo com barras de progresso

### Dashboards por Role
- **Admin** — Estatisticas com graficos (Chart.js), cursos a decorrer e a iniciar, pesquisa unificada
- **Professor** — Aulas de hoje, proximas aulas, horas da semana, cursos que leciona
- **Estudante** — Inscricoes ativas, aulas de hoje, proximas aulas, notas e medias

### ChatBot com IA
- Widget flutuante disponivel em todas as paginas
- Integrado com OpenAI (Function Calling)
- Responde sobre aulas, horarios e cursos da ATEC
- Ferramentas contextuais por role do utilizador

### Exportacao PDF
- Ficha de formando — dados pessoais, foto, cursos, notas por modulo, nota final (media)
- Ficha de formador — dados pessoais, foto, modulos lecionados, horas lecionadas vs total

### Aplicacao Mobile (Android)
- App nativa em Kotlin com Material Design 3
- Login com autenticacao JWT
- Consulta de cursos, formandos, formadores e salas
- Detalhes de curso com modulos e inscricoes
- Horario por sala
- Perfil do utilizador

---

## Stack Tecnologico

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic |
| Frontend | React 19, Vite 7, TailwindCSS 4, React Router 7 |
| Mobile | Kotlin, Android SDK 34, Retrofit 2.9, Material Design 3 |
| Base de Dados | SQLite |
| Autenticacao | JWT (python-jose), Argon2, OAuth2 (Google, Facebook) |
| ChatBot IA | OpenAI API com Function Calling |
| Geracao PDF | fpdf2 |
| Calendario | react-big-calendar + date-fns |
| Graficos | Chart.js + react-chartjs-2 |
| Icones | Lucide React |
| Container | Docker + Docker Compose |

---

## Inicio Rapido (Docker)

A forma mais facil de correr o projeto e com Docker.

### Pre-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado

### Passos

```bash
# 1. Clonar o repositorio
git clone https://github.com/goncalogoncalves02/Projeto-Final-Curso-Diogo-Goncalo.git
cd Projeto-Final-Curso-Diogo-Goncalo

# 2. Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com os seus valores (ver seccao Configuracao)

# 3. Iniciar com Docker
docker-compose up

# 4. Abrir no browser
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
```

Para parar: `Ctrl+C` ou `docker-compose down`

Para reconstruir apos alteracoes ao Dockerfile ou dependencias:
```bash
docker-compose up --build
```

> O hot reload esta configurado — editar codigo atualiza automaticamente tanto o backend como o frontend.

---

## Desenvolvimento Local (Sem Docker)

### Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
.\venv\Scripts\Activate.ps1

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Correr servidor
uvicorn app.main:app --reload
# API disponivel em http://localhost:8000
# Swagger em http://localhost:8000/docs
```

### Frontend (React + Vite)

```bash
cd frontend/app

# Instalar dependencias
npm install

# Correr servidor de desenvolvimento
npm run dev
# Aplicacao disponivel em http://localhost:5173
```

### Mobile (Android)

```bash
# Abrir a pasta mobile/ no Android Studio
# Sincronizar Gradle
# Correr num emulador ou dispositivo fisico
```

> A app mobile liga-se a `http://10.0.2.2:8000` (mapeamento do localhost no emulador Android). O backend precisa de estar a correr.

---

## Configuracao

Cria um ficheiro `.env` na raiz do projeto (ou copia de `.env.example`):

```env
# Obrigatorio
SECRET_KEY=uma-chave-secreta-segura

# Email (ativacao de conta e reset de password)
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-app-password
MAIL_FROM=seu-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Facebook OAuth (opcional)
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# OpenAI - ChatBot (opcional mas necessario para o chatbot funcionar)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Para o Gmail, usa uma [App Password](https://support.google.com/accounts/answer/185833) em vez da password normal.

---

## Estrutura do Projeto

```
├── backend/                     # API FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/                 # Dependencias (autenticacao)
│   │   ├── core/                # Config, security, email
│   │   ├── crud/                # Camada CRUD centralizada (11 ficheiros)
│   │   ├── db/                  # Sessao e base SQLAlchemy
│   │   ├── models/              # 12 modelos SQLAlchemy
│   │   ├── routers/             # 16 routers de API
│   │   ├── schemas/             # Schemas Pydantic
│   │   ├── services/            # ChatBot, PDF, gerador de horarios
│   │   └── main.py
│   ├── alembic/                 # Migracoes de base de dados
│   ├── uploads/                 # Ficheiros e avatares
│   └── Dockerfile
├── frontend/                    # React 19 + Vite + TailwindCSS
│   └── app/src/
│       ├── api/                 # Axios com interceptors JWT
│       ├── components/
│       │   ├── layout/          # Layout, Header, Sidebar
│       │   └── ui/              # Modal, Pagination, SearchBar, etc.
│       ├── context/             # AuthContext
│       ├── pages/
│       │   ├── auth/            # Login, Register, Verify, Reset
│       │   ├── admin/           # Dashboard, Users, Courses, Schedule...
│       │   ├── professor/       # Dashboard, Availability
│       │   ├── student/         # Dashboard
│       │   └── shared/          # Profile, ScheduleView
│       ├── routes/              # PrivateRoute, RoleRoute
│       └── utils/               # Helpers partilhados
├── mobile/                      # App Android nativa (Kotlin)
│   └── app/src/main/
│       ├── java/com/atec/gestao/
│       │   ├── data/            # API (Retrofit), models, token
│       │   └── ui/              # Activities (Login, Courses, etc.)
│       └── res/                 # Layouts, drawables, values
├── docker-compose.yml           # Orquestracao backend + frontend
├── .env.example                 # Template de variaveis de ambiente
└── README.md
```

---

## Arquitetura

### Backend

O backend segue uma arquitetura em camadas com separacao clara de responsabilidades:

- **Models** — Definicao das tabelas (SQLAlchemy)
- **Schemas** — Validacao de entrada/saida (Pydantic)
- **CRUD** — Operacoes de base de dados com classe base generica
- **Routers** — Endpoints HTTP e autorizacao
- **Services** — Logica de negocio complexa (chatbot, geracao de horarios, PDF)

### Frontend

O frontend esta organizado por role de utilizador, com protecao de rotas:

| Role | Acesso |
|------|--------|
| `admin` | Acesso total a todas as funcionalidades |
| `professor` | Calendario pessoal, disponibilidade, consultas |
| `estudante` | Calendario das turmas, notas, consultas |

> Utilizadores com `is_superuser=True` tem acesso total independentemente do role.

### Mobile

App nativa Android com arquitetura baseada em Activities, utilizando Retrofit para comunicacao com a API REST e DataStore para gestao de tokens JWT.

---

## Endpoints da API

| Router | Endpoints Principais |
|--------|---------------------|
| Auth | Login, register, OAuth, verify-email, reset-password |
| Users | CRUD utilizadores, upload avatar, perfil |
| Courses | CRUD cursos, estrutura curricular, horas por modulo |
| Modules | CRUD modulos |
| Classrooms | CRUD salas |
| Enrollments | CRUD inscricoes |
| Module Grades | CRUD notas |
| Lessons | CRUD aulas, por curso/professor/sala, horario pessoal |
| Trainer Availability | CRUD disponibilidade com validacao de overlaps |
| Schedule Generator | Preview e geracao automatica de horarios |
| Statistics | Dashboard stats, cursos a decorrer/iniciar |
| Search | Pesquisa paginada de cursos, estudantes e professores |
| ChatBot | Envio de mensagens e historico |
| Exports | Fichas PDF de formando e formador |
| User Files | Upload, listagem, download e eliminacao de ficheiros |

Documentacao interativa da API disponivel em `http://localhost:8000/docs` (Swagger UI).

---

## Portas

| Servico | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## Autores

- **Goncalo Goncalves**
- **Diogo Bilreiro**

---

## Licenca

Este projeto e para fins educativos — Projeto Final ATEC 2026.
