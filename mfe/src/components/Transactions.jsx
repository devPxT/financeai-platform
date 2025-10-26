// src/components/Transactions.jsx
import React, { useEffect, useState } from "react";
import { useBff } from "../utils/api";

export default function Transactions() {
  const api = useBff();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "", amount: "" });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const r = await api.get("/bff/transactions");
      setList(r || []);
    } catch (err) {
      console.error("fetchList error", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function create(mode = "sync") {
    const payload = { ...form, amount: Number(form.amount) || 0 };
    try {
      await api.post(`/bff/transactions?mode=${mode}`, payload);
      setForm({ type: "expense", category: "", amount: "" });
      fetchList();
    } catch (err) {
      alert("Erro ao criar: " + (err.message || String(err)));
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
        {loading ? <div className="small">Carregando...</div> : (
          <ul>
            {list.map((t) => (
              <li key={t._id || t.id || Math.random()}>
                {t.date ? new Date(t.date).toLocaleDateString() : "—"} — {t.category} — {t.type} — R$ {Number(t.amount || 0).toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
