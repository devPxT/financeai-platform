import Transaction from "../models/Transaction.js";

export async function list(req, res) {
  try {
    const { userId, from, to, limit = 300 } = req.query;
    const q = {};
    if (userId) q.userId = userId;
    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);
    const txs = await Transaction.find(q).sort({ date: -1 }).limit(Number(limit));
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const payload = req.body;
    if (!payload.userId || !payload.type || !payload.amount || !payload.category) return res.status(400).json({ error: "missing_fields" });
    const tx = await Transaction.create(payload);
    res.status(201).json(tx);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function update(req, res) {
  try {
    const id = req.params.id;
    const updated = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function remove(req, res) {
  try {
    const id = req.params.id;
    await Transaction.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function summary(req, res) {
  try {
    const userId = req.query.userId;
    const q = userId ? { userId } : {};
    const txs = await Transaction.find(q);
    const totalIncome = txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const totalExpense = txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    const balance = totalIncome - totalExpense;
    res.json({ totalIncome, totalExpense, balance, count: txs.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function seed() {
  const cnt = await Transaction.countDocuments();
  if (cnt > 0) return { created: 0 };
  const demo = [
    { userId: "demo", type: "income", category: "Salary", amount: 5000, date: new Date() },
    { userId: "demo", type: "expense", category: "Groceries", amount: 120, date: new Date() },
    { userId: "demo", type: "expense", category: "Transport", amount: 250, date: new Date() }
  ];
  const created = await Transaction.insertMany(demo);
  return { created: created.length };
}
