export const TIPOS = ["Despesa", "Depósito", "Investimento"];

export const CATEGORIAS = [
  "Educação",
  "Entretenimento",
  "Alimentação",
  "Saúde",
  "Moradia",
  "Outros",
  "Salário",
  "Transporte",
  "Utilidades",
];

export const METODOS_PAGAMENTO = [
  "Transferência Bancária",
  "Boleto Bancário",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Outros",
  "Pix",
];

export const TRANSACTION_TYPE_OPTIONS = TIPOS.map((t) => ({ value: t, label: t }));
export const TRANSACTION_CATEGORY_OPTIONS = CATEGORIAS.map((c) => ({ value: c, label: c }));
export const TRANSACTION_PAYMENT_METHOD_OPTIONS = METODOS_PAGAMENTO.map((m) => ({ value: m, label: m }));