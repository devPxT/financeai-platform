require("dotenv").config();

module.exports = async function (context, req) {
  context.log("functionContext invoked");

  // Detect mock/test mode:
  const isMock =
    (req.query && (req.query.mock === "1" || req.query.mock === "true")) ||
    (req.headers && (req.headers["x-run-mode"] === "mock" || req.headers["X-Run-Mode"] === "mock")) ||
    process.env.ALLOW_PORTAL_TEST === "true";

  // Default values
  const defaultEstimate = 1200;
  const defaultCategories = [
    { category: "Groceries", pct: 28 },
    { category: "Transport", pct: 14 }
  ];

  // Acquire overrides from query or body (if present)
  const q = req.query || {};
  const b = req.body || {};

  const userId = q.userId || b.userId || "demo";

  // helper to parse categories from query (JSON) or body
  let parsedCategories = null;
  if (q.topCategories) {
    try {
      parsedCategories = JSON.parse(q.topCategories);
    } catch (e) {
      // ignore parse error; will fallback to default
    }
  } else if (b.topCategories) {
    parsedCategories = b.topCategories;
  }

  const nextMonthEstimate =
    (typeof q.nextMonthExpenseEstimate !== "undefined" ? Number(q.nextMonthExpenseEstimate) :
      (typeof b.nextMonthExpenseEstimate !== "undefined" ? Number(b.nextMonthExpenseEstimate) : defaultEstimate));

  const topCategories = Array.isArray(parsedCategories) ? parsedCategories : defaultCategories;

  // Build response payload
  const data = {
    userId,
    forecast: {
      nextMonthExpenseEstimate: nextMonthEstimate,
      topCategories
    },
    externalPayments: b.externalPayments || q.externalPayments || []
  };

  if (isMock) {
    context.log("functionContext returning MOCK response", { userId, nextMonthEstimate, topCategories });
    context.res = {
      status: 200,
      body: {
        mock: true,
        message: "Simulated response (mock mode)",
        ...data
      }
    };
    return;
  }

  // Normal behavior (production/dev non-mock)
  context.log("functionContext returning normal response", { userId });
  context.res = { status: 200, body: data };
};
