// Clean Architecture entrypoints for HTTP layer
import buildMongooseTransactionRepository from "../src/infrastructure/repositories/MongooseTransactionRepository.js";
import buildCreateTransaction from "../src/application/usecases/createTransaction.js";
import buildListTransactions from "../src/application/usecases/listTransactions.js";
import buildUpdateTransaction from "../src/application/usecases/updateTransaction.js";
import buildRemoveTransaction from "../src/application/usecases/removeTransaction.js";
import buildGetSummary from "../src/application/usecases/getSummary.js";

const repo = buildMongooseTransactionRepository();

// Exported for tests (dependency injection capability)
export function buildControllers(customRepo = repo) {
  const listUC = buildListTransactions({ repo: customRepo });
  const createUC = buildCreateTransaction({ repo: customRepo });
  const updateUC = buildUpdateTransaction({ repo: customRepo });
  const removeUC = buildRemoveTransaction({ repo: customRepo });
  const summaryUC = buildGetSummary({ repo: customRepo });

  return {
    async list(req, res) {
      try {
        const { userId, from, to, limit = 300 } = req.query;
        const txs = await listUC({ userId, from, to, limit: Number(limit) });
        res.json(txs);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    async create(req, res) {
      try {
        const payload = req.body || {};
        const tx = await createUC(payload);
        res.status(201).json(tx);
      } catch (err) {
        const code = err.code === "validation_error" ? 400 : 500;
        res.status(code).json({ error: err.code || "error", message: err.message });
      }
    },
    async update(req, res) {
      try {
        const id = req.params.id;
        const updated = await updateUC({ id, patch: req.body || {} });
        if (!updated) return res.status(404).json({ error: "not_found" });
        res.json(updated);
      } catch (err) { res.status(500).json({ error: err.message }); }
    },
    async remove(req, res) {
      try {
        const id = req.params.id;
        await removeUC({ id });
        res.json({ ok: true });
      } catch (err) { res.status(500).json({ error: err.message }); }
    },
    async summary(req, res) {
      try {
        const userId = req.query.userId;
        const s = await summaryUC({ userId });
        res.json(s);
      } catch (err) { res.status(500).json({ error: err.message }); }
    },
    async seed() {
      // lightweight seeding via repository (used by /internal/seed in index.js)
      const count = await customRepo.count();
      if (count > 0) return { created: 0 };
      const demo = [
        { userId: "demo", type: "income", category: "Salary", amount: 5000, date: new Date() },
        { userId: "demo", type: "expense", category: "Groceries", amount: 120, date: new Date() },
        { userId: "demo", type: "expense", category: "Transport", amount: 250, date: new Date() }
      ];
      const created = await customRepo.insertMany(demo);
      return { created: created.length };
    }
  };
}

// default controllers (used by router)
const defaultCtrl = buildControllers();
export const { list, create, update, remove, summary, seed } = defaultCtrl;
