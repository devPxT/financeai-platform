import fs from "fs";
import path from "path";

describe("Architecture: BFF should wire createTransaction usecase", () => {
  test("bff.js imports createTransaction usecase", () => {
    const p = path.join(process.cwd(), "bff/bff.js");
    const content = fs.readFileSync(p, "utf8");
    expect(content.includes("./src/usecases/createTransaction.js")).toBe(true);
  });
});

