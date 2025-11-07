// const crypto = require("crypto");
// const { MongoClient } = require("mongodb");

// // Cache de conexão entre invocações (reutiliza pool)
// let cachedClient = null;
// let cachedDb = null;
// let indexesCreated = false;

// function parseDbNameFromUri(uri) {
//   // tenta extrair /<dbName> da connection string
//   try {
//     const m = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)(?:\?|$)/);
//     return m?.[1] || null;
//   } catch {
//     return null;
//   }
// }

// async function getDb() {
//   if (cachedDb && cachedClient) return cachedDb;

//   const uri = process.env.MONGO_URI;
//   if (!uri) throw new Error("MONGO_URI not configured");

//   const dbName =
//     process.env.MONGO_DB_NAME ||
//     parseDbNameFromUri(uri) ||
//     "financeai_transactions";

//   const client = new MongoClient(uri, {
//     maxPoolSize: 10,
//     serverSelectionTimeoutMS: 8000,
//   });

//   await client.connect();
//   cachedClient = client;
//   cachedDb = client.db(dbName);
//   return cachedDb;
// }

// function coerceDate(d) {
//   if (!d) return new Date();
//   if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
//     // meio-dia UTC para evitar problemas de fuso ao salvar como Date
//     return new Date(`${d}T12:00:00.000Z`);
//   }
//   const nd = new Date(d);
//   return Number.isFinite(nd.valueOf()) ? nd : new Date();
// }

// function parseAmount(v) {
//   if (typeof v === "number") return v;
//   if (typeof v === "string") {
//     const n = Number(v.replace?.(".", "").replace?.(",", "."));
//     return Number.isFinite(n) ? n : NaN;
//   }
//   return NaN;
// }

// module.exports = async function (context, req) {
//   context.log("createTransaction function invoked");

//   // mock opcional via query/header
//   const isMock =
//     (req.query && (req.query.mock === "1" || req.query.mock === "true")) ||
//     (req.headers &&
//       (req.headers["x-run-mode"] === "mock" ||
//         req.headers["X-Run-Mode"] === "mock")) ||
//     process.env.ALLOW_PORTAL_TEST === "true";

//   const payload = req.body || {};
//   const headerUserId = req.headers?.["x-user-id"] || req.headers?.["X-User-Id"];
//   const userId = headerUserId || payload.userId;

//   // Validação mínima
//   const amount = parseAmount(payload.amount);
//   const requiredMissing =
//     !userId ||
//     !payload.name ||
//     !payload.type ||
//     !payload.category ||
//     !payload.paymentMethod ||
//     !Number.isFinite(amount) ||
//     amount <= 0;

//   if (requiredMissing && !isMock) {
//     context.res = {
//       status: 400,
//       body: {
//         error:
//           "missing_or_invalid_fields (userId, name, type, category, paymentMethod, amount>0)",
//       },
//     };
//     return;
//   }

//   if (isMock) {
//     const id = "mock-" + crypto.randomBytes(6).toString("hex");
//     const now = new Date().toISOString();
//     const mockTransaction = {
//       _id: id,
//       userId: userId || "demo",
//       name: payload.name || "mock",
//       type: payload.type || "Despesa",
//       category: payload.category || "Outros",
//       paymentMethod: payload.paymentMethod || "Pix",
//       amount: Number.isFinite(amount) ? amount : 0,
//       date: payload.date || now,
//       createdAt: now,
//       updatedAt: now,
//     };
//     context.res = {
//       status: 201,
//       body: { mock: true, created: mockTransaction },
//     };
//     return;
//   }

//   try {
//     const db = await getDb();
//     const collectionName = process.env.MONGO_COLLECTION || "transactions";
//     const col = db.collection(collectionName);

//     // garante índices úteis (uma vez por processo)
//     if (!indexesCreated) {
//       try {
//         await col.createIndex({ userId: 1, date: -1 }, { background: true });
//         indexesCreated = true;
//       } catch (e) {
//         context.log.warn("index creation skipped/failed:", e?.message);
//       }
//     }

//     const now = new Date();
//     const doc = {
//       userId,
//       name: String(payload.name).trim(),
//       type: payload.type, // "Despesa" | "Depósito" | "Investimento"
//       category: payload.category,
//       paymentMethod: payload.paymentMethod,
//       amount, // number
//       date: coerceDate(payload.date), // Date
//       createdAt: now,
//       updatedAt: now,
//     };

//     const result = await col.insertOne(doc);
//     doc._id = result.insertedId;

//     context.res = {
//       status: 201,
//       body: doc,
//     };
//   } catch (err) {
//     context.log.error("createTransaction DB error", err);
//     context.res = { status: 500, body: { error: err.message || "internal_error" } };
//   }
// };

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