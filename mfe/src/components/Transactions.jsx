// src/components/Transactions.jsx
import React, { useEffect, useState } from "react";
import { useBff } from "../utils/api";

export default function Transactions() {
  const api = useBff();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "", amount: "" });
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const r = await api.get("/bff/transactions");
      setList(Array.isArray(r) ? r : (r.transactions || []));
    } catch (err) {
      console.error("fetchList error", err);
      setList([]);
      alert("Erro ao buscar transações: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function create(mode = "sync") {
    const payload = { ...form, amount: Number(form.amount) || 0 };
    if (!payload.category || !payload.amount) {
      alert("Preencha categoria e valor.");
      return;
    }

    try {
      await api.post(`/bff/transactions?mode=${mode}`, payload);
      setForm({ type: "expense", category: "", amount: "" });
      fetchList();
    } catch (err) {
      console.error("Erro ao criar:", err);
      alert("Erro ao criar: " + (err?.message || String(err)));
    }
  }

  async function confirmAndDelete(tx) {
    const id = tx._id || tx.id;
    if (!id) {
      alert("Transação sem ID — não foi possível deletar.");
      return;
    }

    const ok = window.confirm(
      `Deseja realmente deletar esta transação?\n\n` +
        `${tx.date ? new Date(tx.date).toLocaleDateString() : "—"} — ${tx.category || "—"} — R$ ${Number(tx.amount || 0).toFixed(2)}`
    );
    if (!ok) return;

    // marcar como deletando
    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      // tenta deletar via API (BFF endpoint)
      await api.del(`/bff/transactions/${encodeURIComponent(id)}`);
      // remover do estado local (otimista)
      setList((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      console.error("Erro ao deletar:", err);
      alert("Erro ao deletar: " + (err?.message || String(err)));
    } finally {
      // desmarcar deletando
      setDeletingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  }

  return (
    <div className="card">
      <h3>Transações</h3>

      <div>
        <label>
          Tipo
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </label>

        <label style={{ marginLeft: 10 }}>
          Categoria
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </label>

        <label style={{ marginLeft: 10 }}>
          Valor
          <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </label>

        <div style={{ marginTop: 8 }}>
          <button className="button" onClick={() => create("sync")}>Criar (sync)</button>
          <button className="button" style={{ marginLeft: 8 }} onClick={() => create("async")}>Criar (async via Function)</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Lista</h4>

        {loading ? (
          <div className="small">Carregando...</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {list.length === 0 && <div className="small">Sem transações</div>}

            {list.map((t) => {
              const id = t._id || t.id || Math.random();
              const isDeleting = deletingIds.has(id);

              return (
                <li
                  key={id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                    </div>
                    <div style={{ fontSize: 14 }}>
                      {t.category || "—"} — {t.type || "—"} — R$ {Number(t.amount || 0).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="button small"
                      onClick={() => confirmAndDelete(t)}
                      disabled={isDeleting}
                      title="Deletar transação"
                      style={{
                        background: isDeleting ? "#999" : "#e55353",
                        color: "#fff",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: 6,
                        cursor: isDeleting ? "default" : "pointer"
                      }}
                    >
                      {isDeleting ? "Deletando..." : "Deletar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
