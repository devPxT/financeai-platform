import mongoose from "mongoose";

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

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    // Nome (antes era "note")
    name: { type: String, required: true },

    // Tipo (enum em português)
    type: { type: String, enum: TIPOS, required: true },

    // Categoria (enum em português)
    category: { type: String, enum: CATEGORIAS, required: true },

    // Método de pagamento (enum)
    paymentMethod: { type: String, enum: METODOS_PAGAMENTO, required: true },

    // Valor
    amount: { type: Number, required: true },

    // Data informada pelo usuário (opcional; se não enviada, usa agora)
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Índice útil para consultas por usuário e data (mensal, etc.)
transactionSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Transaction ||mongoose.model("Transaction", transactionSchema);