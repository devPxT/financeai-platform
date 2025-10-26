const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function (context, req) {
  context.log("createTransaction function invoked");

  const payload = req.body || {};
  if (!payload.userId || !payload.type || payload.amount === undefined) {
    context.res = { status: 400, body: { error: "missing_fields (userId, type, amount required)" } };
    return;
  }

  try {
    const txServiceUrl = (process.env.TRANSACTIONS_SERVICE_URL || "http://localhost:4100").replace(/\/$/, "") + "/transactions";
    const r = await fetch(txServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await r.json().catch(()=>({}));
    context.res = { status: r.status || 200, body: json };
  } catch (err) {
    context.log.error("createTransaction error", err);
    context.res = { status: 500, body: { error: err.message } };
  }
};
