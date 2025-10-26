import React, { useState } from "react";
import { bffFetch } from "../utils/api";

export default function ReportPanel() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  async function generate() {
    setLoading(true);
    setReport(null);
    try {
      const r = await bffFetch("/bff/report", { method: "POST", body: JSON.stringify({}) });
      setReport(r.report || JSON.stringify(r, null, 2));
    } catch (err) {
      setReport("Erro: " + err.message);
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
