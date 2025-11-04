export default function buildListTransactions({ repo }) {
  return async function listTransactions({ userId, from, to, limit = 300 } = {}) {
    const query = {};
    if (userId) query.userId = userId;
    if (from || to) query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
    return repo.find({ query, sort: { date: -1 }, limit });
  };
}

