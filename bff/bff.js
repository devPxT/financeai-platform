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

dotenv.config();

/* ----------------- Config ----------------- */
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const MOCK_AUTH = (process.env.MOCK_AUTH || "true").toLowerCase() === "true";
const CLERK_JWKS_URI = process.env.CLERK_JWKS_URI || "";
const CLERK_AUDIENCE = process.env.CLERK_AUDIENCE || "";

const TRANSACTIONS_SERVICE_URL = (process.env.TRANSACTIONS_SERVICE_URL || "http://localhost:4100").replace(/\/$/, "");
const ANALYTICS_SERVICE_URL = (process.env.ANALYTICS_SERVICE_URL || "http://localhost:4200").replace(/\/$/, "");
const FUNCTION_TRIGGER_URL = (process.env.FUNCTION_TRIGGER_URL || "http://localhost:4300").replace(/\/$/, "");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

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
app.get("/bff/aggregate", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const userId = req.query.userId || (user && (user.id || user.sub || user.email?.split?.[0]));
    const cacheKey = `aggregate:${userId || "anon"}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ fromCache: true, ...cached });
    }

    // call transactions service
    const txUrl = `${TRANSACTIONS_SERVICE_URL}/transactions`;
    const txPromise = proxyGet(txUrl, { userId }).catch((e) => {
      logger.warn("tx_service_unavailable", { err: e?.message });
      return [];
    });

    // call function HTTP trigger (GET)
    const funcUrl = `${FUNCTION_TRIGGER_URL}?userId=${encodeURIComponent(userId || "")}`;
    const funcPromise = httpRequestWithRetry({ method: "get", url: funcUrl }).then((r) => r.data).catch((e) => {
      logger.warn("function_unavailable", { err: e?.message });
      return null;
    });

    const [transactions, functionData] = await Promise.all([txPromise, funcPromise]);

    const balance = (transactions || []).reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    const series = makeSeries(transactions || []);
    const payload = { userId, balance, series, recent: (transactions || []).slice(0, 10), functionData };

    cache.set(cacheKey, payload);
    res.json({ fromCache: false, ...payload });
  } catch (err) {
    logger.error("aggregate_error", { err: err.message });
    res.status(500).json({ error: "aggregate_failed", details: err.message });
  }
});

/* TRANSACTIONS proxy endpoints (CRUD) */
app.get("/bff/transactions", authMiddleware, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    const url = `${TRANSACTIONS_SERVICE_URL}/transactions`;
    const data = await proxyGet(url, { userId });
    res.json(data);
  } catch (err) {
    logger.error("list_transactions_failed", { err: err.message });
    res.status(500).json({ error: "list_transactions_failed" });
  }
});

app.post("/bff/transactions", authMiddleware, async (req, res) => {
  const mode = (req.query.mode || "sync").toLowerCase();
  const payload = { ...(req.body || {}) };
  payload.userId = req.user?.id || payload.userId;
  try {
    if (mode === "async") {
      // forward to function trigger (createTransaction endpoint)
      const funcUrl = `${FUNCTION_TRIGGER_URL}/createTransaction`;
      try {
        const r = await httpRequestWithRetry({ method: "post", url: funcUrl, data: payload, headers: { "x-origin-bff": "financeai-bff" } });
        // function may return 202 Accepted
        return res.status(r.status === 202 ? 202 : 201).json({ fromFunction: true, data: r.data });
      } catch (err) {
        logger.warn("function_create_failed", { err: err.message });
        // fallback: try direct create on transactions-service
        const svcUrl = `${TRANSACTIONS_SERVICE_URL}/transactions`;
        const created = await proxyPost(svcUrl, payload);
        invalidateUserCache(payload.userId);
        return res.status(201).json({ fallback: true, created });
      }
    } else {
      // sync -> direct to transactions service
      const svcUrl = `${TRANSACTIONS_SERVICE_URL}/transactions`;
      const created = await proxyPost(svcUrl, payload);
      invalidateUserCache(payload.userId);
      return res.status(201).json(created);
    }
  } catch (err) {
    logger.error("create_transaction_failed", { err: err.message });
    res.status(500).json({ error: "create_transaction_failed", details: err.message });
  }
});

app.put("/bff/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const url = `${TRANSACTIONS_SERVICE_URL}/transactions/${encodeURIComponent(id)}`;
    const updated = await proxyPut(url, req.body);
    invalidateAllAggregateCache();
    res.json(updated);
  } catch (err) {
    logger.error("update_transaction_failed", { err: err.message });
    res.status(500).json({ error: "update_transaction_failed" });
  }
});

app.delete("/bff/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const url = `${TRANSACTIONS_SERVICE_URL}/transactions/${encodeURIComponent(id)}`;
    const deleted = await proxyDelete(url);
    invalidateAllAggregateCache();
    res.json({ ok: true, deleted });
  } catch (err) {
    logger.error("delete_transaction_failed", { err: err.message });
    res.status(500).json({ error: "delete_transaction_failed" });
  }
});

/* COMBINED KPIs: call transactions summary + analytics service KPIs */
app.get("/bff/combined-kpi", authMiddleware, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    const txSummaryUrl = `${TRANSACTIONS_SERVICE_URL}/summary?userId=${encodeURIComponent(userId || "")}`;
    const analyticsUrl = `${ANALYTICS_SERVICE_URL}/kpis?userId=${encodeURIComponent(userId || "")}`;

    const [txResp, analyticsResp] = await Promise.allSettled([
      httpRequestWithRetry({ method: "get", url: txSummaryUrl }),
      httpRequestWithRetry({ method: "get", url: analyticsUrl })
    ]);

    const txSummary = txResp.status === "fulfilled" ? txResp.value.data : { error: "tx_error" };
    const analytics = analyticsResp.status === "fulfilled" ? analyticsResp.value.data : { error: "analytics_error" };

    res.json({ userId, txSummary, analytics });
  } catch (err) {
    logger.error("combined_kpi_error", { err: err.message });
    res.status(500).json({ error: "combined_kpi_failed" });
  }
});

/* STRIPE: create checkout session (server-side) */
app.post("/bff/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    if (!priceId) return res.status(400).json({ error: "priceId required" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: req.user?.email,
      success_url: successUrl || `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/cancel`
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
    // small sample to avoid huge prompt
    const sample = (Array.isArray(txs) ? txs.slice(-80) : []);
    const prompt = `You are a senior financial analyst. Produce a clear concise report (summary + 3 actionable recommendations) from the following transactions data:\n\n${JSON.stringify(sample, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert financial analyst." },
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
