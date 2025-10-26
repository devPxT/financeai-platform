// functions/functionContext/index.js
import dotenv from "dotenv";
dotenv.config();

export default async function (context, req) {
  const userId = req.query.userId || (req.body && req.body.userId) || "demo";
  // Simple contextual data: forecast or external payments mock
  // In production replace with real logic (bank connectors, forecasting)
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
}
