export const TRANSACTION_TYPES = {
  DESPESA: "Despesa",
  DEPOSITO: "Depósito",
  INVESTIMENTO: "Investimento"
};

export function normalizeType(t) {
  const v = String(t || "").toLowerCase().trim();
  if (["despesa", "expense"].includes(v)) return TRANSACTION_TYPES.DESPESA;
  if (["depósito", "deposito", "deposit"].includes(v)) return TRANSACTION_TYPES.DEPOSITO;
  if (["investimento", "investment"].includes(v)) return TRANSACTION_TYPES.INVESTIMENTO;
  return t;
}