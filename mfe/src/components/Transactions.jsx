import React, { useEffect, useState } from "react";
import { bffFetch } from "../utils/api";

export default function Transactions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "", amount: "" });

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const r = await bffFetch("/bff/transactions");
      setList(r || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function create(mode = "sync") {
    const payload = { ...form, amount: Number(form.amount) || 0 };
    try {
      await bffFetch(`/bff/transactions?mode=${mode}`, { method: "POST", body: JSON.stringify(payload) });
      setForm({ type: "expense", category: "", amount: "" });
      fetchList();
    } catch (err) {
      alert("Erro ao criar: " + err.message);
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
                {new Date(t.date).toLocaleDateString()} — {t.category} — {t.type} — R$ {Number(t.amount).toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
