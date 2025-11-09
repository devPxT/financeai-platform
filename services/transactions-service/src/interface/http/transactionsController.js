// Controller: traduz HTTP -> use cases
export function buildTransactionsController(useCases) {
  return {
    list: async (req, res) => {
      try {
        const { userId, from, to, limit } = req.query;
        const result = await useCases.list({ userId, from, to, limit });
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    create: async (req, res) => {
      try {
        const payload = req.body;
        if (!payload.userId || !payload.name || !payload.type || !payload.amount || !payload.category || !payload.paymentMethod) {
          return res.status(400).json({ error: "missing_fields" });
        }
        const created = await useCases.create(payload);
        res.status(201).json(created);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    update: async (req, res) => {
      try {
        const id = req.params.id;
        const updated = await useCases.update(id, req.body);
        if (!updated) return res.status(404).json({ error: "not_found" });
        res.json(updated);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    remove: async (req, res) => {
      try {
        const id = req.params.id;
        await useCases.remove(id);
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    seed: async (_req, res) => {
      try {
        const created = await useCases.seed();
        res.json({ ok: true, created });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  };
}