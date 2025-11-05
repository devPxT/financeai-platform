#     # Etapa 1: Build da aplicação React
# FROM node:18-alpine AS builder

# WORKDIR /app

# # Copia pacotes e instala dependências
# COPY package*.json ./
# RUN npm ci

# # Copia todo o código fonte
# COPY . .

# # Build do projeto
# RUN npm run build

# # Etapa 2: Servidor estático com Nginx
# FROM nginx:1.27-alpine

# # Remove configuração padrão do Nginx
# RUN rm -rf /usr/share/nginx/html/*

# # Copia o build do React para o Nginx
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Copia uma configuração customizada (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 3000
# CMD ["nginx", "-g", "daemon off;"]

# Multi-stage: build (Node) -> serve (Nginx)
FROM node:18-alpine AS build
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código e builda
COPY . .
# Passe valores em build-arg para Vite (opcional)
ARG VITE_BFF_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_DEMO_USER_TOKEN
ENV VITE_BFF_URL=$VITE_BFF_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_DEMO_USER_TOKEN=$VITE_DEMO_USER_TOKEN
RUN npm run build

# Servir estático
FROM nginx:alpine
# Nginx com fallback SPA (index.html para rotas do React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
