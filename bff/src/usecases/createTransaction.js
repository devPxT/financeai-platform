export default function buildCreateTransaction({ httpRequestWithRetry, urls, logger }) {
  const { transactionsService, functionTrigger } = urls;
  return async function createTransaction({ mode = "sync", payload }) {
    const m = (mode || "sync").toLowerCase();
    if (m === "async") {
      const funcUrl = `${functionTrigger}/createTransaction`;
      try {
        const r = await httpRequestWithRetry({ method: "post", url: funcUrl, data: payload, headers: { "x-origin-bff": "financeai-bff" } });
        return { status: r.status === 202 ? 202 : 201, body: { fromFunction: true, data: r.data } };
      } catch (err) {
        logger?.warn?.("function_create_failed", { err: err.message });
        // fallback to sync create
        const svcUrl = `${transactionsService}/transactions`;
        const created = await httpRequestWithRetry({ method: "post", url: svcUrl, data: payload }).then(r => r.data);
        return { status: 201, body: { fallback: true, created } };
      }
    }
    // sync path
    const svcUrl = `${transactionsService}/transactions`;
    const created = await httpRequestWithRetry({ method: "post", url: svcUrl, data: payload }).then(r => r.data);
    return { status: 201, body: created };
  };
}

