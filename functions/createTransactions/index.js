const { MongoClient } = require("mongodb");

// cache de conexão
let cachedClient = null;
let cachedDb = null;

function parseDbNameFromUri(uri) {
  const m = uri && uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)(?:\?|$)/);
  return m?.[1] || "financeai_transactions";
}

async function getDb() {
  if (cachedDb && cachedClient) return cachedDb;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not configured");
  const dbName = process.env.MONGO_DB_NAME || parseDbNameFromUri(uri);
  const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  cachedClient = client;
  cachedDb = client.db(dbName);
  return cachedDb;
}

function coerceDate(d) {
  if (!d) return new Date();
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T12:00:00.000Z`);
  const nd = new Date(d);
  return Number.isFinite(nd.valueOf()) ? nd : new Date();
}
function parseAmount(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

module.exports = async function (context, req) {
  context.log("createTransactions invoked");
  try {
    const body = req.body || {};
    const userId = req.headers?.["x-user-id"] || body.userId;
    const amount = parseAmount(body.amount);

    if (!userId || !body.name || !body.type || !body.category || !body.paymentMethod || !Number.isFinite(amount) || amount <= 0) {
      context.res = { status: 400, body: { error: "missing_or_invalid_fields" } };
      return;
    }

    const db = await getDb();
    const col = db.collection(process.env.MONGO_COLLECTION || "transactions");
    const now = new Date();
    const doc = {
      userId,
      name: String(body.name).trim(),
      type: body.type,
      category: body.category,
      paymentMethod: body.paymentMethod,
      amount,
      date: coerceDate(body.date),
      createdAt: now,
      updatedAt: now
    };
    const result = await col.insertOne(doc);
    doc._id = result.insertedId;

    context.res = { status: 201, body: doc };
  } catch (err) {
    context.log.error("createTransactions error", err);
    context.res = { status: 500, body: { error: err.message || "internal_error" } };
  }
};