# Backend Dockerfile
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primeiro (para cache de layers)
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o resto do código
COPY . .

# Criar pasta para uploads
RUN mkdir -p uploads

# Expor porta
EXPOSE 8000

# Comando para correr a aplicação
# O --host 0.0.0.0 é importante para Docker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
