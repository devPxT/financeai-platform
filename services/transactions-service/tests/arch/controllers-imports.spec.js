import fs from "fs";
import path from "path";

describe("Architecture: controllers must not import models directly", () => {
  test("transactions.controller.js should not import Transaction model", () => {
    const p = path.join(process.cwd(), "services/transactions-service/controllers/transactions.controller.js");
    const content = fs.readFileSync(p, "utf8");
    expect(content.includes("../models/Transaction.js")).toBe(false);
  });
});

