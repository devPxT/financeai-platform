// Utilitários para filtrar e agregar as transações por período e calcular os KPIs do dashboard.

export function normalizeType(t) {
  const v = String(t || "").trim().toLowerCase();
  // Compatibilidade com variações
  if (v === "income" || v === "depósito" || v === "deposito" || v === "deposit") return "DEPOSIT";
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

  // Agrupa TODAS as transações (exceto UNKNOWN) por categoria
  const byCat = new Map();
  for (const t of txs) {
    const normType = normalizeType(t.type);
    if (normType === "UNKNOWN") continue;
    const cat = String(t.category || "Outros").trim() || "Outros";
    const cur = byCat.get(cat) || 0;
    byCat.set(cat, cur + toNumber(t.amount));
  }

  const totalAll = depositsTotal + expensesTotal + investmentsTotal;
  const totalExpensePerCategory = Array.from(byCat.entries()).map(([category, totalAmount]) => ({
    category,
    totalAmount: toNumber(totalAmount),
    percentageOfTotal: totalAll > 0 ? Math.round((toNumber(totalAmount) / totalAll) * 100) : 0
  }));

  // Ordena por maior valor
  totalExpensePerCategory.sort((a, b) => b.totalAmount - a.totalAmount);

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
    // Mantém o nome antigo para compatibilidade (agora contém todas as categorias)
    totalExpensePerCategory,
    lastTransactions
  };
}