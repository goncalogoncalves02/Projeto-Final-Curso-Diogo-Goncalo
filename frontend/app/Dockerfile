# Frontend Dockerfile
FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json primeiro (para cache de layers)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto do código
COPY . .

# Expor porta do Vite
EXPOSE 5173

# Comando para correr em modo desenvolvimento
# O --host 0.0.0.0 é importante para Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
