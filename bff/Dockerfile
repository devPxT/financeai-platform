# bff/Dockerfile
FROM node:18-alpine

# workdir
WORKDIR /app

# copiar package.json e package-lock.json primeiro para otimizar cache
COPY package*.json ./

# instalar apenas dependências de produção (mais leve)
RUN npm ci --only=production

# copiar o restante da app
COPY . .

# expor porta que o BFF usa (configure se for outra)
EXPOSE 4000

# entrypoint
CMD ["node", "bff.js"]
