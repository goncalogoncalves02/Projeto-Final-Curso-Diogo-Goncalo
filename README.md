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

### Autenticação e Segurança
- Login com email/password (JWT)
- Login com Google OAuth e Facebook OAuth
- Registo de conta com ativação por email
- Recuperação e reset de password
- Perfil de utilizador com upload de foto e telefone
- Proteção de rotas por role (admin, professor, estudante, secretaria)

### BackOffice Admin
- Gestão de utilizadores — CRUD completo com atribuição de roles
- Gestão de cursos — CRUD com estrutura curricular (módulos, professores, salas)
- Gestão de módulos e salas — Catálogo com área, duração e capacidade
- Gestão de inscrições — Inscrever alunos em cursos
- Lançamento de notas — Por módulo e aluno com comentários
- Disponibilidade de professores — Horários recorrentes e pontuais com validação de overlaps
- Upload de ficheiros — Anexar documentos a perfis de formandos e formadores

### Sistema de Horários
- Calendário gráfico interativo (vistas mês, semana, dia, agenda)
- Validação de conflitos de sala, professor e limite de horas
- Geração automática de horários — Algoritmo greedy com distribuição equilibrada
- Suporte para horários diurno (08-15h) e noturno (16-23h)
- Preview e confirmação antes de aplicar horário gerado
- Cores diferenciadas para aulas passadas (laranja) e futuras (azul)
- Tabela de horas por módulo com barras de progresso

### Dashboards por Role
- **Admin** — Estatísticas com gráficos (Chart.js), cursos a decorrer e a iniciar, pesquisa unificada
- **Professor** — Aulas de hoje, próximas aulas, horas da semana, cursos que leciona
- **Estudante** — Inscrições ativas, aulas de hoje, próximas aulas, notas e médias

### ChatBot com IA
- Widget flutuante disponível em todas as páginas
- Integrado com OpenAI (Function Calling)
- Responde sobre aulas, horários e cursos da ATEC
- Ferramentas contextuais por role do utilizador

### Exportação PDF
- Ficha de formando — dados pessoais, foto, cursos, notas por módulo, nota final (média)
- Ficha de formador — dados pessoais, foto, módulos lecionados, horas lecionadas vs total

### Aplicação Mobile (Android)
- App nativa em Kotlin com Material Design 3
- Login com autenticação JWT
- Consulta de cursos, formandos, formadores e salas
- Detalhes de curso com módulos e inscrições
- Horário por sala
- Perfil do utilizador

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic |
| Frontend | React 19, Vite 7, TailwindCSS 4, React Router 7 |
| Mobile | Kotlin, Android SDK 34, Retrofit 2.9, Material Design 3 |
| Base de Dados | SQLite |
| Autenticação | JWT (python-jose), Argon2, OAuth2 (Google, Facebook) |
| ChatBot IA | OpenAI API com Function Calling |
| Geração PDF | fpdf2 |
| Calendário | react-big-calendar + date-fns |
| Gráficos | Chart.js + react-chartjs-2 |
| Ícones | Lucide React |
| Container | Docker + Docker Compose |

---

## Início Rápido (Docker)

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

Para reconstruir após alterações ao Dockerfile ou dependências:
```bash
docker-compose up --build
```

> O hot reload está configurado — editar código atualiza automaticamente tanto o backend como o frontend.

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

# Instalar dependências
pip install -r requirements.txt

# Correr servidor
uvicorn app.main:app --reload
# API disponível em http://localhost:8000
# Swagger em http://localhost:8000/docs
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

### Mobile (Android)

```bash
# Abrir a pasta mobile/ no Android Studio
# Sincronizar Gradle
# Correr num emulador ou dispositivo físico
```

> A app mobile liga-se a `http://10.0.2.2:8000` (mapeamento do localhost no emulador Android). O backend precisa de estar a correr.

---

## Configuração

Cria um ficheiro `.env` na raiz do projeto (ou copia de `.env.example`):

```env
# Obrigatório
SECRET_KEY=uma-chave-secreta-segura

# Email (ativação de conta e reset de password)
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

# OpenAI - ChatBot (opcional mas necessário para o chatbot funcionar)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Para o Gmail, usa uma [App Password](https://support.google.com/accounts/answer/185833) em vez da password normal.

---

## Estrutura do Projeto

```
├── backend/                     # API FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/                 # Dependências (autenticação)
│   │   ├── core/                # Config, security, email
│   │   ├── crud/                # Camada CRUD centralizada (11 ficheiros)
│   │   ├── db/                  # Sessão e base SQLAlchemy
│   │   ├── models/              # 12 modelos SQLAlchemy
│   │   ├── routers/             # 16 routers de API
│   │   ├── schemas/             # Schemas Pydantic
│   │   ├── services/            # ChatBot, PDF, gerador de horários
│   │   └── main.py
│   ├── alembic/                 # Migrações de base de dados
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
├── docker-compose.yml           # Orquestração backend + frontend
├── .env.example                 # Template de variáveis de ambiente
└── README.md
```

---

## Arquitetura

### Backend

O backend segue uma arquitetura em camadas com separação clara de responsabilidades:

- **Models** — Definição das tabelas (SQLAlchemy)
- **Schemas** — Validação de entrada/saída (Pydantic)
- **CRUD** — Operações de base de dados com classe base genérica
- **Routers** — Endpoints HTTP e autorização
- **Services** — Lógica de negócio complexa (chatbot, geração de horários, PDF)

### Frontend

O frontend está organizado por role de utilizador, com proteção de rotas:

| Role | Acesso |
|------|--------|
| `admin` | Acesso total a todas as funcionalidades |
| `professor` | Calendário pessoal, disponibilidade, consultas |
| `estudante` | Calendário das turmas, notas, consultas |

> Utilizadores com `is_superuser=True` têm acesso total independentemente do role.

### Mobile

App nativa Android com arquitetura baseada em Activities, utilizando Retrofit para comunicação com a API REST e DataStore para gestão de tokens JWT.

---

## Endpoints da API

| Router | Endpoints Principais |
|--------|---------------------|
| Auth | Login, register, OAuth, verify-email, reset-password |
| Users | CRUD utilizadores, upload avatar, perfil |
| Courses | CRUD cursos, estrutura curricular, horas por módulo |
| Modules | CRUD módulos |
| Classrooms | CRUD salas |
| Enrollments | CRUD inscrições |
| Module Grades | CRUD notas |
| Lessons | CRUD aulas, por curso/professor/sala, horário pessoal |
| Trainer Availability | CRUD disponibilidade com validação de overlaps |
| Schedule Generator | Preview e geração automática de horários |
| Statistics | Dashboard stats, cursos a decorrer/iniciar |
| Search | Pesquisa paginada de cursos, estudantes e professores |
| ChatBot | Envio de mensagens e histórico |
| Exports | Fichas PDF de formando e formador |
| User Files | Upload, listagem, download e eliminação de ficheiros |

Documentação interativa da API disponível em `http://localhost:8000/docs` (Swagger UI).

---

## Portas

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## Autores

- **Gonçalo Gonçalves**
- **Diogo Bilreiro**

---

## Licença

Este projeto é para fins educativos — Projeto Final ATEC 2026.
