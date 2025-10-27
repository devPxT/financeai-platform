# FinanceAI — Monorepo (MFE + BFF + Microservices + Azure Functions)

**Alunos:** Arthur Hermes, Augusto Sinja, Eduardo Mesquita, Kauã Gabriel, Ricardo Amaro

> Repositório monolítico contendo: Micro Frontend (React/Vite), Backend-for-Frontend (Node/Express), dois microservices (Transactions — MongoDB Atlas; Analytics — Azure SQL), e duas Azure Functions (createTransaction, functionContext). Projetado para desenvolvimento local e deploy em nuvem.

---

## GitHub e Docker

* https://github.com/devPxT/financeai-platform
* https://hub.docker.com/repositories/devpxt

---

## Estrutura do repositório

```
financeai-platform/
├─ mfe/                      # Microfrontend (React + Vite)
├─ bff/                      # Backend-for-Frontend (Express)
├─ services/
│  ├─ transactions-service/  # Microservice 1 (Node + MongoDB Atlas)
│  └─ analytics-service/     # Microservice 2 (Node + Azure SQL)
├─ functions/                # Azure Functions (createTransaction, functionContext)
├─ docker-compose.yml        # Opcional: ambiente dev com containers (mongo, mssql, ...)
└─ README.md                 # Este arquivo
```

---

# Rápido — requisitos e ferramentas

* Node.js (recomendado **v18 LTS** para máxima compatibilidade com Azure libs; se usar Node 22, alguns pacotes podem emitir `EBADENGINE` warnings)
* npm (ou pnpm/yarn)
* Docker (opcional, para levantar Mongo / SQL local rapidamente)
* Azure CLI / Azure Functions Core Tools (se for testar funções localmente)
* Conta MongoDB Atlas (free) e Azure SQL (ou container mssql para dev)
* Conta Clerk (opcional em dev, pode usar token `demo`) e Stripe (para checkout)
* (Opcional) Stripe CLI para testar webhooks

---

# 1) Como configurar (arquivo por arquivo)

> Antes de rodar, crie um `.env` a partir de `.env.example` em cada serviço e preencha os valores reais.

## 1.1 BFF — `/bff/.env`

Exemplo mínimo (dev):

```
PORT=4000
NODE_ENV=development
MOCK_AUTH=true
CLERK_JWKS_URI=
CLERK_AUDIENCE=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TRANSACTIONS_SERVICE_URL=http://localhost:4100
ANALYTICS_SERVICE_URL=http://localhost:4200
FUNCTION_TRIGGER_URL=http://localhost:4300
INTERNAL_SECRET=change-me-in-prod
HTTP_TIMEOUT_MS=8000
RETRY_COUNT=2
CACHE_TTL=25
```

* Em **dev** você pode manter `MOCK_AUTH=true` (aceita token `demo`).
* Em **produção** definir `MOCK_AUTH=false` e configurar `CLERK_JWKS_URI` e `CLERK_AUDIENCE` (valores fornecidos pelo Clerk).
* **Não** coloque chaves reais no Git; use GitHub Secrets / Azure Key Vault em deploy.

## 1.2 Transactions Service — `/services/transactions-service/.env`

```
PORT=4100
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/financeai_transactions?retryWrites=true&w=majority
INTERNAL_SECRET=change-me-in-prod
```

* Substitua `<user>`, `<password>`, `<cluster>` com os valores do Atlas.
* Em dev rápido você pode usar `MONGO_URI=mongodb://localhost:27017/financeai_transactions` apontando a um container Mongo local.

## 1.3 Analytics Service — `/services/analytics-service/.env`

```
PORT=4200
AZURE_SQL_SERVER=<your_server>.database.windows.net
AZURE_SQL_DATABASE=financeai_analytics
AZURE_SQL_USER=<user>
AZURE_SQL_PASSWORD=<password>
AZURE_SQL_PORT=1433
INTERNAL_SECRET=change-me-in-prod
```

* Para dev local, é comum usar um container mssql (sa password) e ajustar variáveis para apontar para ele.

## 1.4 Functions — `/functions/local.settings.json`

(arquivo local — **do not commit**)

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "TRANSACTIONS_SERVICE_URL": "http://localhost:4100",
    "ANALYTICS_SERVICE_URL": "http://localhost:4200"
  }
}
```

## 1.5 MFE — `/mfe/.env`

```
VITE_BFF_URL=http://localhost:4000
VITE_CLERK_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_DEMO_USER_TOKEN=demo
```

* `VITE_DEMO_USER_TOKEN=demo` permite usar o BFF em modo mock sem Clerk.

---

# 2) Instalação passo-a-passo (local, sem Docker)

Abra terminais separados (um por serviço). A sequência abaixo assume que você está no diretório raiz `financeai-platform`.

1. MicroFrontEnd (MFE):

```bash
cd mfe
npm install
npm run dev
# dev server roda em http://localhost:3000
```

2. BFF:

```bash
cd ../bff
npm install
# Windows: se package.json usa NODE_ENV=... instale cross-env (dev) ou rode node diretamente
npm run dev   # se usa cross-env
# ou: node bff.js
# BFF roda em http://localhost:4000
```

3. Transactions Service (Mongo):

```bash
cd ../services/transactions-service
npm install
# ajuste MONGO_URI no .env (Atlas ou localhost)
npm run dev
# serviço roda em http://localhost:4100
```

4. Analytics Service (Azure SQL):

```bash
cd ../services/analytics-service
npm install
# ajuste AZURE_SQL_* no .env
npm run dev
# serviço roda em http://localhost:4200
```

5. Functions (local):

```bash
cd ../../functions
npm install
# instale e rode Azurite (opcional) ou configure AzureWebJobsStorage
func start
# functions expostas em http://localhost:7071/api/{functionName}
```

---

# 3) Instalação com Docker Compose (dev rápido)

Há um `docker-compose.yml` opcional para levantar Mongo e MSSQL localmente e rodar containers para os serviços. Em raiz do repo:

```bash
docker compose up -d
```

* Ajuste `docker-compose.yml` se quiser mapear volumes ou alterar senhas.

---

# 4) Testes básicos e endpoints

* MFE: [http://localhost:3000](http://localhost:3000)
* BFF health: `GET http://localhost:4000/bff/health`
* BFF aggregate: `GET http://localhost:4000/bff/aggregate` (precisa header Authorization: Bearer demo em modo mock)
* Transactions: `GET http://localhost:4100/transactions` / `POST /transactions`
* Analytics KPIs: `GET http://localhost:4200/kpis`
* Functions: `POST http://localhost:7071/api/createTransaction` and `GET http://localhost:7071/api/functionContext`

**Exemplo curl (modo mock)**

```bash
curl -H "Authorization: Bearer demo" http://localhost:4000/bff/aggregate
```

---

# 5) Autenticação (Clerk) e fluxos com Stripe / OpenAI

**Dev rápido (modo mock)**

* Mantenha `bff/.env: MOCK_AUTH=true` e `mfe/.env: VITE_DEMO_USER_TOKEN=demo`.
* O frontend usará `demo` como token e o BFF aceitará esse token.

**Produção (recomendado)**

1. Crie app no Clerk, copie JWKS URI / Audience.
2. No `bff/.env` coloque `MOCK_AUTH=false`, `CLERK_JWKS_URI=...` e `CLERK_AUDIENCE=...`.
3. No MFE configure `VITE_CLERK_PUBLISHABLE_KEY` e use os componentes Clerk para login.

**Stripe**

* O BFF expõe `POST /bff/create-checkout-session` (servidor) e `POST /bff/stripe-webhook` (webhook). Configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no BFF.
* Use Stripe Dashboard ou Stripe CLI para testar webhooks.

**OpenAI**

* Configure `OPENAI_API_KEY` no BFF (`bff/.env`). O endpoint `/bff/report` chama a OpenAI e retorna o relatório.

---

# 6) Seeds, testes e utilitários

* Seeds: endpoints internos `/internal/seed` (protegidos por `INTERNAL_SECRET`) existem em services e podem popular dados de demo:

```bash
curl -X POST -H "x-internal-secret: change-me-in-prod" http://localhost:4100/internal/seed
curl -X POST -H "x-internal-secret: change-me-in-prod" http://localhost:4200/internal/seed
```

* Logs: veja saídas nos terminais de cada serviço. BFF usa `winston`/`morgan` e imprimirá requests e erros.

---

# 7) Troubleshooting rápido (erros comuns)

* `ERR_CONNECTION_REFUSED` no MFE console: significa que o BFF não está rodando em `VITE_BFF_URL` (cheque `node bff.js` terminal). Rodar/checar `netstat -ano | findstr :4000`.
* `'NODE_ENV' não é reconhecido` no Windows: instale `cross-env` e troque o script para `cross-env NODE_ENV=development node bff.js` ou rode `node bff.js` diretamente.
* `EBADNAME _mongodb._tcp.<cluster>.mongodb.net`: seu `MONGO_URI` ainda tem placeholders (`<cluster>`). Substitua pelo URI real do Atlas ou aponte para Mongo local.
* `invalid_mock_token` 401: frontend enviou token Clerk real, enquanto BFF está em `MOCK_AUTH=true`. Em dev use `VITE_DEMO_USER_TOKEN=demo` no MFE ou desligue mock no BFF e configure Clerk.
* Stripe webhook: use Stripe CLI `stripe listen --forward-to localhost:4000/bff/stripe-webhook` para testar local.

---

# 8) Deploy & produção (resumo)

1. **BFF**: deploy em Azure App Service / Azure Container Apps / any Node host. Configure env vars, OpenAI key, Stripe keys, Clerk JWKS.
2. **Transactions service**: host onde puder acessar MongoDB Atlas (use VNet/Private Endpoint for production).
3. **Analytics service**: Azure SQL — configure firewall rules, use managed identity if preferred.
4. **Functions**: deploy com `func azure functionapp publish` ou via GitHub Actions.
5. **CI/CD**: usar GitHub Actions — build and test each package, publish containers or deploy to Azure.

Segurança: use HTTPS, configure CORS de forma restrita, não deixe `INTERNAL_SECRET` no Git, e use Key Vault / GitHub Secrets.

---

# 9) Comandos úteis (cole e rode)

```
# raiz do repo
# instalar deps em cada pacote (exemplo)
cd mfe && npm install
cd ../bff && npm install
cd ../services/transactions-service && npm install
cd ../services/analytics-service && npm install
cd ../../functions && npm install

# iniciar (em terminais separados)
cd services/transactions-service && npm run dev
cd services/analytics-service && npm run dev
cd ../bff && npm run dev
cd ../mfe && npm run dev
cd ../functions && func start
```

---

## Autores

* Arthur Hermes
* Augusto Sinja
* Eduardo Mesquita
* Kauã Gabriel
* Ricardo Amaro

---