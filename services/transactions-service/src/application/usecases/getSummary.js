export default function buildGetSummary({ repo }) {
  return async function getSummary({ userId } = {}) {
    const query = userId ? { userId } : {};
    const txs = await repo.find({ query });
    const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, count: txs.length };
  };
}

