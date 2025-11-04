export function makeTransaction(input = {}) {
  const errors = [];
  const allowedTypes = ["income", "expense"];

  const userId = input.userId;
  const type = input.type;
  const amount = Number(input.amount);
  const category = input.category;
  const currency = input.currency || "BRL";
  const date = input.date ? new Date(input.date) : new Date();
  const note = input.note || undefined;

  if (!userId) errors.push("userId is required");
  if (!type || !allowedTypes.includes(type)) errors.push("type must be 'income' or 'expense'");
  if (!category) errors.push("category is required");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("amount must be a positive number");
  if (isNaN(date.getTime())) errors.push("date is invalid");

  if (errors.length) {
    const err = new Error(errors.join(", "));
    err.code = "validation_error";
    throw err;
  }

  return Object.freeze({ userId, type, amount, category, currency, date, note });
}

