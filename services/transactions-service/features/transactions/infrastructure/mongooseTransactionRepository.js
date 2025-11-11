// Repositório concreto (infra) - única parte que conhece mongoose
// import Transaction from "../models/Transaction.js"; // reaproveitando schema existente
import Transaction from "../models/Transaction.js";
import { TransactionEntity } from "../domain/TransactionEntity.js";


export class MongooseTransactionRepository {
  async list({ userId, from, to, limit = 300 }) {
    const q = {};
    if (userId) q.userId = userId;
    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);
    const docs = await Transaction.find(q).sort({ date: -1 }).limit(Number(limit));
    return docs.map((d) => new TransactionEntity({
      id: d._id?.toString(),
      userId: d.userId,
      name: d.name,
      type: d.type,
      category: d.category,
      paymentMethod: d.paymentMethod,
      amount: d.amount,
      date: d.date
    }));
  }

  async create(data) {
    const entity = new TransactionEntity(data);
    entity.validate();
    const doc = await Transaction.create({
      userId: entity.userId,
      name: entity.name,
      type: entity.type,
      category: entity.category,
      paymentMethod: entity.paymentMethod,
      amount: entity.amount,
      date: entity.date
    });
    return new TransactionEntity({
      id: doc._id?.toString(),
      userId: doc.userId,
      name: doc.name,
      type: doc.type,
      category: doc.category,
      paymentMethod: doc.paymentMethod,
      amount: doc.amount,
      date: doc.date
    });
  }

  async update(id, data) {
    const updated = await Transaction.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return null;
    return new TransactionEntity({
      id: updated._id?.toString(),
      userId: updated.userId,
      name: updated.name,
      type: updated.type,
      category: updated.category,
      paymentMethod: updated.paymentMethod,
      amount: updated.amount,
      date: updated.date
    });
  }

  async remove(id) {
    await Transaction.findByIdAndDelete(id);
    return true;
  }

  async seedDemo() {
    const cnt = await Transaction.countDocuments();
    if (cnt > 0) return 0;
    const demo = [
      { userId: "demo", type: "income", category: "Salary", amount: 5000, date: new Date(), name: "Salary" },
      { userId: "demo", type: "expense", category: "Groceries", amount: 120, date: new Date(), name: "Groceries" },
      { userId: "demo", type: "expense", category: "Transport", amount: 250, date: new Date(), name: "Transport" }
    ];
    await Transaction.insertMany(demo);
    return demo.length;
  }
}