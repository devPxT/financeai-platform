/**
 * bff.js
 * FinanceAI - BFF refinado
 *
 * Features:
 *  - Auth via Clerk JWKS (or MOCK_AUTH for local dev)
 *  - Proxy/CRUD for transactions microservice
 *  - Aggregation endpoint combining microservice + Function (HTTP trigger)
 *  - Create via Function (async event) when mode=async
 *  - Stripe Checkout creation + webhook signature verification
 *  - OpenAI Chat completions for /bff/report
 *  - Cache (node-cache), rate-limiting, logging (winston), retries (axios)
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import axios from "axios";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import Stripe from "stripe";
import OpenAI from "openai";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import winston from "winston";
import crypto from "crypto";
import { clerkClient } from "@clerk/clerk-sdk-node";

dotenv.config();

/* ----------------- Config ----------------- */
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const MOCK_AUTH = (process.env.MOCK_AUTH || "true").toLowerCase() === "true";
const CLERK_JWKS_URI = process.env.CLERK_JWKS_URI || "";
const CLERK_AUDIENCE = process.env.CLERK_AUDIENCE || "";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "";

const TRANSACTIONS_SERVICE_URL = (process.env.TRANSACTIONS_SERVICE_URL || "http://localhost:4100").replace(/\/$/, "");
const ANALYTICS_SERVICE_URL = (process.env.ANALYTICS_SERVICE_URL || "http://localhost:4200").replace(/\/$/, "");
const FUNCTION_CONTEXT_TRIGGER_URL = (process.env.FUNCTION_CONTEXT_TRIGGER_URL || "http://localhost:4300").replace(/\/$/, "");

const FUNCTION_TRIGGER_URL = (process.env.FUNCTION_TRIGGER_URL || "http://localhost:4300").replace(/\/$/, "");

const FUNCTION_CREATE_PATH = process.env.FUNCTION_CREATE_PATH || "/createTransactions";
const FUNCTION_UPDATE_PATH = process.env.FUNCTION_UPDATE_PATH || "/updateTransactions/{id}";
const FUNCTION_DELETE_PATH = process.env.FUNCTION_DELETE_PATH || "/deleteTransactions/{id}";

const FUNCTION_CODE = process.env.FUNCTION_CODE || "";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || "price_YOUR_PRICE_ID";

const HTTP_TIMEOUT_MS = Number(process.env.HTTP_TIMEOUT_MS || 8000);
const RETRY_COUNT = Number(process.env.RETRY_COUNT || 2);
const CACHE_TTL = Number(process.env.CACHE_TTL || 25);

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "internal-secret-demo";


/* ----------------- Logger ----------------- */
const logger = winston.createLogger({
  level: NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

/* ----------------- Clients ----------------- */
const http = axios.create({ timeout: HTTP_TIMEOUT_MS });
const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: Math.max(10, Math.floor(CACHE_TTL / 2)) });
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/* ----------------- Helpers ----------------- */

function randomId(prefix = "") {
  return prefix + crypto.randomBytes(6).toString("hex");
}

async function httpRequestWithRetry(config, retries = RETRY_COUNT) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await http.request(config);
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      // don't retry on 4xx except 429
      if (status && status >= 400 && status < 500 && status !== 429) break;
      const backoff = 150 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

/* Helper: deriva userId do token do Clerk */
function deriveUserId(u) {
  if (!u) return undefined;
  return (
    u.id ||              // alguns providers mapeiam para id
    u.sub ||             // padrão em OIDC/JWT do Clerk
    u.userId ||          // alternativa em alguns templates
    (typeof u.email === "string" ? u.email.split("@")[0] : undefined)
  );
}

/* Enums aceitos pelo novo payload (validação leve no BFF) */
const TIPOS = ["Despesa", "Depósito", "Investimento"];
const CATEGORIAS = [
  "Educação",
  "Entretenimento",
  "Alimentação",
  "Saúde",
  "Moradia",
  "Outros",
  "Salário",
  "Transporte",
  "Utilidades"
];
const METODOS_PAGAMENTO = [
  "Transferência Bancária",
  "Boleto Bancário",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Outros",
  "Pix"
];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function parseAmount(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace?.(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}
function coerceDate(d) {
  if (!d) return undefined;
  const iso = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00.000Z` : d;
 const nd = new Date(iso);
  return Number.isFinite(nd.valueOf()) ? nd.toISOString() : undefined;
}

function withCode(url) {
  return FUNCTION_CODE ? `${url}${url.includes("?") ? "&" : "?"}code=${encodeURIComponent(FUNCTION_CODE)}` : url;
}

/* ----------------- Auth middleware ----------------- */
/*
 - MOCK_AUTH=true: accepts "demo" token and simple forms "user:xxx" or email tokens.
 - MOCK_AUTH=false: uses JWKS via CLERK_JWKS_URI to validate Clerk-issued JWTs.
*/
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "missing_authorization" });
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return res.status(401).json({ error: "missing_token" });

  if (MOCK_AUTH) {
    if (token === "demo") {
      req.user = { id: "demo", email: "demo@local", name: "Demo User", plan: "free" };
      return next();
    }
    if (token.startsWith("user:")) {
      const id = token.replace("user:", "");
      req.user = { id, email: `${id}@local`, name: id };
      return next();
    }
    if (token.includes("@")) {
      req.user = { id: token.split("@")[0], email: token, name: token.split("@")[0] };
      return next();
    }
    return res.status(401).json({ error: "invalid_mock_token" });
  }

  if (!CLERK_JWKS_URI) return res.status(500).json({ error: "jwks_not_configured" });

  try {
    const client = jwksRsa({ jwksUri: CLERK_JWKS_URI, cache: true, rateLimit: true });
    function getKey(header, cb) {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return cb(err);
        const pub = key.getPublicKey();
        cb(null, pub);
      });
    }
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { audience: CLERK_AUDIENCE || undefined, algorithms: ["RS256"] }, (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded);
      });
    });
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn("auth_failed", { err: err.message });
    return res.status(401).json({ error: "invalid_token", details: err.message });
  }
}

/* ----------------- App & middleware ----------------- */
const app = express();
// stripe webhook requires raw body; for webhook route we'll use express.raw specifically.
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" })); // general JSON
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.set("trust proxy", true);
app.use(rateLimit({ windowMs: 60 * 1000, max: 400 }));

/* ----------------- Routes ----------------- */

/* Health */
app.get("/bff/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString(), mockAuth: MOCK_AUTH }));

/* Whoami - exposes user info decoded from token (useful for frontend) */
app.get("/bff/whoami", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

/* AGGREGATE: combine transactions (microservice) + function (http trigger) */
/* AGGREGATE */
app.get("/bff/aggregate", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const tokenUserId = deriveUserId(user);

    const userId = MOCK_AUTH ? (req.query.userId || tokenUserId) : tokenUserId;
    if (!userId) return res.status(401).json({ error: "missing_user_id_from_token" });

    const cacheKey = `aggregate:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ fromCache: true, ...cached });

    const txUrl = `${TRANSACTIONS_SERVICE_URL}/transactions`;
    const txPromise = proxyGet(txUrl, { userId }).catch(() => []);

    // const funcUrl = `${FUNCTION_TRIGGER_URL.replace(/\/$/, "")}/functionContext?userId=${encodeURIComponent(userId)}`;
    const funcUrl = `${FUNCTION_CONTEXT_TRIGGER_URL}?userId=${encodeURIComponent(userId || "")}`;
    const funcPromise = httpRequestWithRetry({ method: "get", url: funcUrl })
      .then((r) => r.data)
      .catch(() => null);

    const [transactions, functionData] = await Promise.all([txPromise, funcPromise]);

    // const balance = (transactions || []).reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    const balance = (transactions || []).reduce((s, t) => s + txSign(t) * (Number(t.amount) || 0), 0);
    const series = makeSeries(transactions || []);
    const payload = { userId, balance, series, recent: (transactions || []).slice(0, 10), functionData };

    cache.set(cacheKey, payload);
    res.json({ fromCache: false, ...payload });
  } catch (err) {
    logger.error("aggregate_error", { err: err.message });
    res.status(500).json({ error: "aggregate_failed", details: err.message });
  }
});

/* TRANSACTIONS - LIST */
app.get("/bff/transactions", authMiddleware, async (req, res) => {
  try {
    const tokenUserId = deriveUserId(req.user);
    const userId = MOCK_AUTH ? (req.query.userId || tokenUserId) : tokenUserId;
    if (!userId) return res.status(401).json({ error: "missing_user_id_from_token" });

    const url = `${TRANSACTIONS_SERVICE_URL}/transactions`;
    const data = await proxyGet(url, { userId });
    res.json(data);
  } catch (err) {
    logger.error("list_transactions_failed", { err: err.message });
    res.status(500).json({ error: "list_transactions_failed" });
  }
});

/* TRANSACTIONS - CREATE (sync/async) */
// app.post("/bff/transactions", authMiddleware, async (req, res) => {
//   const mode = (req.query.mode || "sync").toLowerCase();
//   const tokenUserId = deriveUserId(req.user);
//   // Em produção, SEMPRE userId do token; em dev, aceita override mas prioriza token se existir
//   const userId = MOCK_AUTH ? (tokenUserId || req.body?.userId) : tokenUserId;
//   if (!userId) return res.status(400).json({ error: "missing_user_id_from_token" });

//   // Saneia/valida o novo payload
//   const clean = sanitizeTxPayload(req.body || {});
//   if (clean.error) {
//     return res.status(400).json(clean.error);
//   }
//   const payload = { ...clean.value, userId };
//   // const payload = { ...(req.body || {}), userId };

//   try {
//     if (mode === "async") {
//       const codeSuffix = FUNCTION_CODE ? `?code=${encodeURIComponent(FUNCTION_CODE)}` : "";
//       const funcUrl = `${FUNCTION_TRIGGER_URL.replace(/\/$/, "")}/createTransactions${codeSuffix}`;
//       try {
//         const r = await httpRequestWithRetry({
//           method: "post",
//           url: funcUrl,
//           data: payload,
//           headers: { "x-origin-bff": "financeai-bff" }
//         });
//         return res.status(r.status === 202 ? 202 : 201).json({ fromFunction: true, data: r.data });
//       } catch (err) {
//         logger.warn("function_create_failed", { err: err.message });
//         // fallback direto no serviço
//         const svcUrl = `${TRANSACTIONS_SERVICE_URL.replace(/\/$/, "")}/transactions`;
//         const created = await proxyPost(svcUrl, payload);
//         invalidateUserCache(userId);
//         return res.status(201).json({ fallback: true, created });
//       }
//     } else {
//       const svcUrl = `${TRANSACTIONS_SERVICE_URL.replace(/\/$/, "")}/transactions`;
//       const created = await proxyPost(svcUrl, payload);
//       invalidateUserCache(userId);
//       return res.status(201).json(created);
//     }
//   } catch (err) {
//     logger.error("create_transaction_failed", { err: err.message });
//     res.status(500).json({ error: "create_transaction_failed", details: err.message });
//   }
// });
/* TRANSACTIONS - CREATE (usar somente Azure Function) */
// app.post("/bff/transactions", authMiddleware, async (req, res) => {
//   try {
//     const tokenUserId = deriveUserId(req.user);
//     // Em produção, SEMPRE userId do token; em dev, aceita override mas prioriza token se existir
//     const userId = MOCK_AUTH ? (tokenUserId || req.body?.userId) : tokenUserId;
//     if (!userId) return res.status(400).json({ error: "missing_user_id_from_token" });

//     // Saneia/valida o novo payload
//     const clean = sanitizeTxPayload(req.body || {});
//     if (clean.error) {
//       return res.status(400).json(clean.error);
//     }
//     const payload = { ...clean.value, userId };

//     // Caminho da Azure Function responsável por criar a transação
//     // Ajuste se o nome da sua Function for outro.
//     const functionCreatePath = process.env.FUNCTION_CREATE_PATH || "/createTransactions";
//     const codeSuffix = FUNCTION_CODE ? `?code=${encodeURIComponent(FUNCTION_CODE)}` : "";
//     const funcUrl = `${FUNCTION_TRIGGER_URL.replace(/\/$/, "")}${functionCreatePath}${codeSuffix}`;

//     logger.info("creating transaction via function", { funcUrl });

//     const r = await httpRequestWithRetry({
//       method: "post",
//       url: funcUrl,
//       data: payload,
//       headers: {
//         "Content-Type": "application/json",
//         "x-origin-bff": "financeai-bff",
//         // a function pode ler userId do header se preferir
//         "x-user-id": userId
//       },
//       timeout: HTTP_TIMEOUT_MS
//     });

//     // Invalida cache do agregado do usuário
//     invalidateUserCache(userId);

//     // Propaga status e corpo retornado pela Function
//     return res.status(r.status || 201).json(r.data);
//   } catch (err) {
//     logger.error("create_transaction_via_function_failed", { err: err.message });
//     res.status(500).json({ error: "create_transaction_failed", details: err.message });
//   }
// });

// /* TRANSACTIONS - UPDATE */
// app.put("/bff/transactions/:id", authMiddleware, async (req, res) => {
//   try {
//     const tokenUserId = deriveUserId(req.user);
//     if (!tokenUserId && !MOCK_AUTH) return res.status(401).json({ error: "missing_user_id_from_token" });

//     // Saneamento parcial: só permitir campos do novo modelo
//     const allowed = ["name", "amount", "type", "category", "paymentMethod", "date"];
//     const body = {};
//     for (const k of allowed) {
//       if (k in req.body) body[k] = req.body[k];
//     }
//     if ("amount" in body) {
//       const n = parseAmount(body.amount);
//       if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ error: "valor_invalido" });
//       body.amount = n;
//     }
//     if ("date" in body) {
//       const d = coerceDate(body.date);
//       if (!d) return res.status(400).json({ error: "data_invalida" });
//       body.date = d;
//     }

//     const url = `${TRANSACTIONS_SERVICE_URL.replace(/\/$/, "")}/transactions/${encodeURIComponent(req.params.id)}`;
//     const updated = await proxyPut(url, body);
//     invalidateUserCache(tokenUserId);
//     res.json(updated);
//   } catch (err) {
//     logger.error("update_transaction_failed", { err: err.message });
//     res.status(500).json({ error: "update_transaction_failed" });
//   }
// });

// /* TRANSACTIONS - DELETE: continuam, invalidando cache pelo userId derivado */
// app.delete("/bff/transactions/:id", authMiddleware, async (req, res) => {
//   try {
//     const tokenUserId = deriveUserId(req.user);
//     if (!tokenUserId && !MOCK_AUTH) return res.status(401).json({ error: "missing_user_id_from_token" });
//     const url = `${TRANSACTIONS_SERVICE_URL.replace(/\/$/, "")}/transactions/${encodeURIComponent(req.params.id)}`;
//     const out = await proxyDelete(url);
//     invalidateUserCache(tokenUserId);
//     res.json(out);
//   } catch (err) {
//     logger.error("delete_transaction_failed", { err: err.message });
//     res.status(500).json({ error: "delete_transaction_failed" });
//   }
// });

/* CREATE via Function */
app.post("/bff/transactions", authMiddleware, async (req, res) => {
  try {
    const tokenUserId = deriveUserId(req.user);
    const userId = (process.env.MOCK_AUTH || "true").toLowerCase() === "true" ? (tokenUserId || req.body?.userId) : tokenUserId;
    if (!userId) return res.status(400).json({ error: "missing_user_id_from_token" });

    const clean = sanitizeTxPayload(req.body || {});
    if (clean.error) return res.status(400).json(clean.error);
    const payload = { ...clean.value, userId };

    const base = `${FUNCTION_TRIGGER_URL}${FUNCTION_CREATE_PATH}`;
    const funcUrl = withCode(base);

    const r = await httpRequestWithRetry({
      method: "post",
      url: funcUrl,
      data: payload,
      headers: { "Content-Type": "application/json", "x-user-id": userId }
    });

    invalidateUserCache(userId);
    return res.status(r.status || 201).json(r.data);
  } catch (err) {
    res.status(500).json({ error: "create_transaction_failed", details: err.message });
  }
});

/* UPDATE via Function */
app.put("/bff/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const tokenUserId = deriveUserId(req.user);
    if (!tokenUserId && (process.env.MOCK_AUTH || "true").toLowerCase() !== "true") {
      return res.status(401).json({ error: "missing_user_id_from_token" });
    }
    const userId = tokenUserId;

    const allowed = ["name", "amount", "type", "category", "paymentMethod", "date"];
    const body = {};
    for (const k of allowed) if (k in req.body) body[k] = req.body[k];
    if ("amount" in body) {
      const n = parseAmount(body.amount);
      if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ error: "valor_invalido" });
      body.amount = n;
    }
    if ("date" in body) {
      const d = coerceDate(body.date);
      if (!d) return res.status(400).json({ error: "data_invalida" });
      body.date = d;
    }

    const path = FUNCTION_UPDATE_PATH.replace("{id}", encodeURIComponent(req.params.id));
    const funcUrl = withCode(`${FUNCTION_TRIGGER_URL}${path}`);

    const r = await httpRequestWithRetry({
      method: "put",
      url: funcUrl,
      data: body,
      headers: { "Content-Type": "application/json", "x-user-id": userId }
    });

    invalidateUserCache(userId);
    res.status(r.status || 200).json(r.data);
  } catch (err) {
    if (err?.response) {
      // repassa status/corpo que veio da Function (ex.: 404 not_found_or_not_owned)
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "update_transaction_failed", details: err.message });
  }
});

/* DELETE via Function */
app.delete("/bff/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const tokenUserId = deriveUserId(req.user);
    if (!tokenUserId && (process.env.MOCK_AUTH || "true").toLowerCase() !== "true") {
      return res.status(401).json({ error: "missing_user_id_from_token" });
    }
    const userId = tokenUserId;

    const path = FUNCTION_DELETE_PATH.replace("{id}", encodeURIComponent(req.params.id));
    const base = `${FUNCTION_TRIGGER_URL}${path}`;
    const funcUrl = withCode(base);

    const r = await httpRequestWithRetry({
      method: "delete",
      url: funcUrl,
      headers: { "x-user-id": userId }
    });

    invalidateUserCache(userId);
    res.status(r.status || 200).json(r.data);
  } catch (err) {
    res.status(500).json({ error: "delete_transaction_failed", details: err.message });
  }
});

/* COMBINED KPIs: call transactions summary + analytics service KPIs */
/* COMBINED-KPI (se existir a sua rota de KPI combinado; aplica a mesma regra de userId) */
app.get("/bff/combined-kpi", authMiddleware, async (req, res) => {
  try {
    const tokenUserId = deriveUserId(req.user);
    const userId = MOCK_AUTH ? (req.query.userId || tokenUserId) : tokenUserId;
    if (!userId) return res.status(401).json({ error: "missing_user_id_from_token" });

    const kpisUrl = `${ANALYTICS_SERVICE_URL}/kpis`;
    const [kpis] = await Promise.all([
      proxyGet(kpisUrl, { userId }).catch(() => ({ error: "analytics_unavailable" }))
    ]);

    res.json({ userId, kpis });
  } catch (err) {
    res.status(500).json({ error: "combined_kpi_failed", details: err.message });
  }
});

/* STRIPE: create checkout session (server-side) */
app.post("/bff/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { successUrl, cancelUrl } = req.body;
    const userId = deriveUserId(req.user);  

    if (!STRIPE_PRICE_ID_PRO) return res.status(400).json({ error: "priceId required" });
    if (!userId) return res.status(401).json({ error: "missing_user_id_from_token" });

    // [APENAS TESTE] Atualiza plano no Clerk antes de criar a sessão
    // Produção real: mover para webhook de pagamento aprovado
    if (!MOCK_AUTH && process.env.CLERK_SECRET_KEY) {
      try {
        // Merge do publicMetadata existente para não perder chaves
        const u = await clerkClient.users.getUser(userId);
        const prev = u?.publicMetadata ?? {};
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { ...prev, subscriptionPlan: "premium" }
        });
      } catch (e) {
        logger.warn("clerk_update_metadata_failed", { err: e.message, userId });
        // não aborta o fluxo do Stripe; segue criando a sessão
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICE_ID_PRO, quantity: 1 }],
      // customer_email: req.user?.email,
      customer_email: "gabrielkauasantos11@gmail.com",
      // success_url: successUrl || `${req.headers.origin}/subscription?session_id={CHECKOUT_SESSION_ID}`,
      success_url: successUrl || `${req.headers.origin}/subscription?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/subscription?canceled=true`,
      subscription_data: {
        metadata: { clerk_user_id: deriveUserId(req.user) }
      }
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    logger.error("stripe_session_error", { err: err.message });
    res.status(500).json({ error: "stripe_session_failed", details: err.message });
  }
});

/* STRIPE WEBHOOK (must use raw body and verify signature) */
app.post("/bff/stripe-webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!STRIPE_WEBHOOK_SECRET) {
    logger.warn("stripe_webhook_secret_not_configured");
    return res.status(500).send("stripe webhook secret not configured");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("stripe_webhook_signature_invalid", { err: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // handle relevant events
  switch (event.type) {
    case "checkout.session.completed":
      {
        const session = event.data.object;
        logger.info("checkout_session_completed", { id: session.id, customer_email: session.customer_email });
        // TODO: mark subscription in user DB (call user service or internal logic)
      }
      break;
    case "invoice.payment_succeeded":
      logger.info("invoice.payment_succeeded", { id: event.data.object.id });
      break;
    case "customer.subscription.deleted":
      logger.info("subscription_deleted", { id: event.data.object.id });
      break;
    default:
      logger.debug("stripe_event_unhandled", { type: event.type });
  }

  res.json({ received: true });
});

/* OPENAI REPORT: generate report using last transactions (proxy+openai) */
app.post("/bff/report", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    // fetch last N transactions from transactions-service
    const txUrl = `${TRANSACTIONS_SERVICE_URL}/transactions`;
    const txs = await proxyGet(txUrl, { userId, limit: 200 }).catch(() => []);
    
    const sample = (Array.isArray(txs) ? txs.slice(-80) : []);
    
    const prompt = `
      Você é um analista financeiro sênior.
      Produza um relatório claro e conciso em **português do Brasil**, com:
      - Um **resumo geral** das transações;
      - **Três recomendações acionáveis** para o usuário;
      Abaixo estão os dados das transações:
    ${JSON.stringify(sample, null, 2)}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um analista financeiro sênior. Sempre responda em português do Brasil de forma profissional e objetiva." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 800
    });

    const reportText = response?.choices?.[0]?.message?.content || "No result";
    res.json({ report: reportText });
  } catch (err) {
    logger.error("openai_report_error", { err: err.message });
    res.status(500).json({ error: "report_failed", details: err.message });
  }
});

/* Function event forwarder (generic) */
app.post("/bff/function-event", authMiddleware, async (req, res) => {
  try {
    const funcUrl = `${FUNCTION_TRIGGER_URL}/event`;
    const r = await httpRequestWithRetry({ method: "post", url: funcUrl, data: req.body, headers: { "x-origin-bff": "financeai-bff" } });
    res.status(r.status).json(r.data);
  } catch (err) {
    logger.error("function_event_error", { err: err.message });
    res.status(502).json({ error: "function_event_failed", details: err.message });
  }
});

/* INTERNAL ADMIN: seed microservices via their /internal/seed endpoints (protected by INTERNAL_SECRET) */
app.post("/internal/seed", (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== INTERNAL_SECRET) return res.status(401).json({ error: "unauthorized" });

  Promise.allSettled([
    httpRequestWithRetry({ method: "post", url: `${TRANSACTIONS_SERVICE_URL}/internal/seed` }).catch((e) => ({ error: e.message })),
    httpRequestWithRetry({ method: "post", url: `${ANALYTICS_SERVICE_URL}/internal/seed` }).catch((e) => ({ error: e.message }))
  ])
    .then((results) => res.json({ results }))
    .catch((err) => res.status(500).json({ error: "seed_failed", details: err.message }));
});

/* METRICS (lightweight) */
app.get("/bff/metrics", (req, res) => {
  res.json({
    uptime: process.uptime(),
    ts: new Date().toISOString(),
    cacheKeys: cache.keys().length
  });
});

/* ----------------- Proxy helpers ----------------- */
async function proxyGet(url, params = {}) {
  const cfg = { method: "get", url, params, timeout: HTTP_TIMEOUT_MS };
  const r = await httpRequestWithRetry(cfg);
  return r.data;
}
async function proxyPost(url, data = {}) {
  const cfg = { method: "post", url, data, timeout: HTTP_TIMEOUT_MS };
  const r = await httpRequestWithRetry(cfg);
  return r.data;
}
async function proxyPut(url, data = {}) {
  const cfg = { method: "put", url, data, timeout: HTTP_TIMEOUT_MS };
  const r = await httpRequestWithRetry(cfg);
  return r.data;
}
async function proxyDelete(url) {
  const cfg = { method: "delete", url, timeout: HTTP_TIMEOUT_MS };
  const r = await httpRequestWithRetry(cfg);
  return r.data;
}

/* ----------------- Utilities ----------------- */
function txSign(t) {
  // Compat: tipos antigos (income/expense) e novos em PT-BR (Depósito/Despesa/Investimento)
  const tp = (t?.type || "").toString().toLowerCase();

  // Entradas (somam no balance)
  if (tp === "income" || tp === "depósito" || tp === "deposito") {
    return 1;
  }
  // Saídas (subtraem do balance)
  if (tp === "expense" || tp === "despesa" || tp === "investimento" || tp === "investment") {
    return -1;
  }
  // Tipos desconhecidos/neutral
  return 0;
}

function makeSeries(transactions) {
  const map = {};
  transactions.forEach((t) => {
    const d = new Date(t.date);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + (t.type === "income" ? t.amount : -t.amount);
  });
  return Object.keys(map)
    .sort()
    .map((k) => ({ month: k, value: map[k] }));
}

function invalidateUserCache(userId) {
  if (!userId) return;
  cache.keys().forEach((k) => {
    if (k.startsWith(`aggregate:${userId}`)) cache.del(k);
  });
}
function invalidateAllAggregateCache() {
  cache.keys().forEach((k) => {
    if (k.startsWith("aggregate:")) cache.del(k);
  });
}

/* Saneamento/validação do payload de criação */
function sanitizeTxPayload(body) {
  try {
    const out = {};
    // name
    if (!isNonEmptyString(body.name)) {
      return { error: { error: "nome_invalido", detail: "Campo 'name' é obrigatório." } };
    }
    out.name = body.name.trim();

    // amount
    const amount = parseAmount(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: { error: "valor_invalido", detail: "Campo 'amount' deve ser número > 0." } };
    }
    out.amount = amount;

    // type
    if (!TIPOS.includes(body.type)) {
      return { error: { error: "tipo_invalido", allow: TIPOS } };
    }
    out.type = body.type;

    // category
    if (!CATEGORIAS.includes(body.category)) {
      return { error: { error: "categoria_invalida", allow: CATEGORIAS } };
    }
    out.category = body.category;

    // paymentMethod
    if (!METODOS_PAGAMENTO.includes(body.paymentMethod)) {
      return { error: { error: "metodo_pagamento_invalido", allow: METODOS_PAGAMENTO } };
    }
    out.paymentMethod = body.paymentMethod;

    // date (opcional)
    if (body.date != null) {
      const d = coerceDate(body.date);
      if (!d) return { error: { error: "data_invalida", detail: "Use ISO ou YYYY-MM-DD." } };
      out.date = d;
    }

    return { value: out };
  } catch (e) {
    return { error: { error: "payload_invalido", detail: e.message } };
  }
}

/* ----------------- Error handling ----------------- */
app.use((err, req, res, next) => {
  logger.error("unhandled_error", { err: err?.message || err });
  res.status(500).json({ error: "internal_error", message: err?.message || "unknown" });
});

/* ----------------- Start ----------------- */
app.listen(PORT, () => {
  logger.info("FinanceAI BFF (refined) listening", {
    PORT,
    MOCK_AUTH,
    TRANSACTIONS_SERVICE_URL,
    ANALYTICS_SERVICE_URL,
    FUNCTION_TRIGGER_URL
  });
});
