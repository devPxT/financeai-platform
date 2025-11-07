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

module.exports = async function (context, req) {
  context.log("deleteTransactions invoked");

  try {
    const id = req.params?.id;
    if (!id) {
      context.res = { status: 400, body: { error: "missing_id_param" } };
      return;
    }
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      context.res = { status: 400, body: { error: "invalid_id" } };
      return;
    }

    const userId = req.headers?.["x-user-id"] || req.headers?.["X-User-Id"] || req.body?.userId;
    if (!userId) {
      context.res = { status: 401, body: { error: "missing_user_id" } };
      return;
    }

    const db = await getDb();
    const col = db.collection(process.env.MONGO_COLLECTION || "transactions");

    const filter = { _id: oid, userId };
    const { deletedCount } = await col.deleteOne(filter);

    if (!deletedCount) {
      context.res = { status: 404, body: { error: "not_found_or_not_owned" } };
      return;
    }

    context.res = { status: 200, body: { ok: true, deletedCount } };
  } catch (err) {
    context.log.error("deleteTransactions error", err);
    context.res = { status: 500, body: { error: err.message || "internal_error" } };
  }
};