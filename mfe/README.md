FinanceAI - Microfrontend (React + Vite)

Pré-requisitos:
- Node 18+
- Um BFF rodando (http://localhost:4000 por padrão)
- Clerk app (publishable key)
- Stripe Price configured (on Stripe Dashboard)
- OpenAI / microservices / function rodando (para fluxos completos)

1) Copie .env.example -> .env e configure:
   VITE_BFF_URL, VITE_CLERK_PUBLISHABLE_KEY, VITE_STRIPE_PUBLISHABLE_KEY
   
   Authentication modes:
   - VITE_USE_DEMO_AUTH=false (default/production): Requires Clerk login, throws error if not authenticated
   - VITE_USE_DEMO_AUTH=true (dev only): Allows demo token fallback for local development

2) Instale dependências:
   npm install

3) Rode em dev:
   npm run dev
   (abre em http://localhost:3000)

Fluxos suportados:
- Login com Clerk (SignIn components)
- Chamar endpoints do BFF autenticado (whoami, aggregate, transactions)
- Stripe Checkout: criação de sessão via BFF `/bff/create-checkout-session`
- Gerar relatório via BFF `/bff/report` (OpenAI)

Observações sobre Autenticação:
- **Produção (VITE_USE_DEMO_AUTH=false)**: O MFE requer autenticação via Clerk. Se o usuário não estiver autenticado, 
  a função `useBff()` lançará um erro claro solicitando login. Não há fallback para token demo.
  
- **Desenvolvimento (VITE_USE_DEMO_AUTH=true)**: O MFE tentará obter o token Clerk primeiro, mas fará fallback 
  para o token demo se não houver autenticação disponível. Este modo é apenas para desenvolvimento local.
  
- **BFF em modo MOCK_AUTH=true**: O BFF aceita tokens mock como "demo", "user:alice" ou emails. 
  Configure o MFE com VITE_USE_DEMO_AUTH=true para compatibilidade.
  
- **BFF em modo MOCK_AUTH=false**: O BFF valida JWTs do Clerk via JWKS. Configure o MFE com 
  VITE_CLERK_PUBLISHABLE_KEY e VITE_USE_DEMO_AUTH=false (ou omita a variável) para forçar login.

userId no BFF:
- O BFF deriva o userId do token JWT decodificado (preferência: sub, id, userId, email)
- Quando MOCK_AUTH=false, o BFF sempre usa o userId do token e ignora parâmetros de query
- O cliente (MFE) NÃO deve enviar userId nos payloads; o BFF o injeta automaticamente
