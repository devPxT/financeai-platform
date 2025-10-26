    # Etapa 1: Build da aplicação React
FROM node:18-alpine AS builder

WORKDIR /app

# Copia pacotes e instala dependências
COPY package*.json ./
RUN npm ci

# Copia todo o código fonte
COPY . .

# Build do projeto
RUN npm run build

# Etapa 2: Servidor estático com Nginx
FROM nginx:1.27-alpine

# Remove configuração padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build do React para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia uma configuração customizada (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
