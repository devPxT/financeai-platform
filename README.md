# FinanceAI Platform — Visão Arquitetural do Código-Fonte

Este documento descreve a arquitetura do código-fonte da plataforma FinanceAI, cobrindo a visão do sistema, os componentes (MFE, BFF/API Gateway, Microservices, Azure Functions), integrações externas e os padrões aplicados (Clean Architecture, Vertical Slices e testes de arquitetura).

Alunos
- Arthur Hermes
- Augusto Sinja
- Eduardo Mesquita
- Kauã Gabriel
- Ricardo Amaro

---

## 1) Visão Geral do Sistema

A plataforma é composta por:
- MFE (Micro Frontend) em React/Vite.
- BFF (Backend-for-Frontend) atuando também como API Gateway.
- Dois microserviços independentes com “database per service”:
  - Transactions Service (MongoDB).
  - Analytics Service (Azure SQL).
- Azure Functions para operações mutacionais de transações (create/update/delete).
- Integrações externas: Stripe (checkout/assinatura) e OpenAI (relatórios com IA).

Serviços em produção (referência):
- MFE: https://financeai-f7erachbaqgfhubs.canadacentral-01.azurewebsites.net
- BFF/API Gateway: https://financeaibff-e4frhjfnadhybtfy.canadacentral-01.azurewebsites.net
- Transactions Functions (base /api): https://transactions-gnghafepbpd9cuat.canadacentral-01.azurewebsites.net/api
- Transactions Service: https://financeaitransactions-djaggnewe5d6agah.canadacentral-01.azurewebsites.net
- Analytics Service: https://financeaianalytics-a6gdf8dyhwdyhnd0.canadacentral-01.azurewebsites.net

Arquitetura em alto nível:
```
[MFE] → [BFF/API Gateway] → (Reads) → [Transactions Service (Mongo)]
                         └─ (Writes via HTTP) → [Azure Functions] → [Mongo]
                         └─ (Relatórios) → [OpenAI] + [Analytics Service (Azure SQL)]
                         └─ (Pagamentos) → [Stripe (Checkout/Webhook)]
```

---

## 2) MFE (Micro Frontend)

- SPA construída com React + Vite.
- Consome exclusivamente o BFF, que abstrai e consolida os backends.
- Configurações por variáveis de ambiente de build (ex.: `VITE_BFF_URL`, chaves publishable de Clerk/Stripe).
- Principais operações consumidas no BFF:
  - GET /bff/transactions — listar transações.
  - POST /bff/transactions — criar transação.
  - PUT /bff/transactions/{id} — atualizar transação.
  - DELETE /bff/transactions/{id} — remover transação.
  - POST /bff/report — gerar relatório (OpenAI) e persistir.
  - GET /bff/reports — listar relatórios.
  - GET /bff/reports/quota — consultar cota de relatórios.
- Benefícios:
  - MFE não precisa conhecer a topologia dos serviços internos.
  - Evolui independente de mudanças em microserviços/integradores.

---

## 3) BFF com API Gateway integrada

- Implementado em Node.js/Express.
- Atua como fachada única para o MFE (padrão BFF) e cumpre funções típicas de API Gateway:
  - Autenticação (Clerk em produção; mock em dev, quando habilitado).
  - Sanitização/validação de payloads.
  - Rate limiting, CORS, Helmet (hardening), cache básico (quando aplicável).
  - Retry com backoff nas chamadas a serviços/Functions.
  - Observabilidade (logs estruturados; eventos nomeados).
- Integrações:
  - Stripe: criação de sessão de checkout e verificação de assinatura no webhook.
  - OpenAI: geração de relatórios em PT‑BR a partir das últimas transações do usuário.
- Orquestração:
  - Leituras de transações: chamadas REST ao Transactions Service.
  - Escritas de transações: chamadas HTTP às Azure Functions (write path).
  - Relatórios: coleta transações → chama OpenAI → persiste no Analytics Service.
- Segurança:
  - Tokens/JWT via Clerk no BFF.
  - Secrets/keys em variáveis de ambiente.
  - Webhook do Stripe com verificação de assinatura.
  - Chave de Function via query `?code=` ou header `x-functions-key`.

---

## 4) Eventos HTTP do BFF para Functions

As operações mutacionais de transações são encaminhadas pelo BFF para Azure Functions:

- POST /api/createTransactions
  - Cabeçalho: `x-user-id` (ou `userId` no body).
  - Valida campos obrigatórios (name, type, category, paymentMethod, amount, date opcional).
  - Retorno 201 com a transação persistida.

- PUT /api/updateTransactions/{id}
  - Cabeçalho: `x-user-id` obrigatório.
  - Atualiza campos permitidos (name, amount, type, category, paymentMethod, date).
  - Retorno 200 com o documento atualizado; 404 caso não encontrado.

- DELETE /api/deleteTransactions/{id}
  - Cabeçalho: `x-user-id` obrigatório.
  - Remove a transação pertencente ao usuário; 404 caso não encontrada.

Autorização de Functions:
- Nível “function”: chave via `?code=` (query) ou `x-functions-key` (header), configurada no BFF.

Resiliência:
- Retries com backoff quando a falha é transitória (ex.: timeouts; não tentamos novamente erros 4xx exceto 429).
- Logs de erro com contexto (corrId, endpoint, status).

---

## 5) Microservices com Database per Service

### 5.1 Transactions Service (MongoDB)
- Responsável pelo CRUD de transações do usuário.
- Exemplo de endpoints:
  - GET /transactions (filtros: userId, período, limite)
  - POST /transactions
  - PUT /transactions/{id}
  - DELETE /transactions/{id}
  - GET /transactions/summary (agregados simples)
- Persistência: MongoDB (cada transação com userId, name, type, category, paymentMethod, amount, date, createdAt, updatedAt).
- Conexão: `MONGO_URI` via variável de ambiente; pooling e `serverSelectionTimeoutMS`.
- Padrões de validação: coerção de datas/valores e saneamento no BFF; consistência reforçada no serviço.
- Observação: no caminho de escrita em produção, o BFF utiliza as Azure Functions; o serviço fica focado em leituras e eventuais usos administrativos.

### 5.2 Analytics Service (Azure SQL)
- Responsável por relatórios gerados via IA e controle de cota (quota) mensal.
- Endpoints:
  - GET /reports?userId=...&page=...&limit=...
  - POST /reports
  - GET /reports/quota?userId=...
- Persistência: Azure SQL (tabela dbo.Reports; índices para consulta por userId/data).
- Padrões aplicados:
  - Repository Pattern (p. ex., `SqlReportRepository`) para isolar acesso a dados.
  - Modelos enxutos para transportar dados entre camadas.

Motivação do “Database per Service”:
- Autonomia e independência de evolução por domínio.
- Escalabilidade e isolamento de falhas.
- Flexibilidade de escolher o storage ideal por contexto (NoSQL para transações; relacional para relatórios e quota).

---

## 6) Conexões entre Componentes

- MFE → BFF: chamadas HTTP autenticadas; o MFE nunca fala direto com microserviços.
- BFF → Transactions Service: leituras (lista/resumo) via REST.
- BFF → Azure Functions (Transactions): escritas (create/update/delete) via HTTP com chave de função.
- BFF → OpenAI: geração de conteúdo do relatório.
- BFF → Analytics Service: gravação e leitura de relatórios/quota.
- Stripe:
  - BFF → Stripe: criação de sessão de checkout.
  - Stripe → BFF: webhook assinado para eventos de pagamento/assinatura.

---

## 7) Azure Functions (Transações)

- Implementadas em Node.js, com triggers HTTP:
  - createTransactions (POST)
  - updateTransactions/{id} (PUT)
  - deleteTransactions/{id} (DELETE)
- Autorização “function” por chave.
- Cabeçalhos: `x-user-id` obrigatório para update/delete (e recomendado para create).
- Regras de validação e normalização de dados alinhadas ao BFF.
- Benefícios:
  - Escala independente para picos de escrita.
  - Simples de compor com um futuro barramento de eventos (EDA) se necessário.

---

## 8) Padrões Arquiteturais: Clean Architecture + Vertical Slices

A base do código dos microserviços segue Clean Architecture e está organizada em Vertical Slices por domínio de negócio (ex.: `features/transactions`):

Estrutura típica por fatia (ex.: transactions-service)
```
features/
  transactions/
    domain/                 # Entidades, regras de negócio puras
    application/
      useCases/             # Orquestram regras (input -> domínio -> saída)
    infrastructure/         # Adapters concretos (Mongo/Azure SQL)
    interface/
      http/                 # Controllers, rotas e DTOs de entrada/saída
    composition/            # Wiring/DI manual (repos -> useCases -> controller)
    index.js                # Facade: buildTransactionsContainer + transactionsRouter
```

- Dependências “apontam para dentro”: interface → application → domain.  
- Domínio não conhece infraestrutura nem interface.
- Application não conhece infraestrutura/transportes; depende de contratos (interfaces).
- Composition faz a injeção (repository concreto → use cases → controller).

Benefícios:
- Coesão por feature (tudo de “transações” está junto).
- Facilidade de evolução e testes.
- Baixo acoplamento entre domínios e camadas.

---

## 9) Testes de Arquitetura dos Microserviços

São usados testes de arquitetura para garantir as regras de dependência e a aderência ao desenho:

- Regras verificadas (exemplos):
  - domain não depende de interface nem de infrastructure.
  - application não depende de interface nem de infrastructure.
  - interface não depende de infrastructure.
  - domain e application livres de ciclos.
- Teste de Vertical Slice:
  - Aderência a um diagrama de componentes (PlantUML) que define setas permitidas:
    - A (application) → D (domain)
    - I (infrastructure) → A e D
    - F (interface) → A
- Smoke tests:
  - Garantem importabilidade das camadas essenciais e composição básica.

Esses testes ajudam a manter o design limpo ao longo do tempo, evitando “curto-circuitos” entre camadas (ex.: controller importando repositório direto) e reduzindo riscos de dívida técnica.

---

## 10) Decisões e Qualidades

- BFF como API Gateway: simplifica o front e centraliza políticas transversais (auth, rate limit, cache, observabilidade).
- Database per service: autonomia de dados e escolha de storage adequado por domínio.
- Resiliência: retries com backoff, degradação graciosa (quota/relatórios), verificação de assinaturas (Stripe).
- Doze fatores: configuração via variáveis de ambiente; componentes implantáveis separadamente.
- Evolutividade: vertical slices e repositórios desacoplados permitem novas features/domínios com pouco impacto cruzado.

---

## 11) Principais Integrações Externas

- Stripe:
  - Checkout de assinatura (BFF → Stripe).
  - Webhook assinado (Stripe → BFF) para refletir estado de pagamento.
- OpenAI:
  - Geração de relatório textual a partir das transações recentes do usuário.
- Clerk:
  - Autenticação com JWKS em produção (mock somente em desenvolvimento).

---

## 12) Resumo

- O MFE consome somente o BFF, que serve como API Gateway e orquestrador.
- Escritas de transação passam por Azure Functions; leituras vêm do Transactions Service (Mongo).
- Relatórios são gerados com OpenAI e persistidos no Analytics Service (Azure SQL).
- Clean Architecture + Vertical Slices estruturam o código dos microserviços, com testes de arquitetura garantindo a disciplina das dependências.
