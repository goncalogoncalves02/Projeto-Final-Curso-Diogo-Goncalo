# 🐳 Docker - Guia Rápido

## Pré-requisitos

1. **Instalar Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. Após instalar, abrir Docker Desktop e aguardar que inicie

---

## Comandos Principais

### Iniciar o projeto

```bash
# Na pasta raiz do projeto (onde está o docker-compose.yml)
docker-compose up
```

A primeira vez demora alguns minutos (download de imagens + instalação).
Depois de ver as mensagens de "running", abre:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

### Parar o projeto

```bash
# Ctrl+C no terminal onde está a correr
# OU
docker-compose down
```

### Correr em background (sem ocupar terminal)

```bash
docker-compose up -d       # Inicia
docker-compose logs -f     # Ver logs
docker-compose down        # Parar
```

### Reconstruir após mudanças no Dockerfile/requirements

```bash
docker-compose up --build
```

---

## Hot Reload (Atualização Automática)

✅ **Funciona!** Os volumes estão configurados para que:

- Editas código no VS Code → Guarda → Backend/Frontend atualizam automaticamente

O `--reload` do FastAPI e o Vite HMR funcionam normalmente.

---

## Variáveis de Ambiente

Cria um ficheiro `.env` na raiz do projeto:

```env
# Segurança
SECRET_KEY=a-tua-chave-secreta-aqui

# Email (opcional)
MAIL_USERNAME=email@gmail.com
MAIL_PASSWORD=app-password
MAIL_FROM=email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## Base de Dados

- O SQLite fica guardado num **volume Docker** (`sqlite-data`)
- Persiste entre reinícios
- Para resetar a BD completamente:
  ```bash
  docker-compose down -v   # -v remove volumes
  docker-compose up
  ```

---

## Problemas Comuns

### "Cannot connect to the Docker daemon"

→ Docker Desktop não está a correr. Abre a aplicação Docker Desktop.

### "Port 8000/5173 already in use"

→ Já tens algo a correr nessa porta. Para os processos locais ou muda as portas no docker-compose.yml.

### "npm install fails"

→ Apaga a pasta `node_modules` local e tenta novamente:

```bash
rm -rf frontend/app/node_modules
docker-compose up --build
```

---

## Para o Professor/Colega

Eles só precisam de:

1. Instalar Docker Desktop
2. Clonar o repositório
3. Correr `docker-compose up`
4. Abrir http://localhost:5173

**Não precisam de instalar Python, Node, ou qualquer dependência!**
