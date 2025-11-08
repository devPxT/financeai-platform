// Utilitários para filtrar e agregar as transações por período e calcular os KPIs do dashboard.

export function normalizeType(t) {
  const v = String(t || "").toLowerCase();
  // Compatibilidade com sua base
  if (v === "income" || v === "depósito" || v === "deposito" || v === "deposit" || v === "deposito") return "DEPOSIT";
  if (v === "expense" || v === "despesa") return "EXPENSE";
  if (v === "investment" || v === "investimento") return "INVESTMENT";
  return "UNKNOWN";
}

export function inMonthYear(dateStr, month, year) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.valueOf())) return false;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear());
  return mm === month && yy === year;
}

export function filterByPeriod(transactions, month, year) {
  return (transactions || []).filter((t) => inMonthYear(t.date, month, year));
}

export function toNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function computeDashboard(transactionsOfPeriod) {
  const txs = Array.isArray(transactionsOfPeriod) ? transactionsOfPeriod : [];

  let depositsTotal = 0;
  let expensesTotal = 0;
  let investmentsTotal = 0;

  for (const t of txs) {
    const amount = toNumber(t.amount);
    const type = normalizeType(t.type);
    if (type === "DEPOSIT") depositsTotal += amount;
    else if (type === "EXPENSE") expensesTotal += amount;
    else if (type === "INVESTMENT") investmentsTotal += amount;
  }

  const balance = depositsTotal - investmentsTotal - expensesTotal;

  const transactionsTotal = toNumber(depositsTotal + expensesTotal + investmentsTotal) || 0;
  const pct = (n) => (transactionsTotal > 0 ? Math.round((toNumber(n) / transactionsTotal) * 100) : 0);

  const typesPercentage = {
    DEPOSIT: pct(depositsTotal),
    EXPENSE: pct(expensesTotal),
    INVESTMENT: pct(investmentsTotal)
  };

  // Agrupa despesas por categoria
  const byCat = new Map();
  for (const t of txs) {
    if (normalizeType(t.type) !== "EXPENSE") continue;
    const cat = String(t.category || "Outros");
    const cur = byCat.get(cat) || 0;
    byCat.set(cat, cur + toNumber(t.amount));
  }
  const totalExpense = expensesTotal || 0;
  const totalExpensePerCategory = Array.from(byCat.entries()).map(([category, totalAmount]) => ({
    category,
    totalAmount: toNumber(totalAmount),
    percentageOfTotal: totalExpense > 0 ? Math.round((toNumber(totalAmount) / totalExpense) * 100) : 0
  }));

  // Últimas 15 transações do período
  const lastTransactions = [...txs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions
  };
}