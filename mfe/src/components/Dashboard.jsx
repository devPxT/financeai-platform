// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useBff } from "../utils/api";

export default function Dashboard() {
  const api = useBff();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const r = await api.get("/bff/aggregate");
      setData(r);
    } catch (err) {
      console.error("dashboard error", err);
      setData({ error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Resumo</h3>
        <button className="button" onClick={refresh} disabled={loading}>
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>

      {data?.fromCache && <div className="small">Dados vindos do cache</div>}
      {data?.error && <div className="small">Erro: {String(data.error)}</div>}
      {!data && !loading && <div className="small">Sem dados</div>}

      {data && !data.error && (
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Saldo:</strong> R$ {Number(data.balance || 0).toFixed(2)}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Últimas transações:</strong>
            <ul>
              {(data.recent || []).map((t) => (
                <li key={t._id || t.id || Math.random()}>
                  {t.date ? new Date(t.date).toLocaleDateString() : "—"} — {t.category} — {t.type} — R${" "}
                  {Number(t.amount || 0).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Insights da Function:</strong>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.functionData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
