# transactions-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar dependências
COPY package*.json ./

RUN npm ci --only=production

# Copiar código
COPY . .

# Expor a porta do serviço
EXPOSE 4100

# Rodar o serviço
CMD ["node", "index.js"]
