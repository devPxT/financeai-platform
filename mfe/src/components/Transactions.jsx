// src/components/Transactions.jsx (página de teste)
import React, { useEffect, useState } from "react";
import { useBff } from "../utils/api";

const TIPOS = ["Despesa", "Depósito", "Investimento"];
const CATEGORIAS = [
  "Educação",
  "Entretenimento",
  "Alimentação",
  "Saúde",
  "Moradia",
  "Outros",
  "Salário",
  "Transporte",
  "Utilidades",
];
const METODOS_PAGAMENTO = [
  "Transferência Bancária",
  "Boleto Bancário",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Outros",
  "Pix",
];

export default function Transactions() {
  const api = useBff();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "Despesa",
    paymentMethod: "Pix",
    category: "Outros",
    // date opcional (não exigido neste teste). Se quiser ativar:
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const r = await api.get("/bff/transactions");
      setList(Array.isArray(r) ? r : r.transactions || []);
    } catch (err) {
      console.error("fetchList error", err);
      setList([]);
      alert("Erro ao buscar transações: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function create(mode = "sync") {
    const payload = {
      name: (form.name || "").trim(),
      amount: Number(form.amount) || 0,
      type: form.type,
      category: form.category,
      paymentMethod: form.paymentMethod,
      date: form.date,
      // date: form.date ? new Date(form.date + "T00:00:00.000Z").toISOString() : undefined,
    };

    if (!payload.name) {
      alert("Preencha o nome.");
      return;
    }
    if (!payload.amount) {
      alert("Preencha um valor maior que zero.");
      return;
    }

    try {
      await api.post(`/bff/transactions?mode=${mode}`, payload);
      setForm({
        name: "",
        amount: "",
        type: "Despesa",
        paymentMethod: "Pix",
        category: "Outros",
        date: new Date().toISOString().slice(0, 10),
      });
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
        `${tx.name || "—"} — ${tx.category || "—"} — ${tx.type || "—"} — R$ ${Number(tx.amount || 0).toFixed(2)}`
    );
    if (!ok) return;

    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      await api.del(`/bff/transactions/${encodeURIComponent(id)}`);
      setList((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      console.error("Erro ao deletar:", err);
      alert("Erro ao deletar: " + (err?.message || String(err)));
    } finally {
      setDeletingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  }

  return (
    <div className="card">
      <h3>Transações (teste)</h3>

      <div style={{ display: "grid", gap: 8, alignItems: "end", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", maxWidth: 900 }}>
        <label className="grid gap-1">
          <span className="small">Nome</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Almoço no trabalho"
          />
        </label>

        <label className="grid gap-1">
          <span className="small">Valor</span>
          <input
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value.replace(",", ".") })}
            type="number"
            step="0.01"
            placeholder="0,00"
          />
        </label>

        <label className="grid gap-1">
          <span className="small">Tipo</span>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="small">Método</span>
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            {METODOS_PAGAMENTO.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="small">Categoria</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {/* Caso queira expor a data do formulário depois: */}
        <label className="grid gap-1">
          <span className="small">Data</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
       
      </div>

      <div style={{ marginTop: 8 }}>
        <button className="button" onClick={() => create("sync")}>Criar (sync)</button>
        <button className="button" style={{ marginLeft: 8 }} onClick={() => create("async")}>
          Criar (async via Function)
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Lista</h4>

        {loading ? (
          <div className="small">Carregando...</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {list.length === 0 && <div className="small">Sem transações</div>}

            {list.map((t) => {
              const id = t._id || t.id || Math.random();
              const isDeleting = deletingIds.has(id);

              const created = t.createdAt ? new Date(t.createdAt) : null;
              const updated = t.updatedAt ? new Date(t.updatedAt) : null;

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
                      {t.name || "—"}
                    </div>
                    <div style={{ fontSize: 14 }}>
                      {t.category || "—"} — {t.type || "—"} — {t.paymentMethod || "—"} — R$ {Number(t.amount || 0).toFixed(2)}
                    </div>
                    <div className="small" style={{ color: "#888" }}>
                      {t.date ? `Data: ${new Date(t.date).toLocaleDateString()}` : null}
                      {created ? ` • Criado: ${created.toLocaleString()}` : ""}
                      {updated ? ` • Atualizado: ${updated.toLocaleString()}` : ""}
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