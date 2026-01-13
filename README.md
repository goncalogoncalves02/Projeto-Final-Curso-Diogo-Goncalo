# Projeto Final - Gestão Escolar ATEC

Este projeto é uma aplicação web completa com Backend (FastAPI) e Frontend (React), incluindo autenticação avançada, 2FA e gestão de utilizadores.

## 📋 Pré-requisitos

- **Node.js** (v18 ou superior)
- **Python** (v3.9 ou superior)
- **Git**

---

## 🚀 Como Correr o Projeto

### 1. Configurar o Backend (API)

O backend é feito em Python com FastAPI.

1.  Abra um terminal e entre na pasta `backend`:

    ```bash
    cd backend
    ```

2.  Crie um ambiente virtual (venv) para isolar as dependências:

    ```bash
    python -m venv venv
    ```

3.  Ative o ambiente virtual:

    - **Windows:** `venv\Scripts\activate`
    - **Mac/Linux:** `source venv/bin/activate`

4.  Instale as bibliotecas necessárias:

    ```bash
    pip install -r requirements.txt
    ```

5.  Configure as variáveis de ambiente:

    - Copie o ficheiro `.env.example` para um novo ficheiro chamado `.env`.
    - Edite o `.env` e coloque os seus dados (Email, Password de Aplicação Google, Chaves Secretas).

6.  Inicie o servidor:
    ```bash
    uvicorn app.main:app --reload
    ```
    _O servidor ficará disponível em: `http://localhost:8000`_

---

### 2. Configurar o Frontend (Interface)

O frontend é feito em React com Vite.

1.  Abra **outro** terminal e entre na pasta `frontend/app`:

    ```bash
    cd frontend/app
    ```

2.  Instale as dependências:

    ```bash
    npm install
    ```

3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    _A aplicação abrirá em: `http://localhost:5173`_

---

## 🛠️ Tecnologias Usadas

- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic, Argon2, JWT.
- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router.
- **Funcionalidades:** Login, Registo, Recuperação de Password, 2FA (Email), Google Login, Painel de Admin.
