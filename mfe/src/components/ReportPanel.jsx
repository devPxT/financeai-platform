// src/components/ReportPanel.jsx
import React, { useState } from "react";
import { useBff } from "../utils/api";

export default function ReportPanel() {
  const api = useBff();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  async function generate() {
    setLoading(true);
    setReport(null);
    try {
      const r = await api.post("/bff/report", {}); // body optional
      setReport(r.report || JSON.stringify(r, null, 2));
    } catch (err) {
      setReport("Erro: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Relatório (IA)</h3>
      <p className="small">Gera um relatório com o ChatGPT usando os dados agregados do BFF.</p>
      <button className="button" onClick={generate} disabled={loading}>{loading ? "Gerando..." : "Gerar Relatório"}</button>
      {report && <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{report}</pre>}
    </div>
  );
}
