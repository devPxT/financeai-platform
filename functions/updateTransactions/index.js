const { MongoClient, ObjectId } = require("mongodb");

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
  if (!d) return undefined;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T12:00:00.000Z`);
  const nd = new Date(d);
  return Number.isFinite(nd.valueOf()) ? nd : undefined;
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
  context.log("updateTransactions invoked");

  try {
    const id = req.params?.id;
    if (!id) {
      context.res = { status: 400, body: { error: "missing_id_param" } };
      return;
    }

    const userId = req.headers?.["x-user-id"] || req.headers?.["X-User-Id"] || req.body?.userId;
    if (!userId) {
      context.res = { status: 401, body: { error: "missing_user_id" } };
      return;
    }

    // Monta o payload a atualizar (validação leve)
    const body = req.body || {};
    const allowed = ["name", "amount", "type", "category", "paymentMethod", "date"];
    const update = {};
    for (const k of allowed) {
      if (k in body) {
        if (k === "amount") {
          const n = parseAmount(body.amount);
          if (!Number.isFinite(n) || n <= 0) {
            context.res = { status: 400, body: { error: "valor_invalido" } };
            return;
          }
          update.amount = n;
        } else if (k === "date") {
          const d = coerceDate(body.date);
          if (!d) {
            context.res = { status: 400, body: { error: "data_invalida" } };
            return;
          }
          update.date = d;
        } else {
          update[k] = body[k];
        }
      }
    }
    if (Object.keys(update).length === 0) {
      context.res = { status: 400, body: { error: "no_fields_to_update" } };
      return;
    }
    update.updatedAt = new Date();

    const db = await getDb();
    const col = db.collection(process.env.MONGO_COLLECTION || "transactions");

    // Compatível com _id como ObjectId OU string (dados legados)
    let oid = null;
    try {
      oid = new ObjectId(id);
    } catch {
      // id não é um ObjectId válido -> usaremos apenas string
    }
    const baseMatch = { userId };
    const filter = oid
      ? { ...baseMatch, $or: [{ _id: oid }, { _id: id }] }
      : { ...baseMatch, _id: id };

    // 1) atualiza
    const r = await col.updateOne(filter, { $set: update });
    if (!r.matchedCount) {
      context.res = { status: 404, body: { error: "not_found_or_not_owned" } };
      return;
    }

    // 2) lê o doc atualizado para retornar no body
    const doc = await col.findOne(filter);
    if (!doc) {
      // deveria existir, mas por segurança retornamos o resultado da operação
      context.res = { status: 200, body: { ok: true, matchedCount: r.matchedCount, modifiedCount: r.modifiedCount } };
      return;
    }

    context.res = { status: 200, body: doc };
  } catch (err) {
    context.log.error("updateTransactions error", err);
    context.res = { status: 500, body: { error: err.message || "internal_error" } };
  }
};