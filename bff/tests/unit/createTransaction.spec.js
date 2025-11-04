import buildCreateTransaction from "../../src/usecases/createTransaction.js";

function makeHttp(ok = true, payload = {}, status = 201) {
  return async function httpRequestWithRetry(cfg) {
    if (!ok) throw new Error("network_error");
    return { status, data: payload, config: cfg };
  };
}

describe("BFF createTransaction usecase", () => {
  test("sync path returns 201 with created body", async () => {
    const http = makeHttp(true, { id: "t1" }, 201);
    const uc = buildCreateTransaction({ httpRequestWithRetry: http, urls: { transactionsService: "http://svc", functionTrigger: "http://func" }, logger: console });
    const r = await uc({ mode: "sync", payload: { userId: "u1", type: "income", amount: 10, category: "Salary" } });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ id: "t1" });
  });

  test("async path falls back to service on function error", async () => {
    let calls = [];
    const http = async (cfg) => {
      calls.push(cfg.url);
      if (cfg.url.includes("/createTransaction")) throw new Error("function_down");
      return { status: 201, data: { id: "t2" } };
    };
    const uc = buildCreateTransaction({ httpRequestWithRetry: http, urls: { transactionsService: "http://svc", functionTrigger: "http://func" }, logger: console });
    const r = await uc({ mode: "async", payload: { userId: "u1", type: "income", amount: 10, category: "Salary" } });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ fallback: true, created: { id: "t2" } });
    expect(calls[0]).toContain("http://func/createTransaction");
    expect(calls[1]).toContain("http://svc/transactions");
  });
});

