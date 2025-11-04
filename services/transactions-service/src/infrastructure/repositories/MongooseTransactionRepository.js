import TransactionModel from "../../../models/Transaction.js";

export default function buildMongooseTransactionRepository() {
  return Object.freeze({
    async find({ query = {}, sort = { date: -1 }, limit = 0 } = {}) {
      let q = TransactionModel.find(query);
      if (sort) q = q.sort(sort);
      if (limit && Number(limit) > 0) q = q.limit(Number(limit));
      return q.exec();
    },
    async create(doc) {
      return TransactionModel.create(doc);
    },
    async update(id, patch) {
      return TransactionModel.findByIdAndUpdate(id, patch, { new: true });
    },
    async remove(id) {
      return TransactionModel.findByIdAndDelete(id);
    },
    async insertMany(list) {
      return TransactionModel.insertMany(list);
    },
    async count() {
      return TransactionModel.countDocuments();
    }
  });
}

