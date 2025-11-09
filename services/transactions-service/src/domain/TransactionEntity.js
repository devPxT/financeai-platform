// Entidade de domínio (não depende de mongoose ou express)
export class TransactionEntity {
  constructor({ id = null, userId, name, type, category, paymentMethod, amount, date }) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.type = type;
    this.category = category;
    this.paymentMethod = paymentMethod;
    this.amount = Number(amount);
    this.date = date instanceof Date ? date : new Date(date);
  }

  validate() {
    if (!this.userId) throw new Error("userId_required");
    if (!this.name) throw new Error("name_required");
    if (!this.type) throw new Error("type_required");
    if (!this.category) throw new Error("category_required");
    if (!this.paymentMethod) throw new Error("paymentMethod_required");
    if (!(this.amount > 0)) throw new Error("amount_must_be_positive");
    return true;
  }
}