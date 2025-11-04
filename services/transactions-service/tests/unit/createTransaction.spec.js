import buildCreateTransaction from "../../src/application/usecases/createTransaction.js";

function makeFakeRepo() {
  return {
    created: [],
    async create(doc) { this.created.push(doc); return { id: "x1", ...doc }; }
  };
}

describe("CreateTransaction usecase", () => {
  test("validates required fields", async () => {
    const repo = makeFakeRepo();
    const createTx = buildCreateTransaction({ repo });
    await expect(createTx({})).rejects.toHaveProperty("code", "validation_error");
  });

  test("creates a valid transaction", async () => {
    const repo = makeFakeRepo();
    const createTx = buildCreateTransaction({ repo });
    const input = { userId: "u1", type: "income", amount: 100, category: "Salary" };
    const r = await createTx(input);
    expect(r).toHaveProperty("id");
    expect(repo.created.length).toBe(1);
    expect(repo.created[0]).toMatchObject({ userId: "u1", type: "income", amount: 100, category: "Salary" });
  });
});

