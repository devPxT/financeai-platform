FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
# Copia node_modules prontos
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Segurança: criar usuário não-root
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 4000
# Ajuste se o arquivo principal é bff.js
CMD ["node", "bff.js"]