import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ["income","expense"], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "BRL" },
  date: { type: Date, default: Date.now },
  note: { type: String }
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
