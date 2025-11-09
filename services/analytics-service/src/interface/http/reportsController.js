// Controller – adiciona handler de quota
export function buildReportsController(useCases) {
  return {
    create: async (req, res) => {
      try {
        const userId = String(req.body?.userId || "").trim();
        const msg = String(req.body?.msg || "").trim();
        if (!userId || !msg) return res.status(400).json({ error: "missing_userId_or_msg" });
        const created = await useCases.create({ userId, msg });
        res.status(201).json(created);
      } catch (err) {
        res.status(500).json({ error: "create_failed", details: err.message });
      }
    },

    list: async (req, res) => {
      try {
        const userId = String(req.query?.userId || "").trim();
        if (!userId) return res.status(400).json({ error: "missing_userId" });
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
        const data = await useCases.list({ userId, page, limit });
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "list_failed", details: err.message });
      }
    },

    // NOVO: GET /reports/quota
    quota: async (req, res) => {
      try {
        const userId = String(req.query?.userId || "").trim();
        if (!userId) return res.status(400).json({ error: "missing_userId" });
        const data = await useCases.quota({ userId });
        res.json(data);
      } catch (err) {
        if (err.code === "missing_userId") return res.status(400).json({ error: err.code });
        res.status(500).json({ error: "quota_failed", details: err.message });
      }
    }
  };
}