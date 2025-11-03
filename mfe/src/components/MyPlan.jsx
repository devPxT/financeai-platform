// src/components/MyPlan.jsx
import React, { useState } from "react";
import { useBff } from "../utils/api";

export default function MyPlan() {
  const api = useBff();
  const [loading, setLoading] = useState(false);

  async function gotoCheckout() {
    setLoading(true);
    try {
      const res = await api.post("/bff/create-checkout-session", {  });
      if (!res.url) throw new Error("Checkout session failed");
      window.location.href = res.url;
    } catch (err) {
      alert("Erro ao iniciar checkout: " + (err.message || String(err)));
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Meu Plano</h3>
      <p className="small">Assine FinanceAI Pro via Stripe Checkout</p>
      <button className="button" onClick={gotoCheckout} disabled={loading}>
        {loading ? "Abrindo..." : "Assinar Pro (R$19,90)"}
      </button>
    </div>
  );
}
