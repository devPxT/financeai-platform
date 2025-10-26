FinanceAI - Microfrontend (React + Vite)

Pré-requisitos:
- Node 18+
- Um BFF rodando (http://localhost:4000 por padrão)
- Clerk app (publishable key)
- Stripe Price configured (on Stripe Dashboard)
- OpenAI / microservices / function rodando (para fluxos completos)

1) Copie .env.example -> .env e configure:
   VITE_BFF_URL, VITE_CLERK_PUBLISHABLE_KEY, VITE_STRIPE_PUBLISHABLE_KEY

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

Observações:
- Em dev você pode usar o token mock "demo" configurado no BFF (MOCK_AUTH=true). A função `bffFetch` faz fallback para o token demo se não houver um token Clerk.
- Substitua `priceId` no componente de checkout pelo seu Price ID no Stripe.
