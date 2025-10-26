# FinanceAI - Monorepo (MFE + BFF + Microservices + Azure Functions)

## Estrutura
- /mfe — React + Vite (frontend)
- /bff — Backend-for-Frontend (Express)
- /services/transactions-service — Node + MongoDB (desenhado para MongoDB Atlas)
- /services/analytics-service — Node + Azure SQL (desenhado para Azure SQL)
- /functions — Azure Functions (createTransaction, functionContext)
- docker-compose.yml — opcional para dev local

## Passos rápidos (dev)
1. Clone repo.
2. Configure envs:
   - `bff/.env` (BFF keys, OPENAI, STRIPE, service urls)
   - `services/transactions-service/.env` (MONGO_URI -> Atlas)
   - `services/analytics-service/.env` (Azure SQL connection)
   - `mfe/.env` (VITE_BFF_URL, Clerk publishable key)
3. Para dev rápido sem Atlas/Azure SQL:
   - usar `docker-compose up` (levanta containers locais: mongo, mssql, services, bff, mfe, functions mock)
4. Instalar e rodar local (sem Docker):
   - Em cada pasta: `npm install` e `npm start` (ou `npm run dev`).
5. Testes:
   - Acesse `http://localhost:3000` (MFE).
   - BFF: `http://localhost:4000/bff/health`
   - Transactions: `http://localhost:4100/api-docs`
   - Analytics: `http://localhost:4200/api-docs`

## Produção
- Use MongoDB Atlas (setar MONGO_URI no transactions-service).
- Use Azure SQL (criar banco, setar AZURE_SQL_* no analytics-service).
- Deploy functions no Azure Functions (definir envs).
- Configure Stripe webhooks apontando para `/bff/stripe-webhook`.
- Configure Clerk (MOCK_AUTH=false) e defina `CLERK_JWKS_URI` e `CLERK_AUDIENCE` no BFF.

