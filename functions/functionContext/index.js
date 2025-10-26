require("dotenv").config();

module.exports = async function (context, req) {
  const userId = (req.query.userId || (req.body && req.body.userId) || "demo");
  const data = {
    userId,
    forecast: {
      nextMonthExpenseEstimate: 1200,
      topCategories: [
        { category: "Groceries", pct: 28 },
        { category: "Transport", pct: 14 }
      ]
    },
    externalPayments: []
  };
  context.res = { status: 200, body: data };
};
