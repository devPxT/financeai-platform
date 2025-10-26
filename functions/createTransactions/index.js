// functions/createTransaction/index.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export default async function (context, req) {
  context.log("createTransaction invoked");
  const payload = req.body || {};
  // Simple validation
  if (!payload.userId || !payload.type || !payload.amount) {
    context.res = { status: 400, body: { error: "missing_fields" } };
    return;
  }

  try {
    // Forward to transactions-service (could use direct DB if desired)
    const txServiceUrl = (process.env.TRANSACTIONS_SERVICE_URL || "http://localhost:4100") + "/transactions";
    const r = await fetch(txServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await r.json();
    // Optionally return 202 Accepted if you want async
    context.res = { status: r.status, body: json };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, body: { error: err.message } };
  }
}
