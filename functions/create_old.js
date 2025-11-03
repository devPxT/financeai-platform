const fetch = require("node-fetch");
require("dotenv").config();
const crypto = require("crypto");

module.exports = async function (context, req) {
  context.log("createTransaction function invoked");

  // modo mock para testes no Portal:
  // - query ?mock=1
  // - header x-run-mode: mock
  const isMock =
    (req.query && (req.query.mock === "1" || req.query.mock === "true")) ||
    (req.headers && (req.headers["x-run-mode"] === "mock" || req.headers["X-Run-Mode"] === "mock")) ||
    process.env.ALLOW_PORTAL_TEST === "true";

  const payload = req.body || {};

  // valida campos mínimos, mas permite bypass em mock se desejar
  if (!payload.userId || !payload.type || payload.amount === undefined) {
    // se mock, aceita e preenche alguns campos mínimos automaticamente para facilitar testes
    if (!isMock) {
      context.res = {
        status: 400,
        body: { error: "missing_fields (userId, type, amount required)" }
      };
      return;
    }
  }

  // Se está em modo MOCK, retornar resposta simulada (gera id local)
  if (isMock) {
    const id = "mock-" + crypto.randomBytes(6).toString("hex");
    const now = new Date().toISOString();
    const mockTransaction = {
      id,
      userId: payload.userId || "demo",
      type: payload.type || "expense",
      category: payload.category || "mock",
      amount: payload.amount != null ? payload.amount : 0,
      date: payload.date || now,
      notes: payload.notes || "mocked via portal",
      createdAt: now,
      updatedAt: now
    };

    context.log("createTransaction (MOCK) returning simulated transaction", { id });
    context.res = {
      status: 201,
      body: { mock: true, message: "This is a simulated response (mock mode)", created: mockTransaction }
    };
    return;
  }

  // Modo normal: encaminhar para transactions-service
  try {
    const txServiceUrl = (process.env.TRANSACTIONS_SERVICE_URL || "http://localhost:4100").replace(/\/$/, "") + "/transactions";
    context.log("Forwarding to transactions service:", txServiceUrl);

    const r = await fetch(txServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-origin-function": "createTransaction" },
      body: JSON.stringify(payload)
    });

    const json = await r.json().catch(() => ({}));
    context.res = { status: r.status || 200, body: json };
  } catch (err) {
    context.log.error("createTransaction error", err);
    context.res = { status: 500, body: { error: err.message || "internal_error" } };
  }
};
