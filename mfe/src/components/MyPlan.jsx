import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { bffFetch } from "../utils/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function MyPlan() {
  const [loading, setLoading] = useState(false);

  async function gotoCheckout() {
    setLoading(true);
    try {
      // priceId must exist in your Stripe account
      const priceId = "price_YOUR_PRICE_ID"; // <-- substitua pelo seu Price ID
      const res = await bffFetch("/bff/create-checkout-session", { method: "POST", body: JSON.stringify({ priceId }) });
      if (!res.url) throw new Error("Checkout session failed");
      // Redirecionar para Stripe Checkout (server returns URL)
      window.location.href = res.url;
    } catch (err) {
      alert("Erro ao iniciar checkout: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Meu Plano</h3>
      <p className="small">Assine FinanceAI Pro via Stripe Checkout</p>
      <button className="button" onClick={gotoCheckout} disabled={loading}>{loading ? "Abrindo..." : "Assinar Pro (R$19,90)"}</button>
    </div>
  );
}
