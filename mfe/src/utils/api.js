// // src/utils/api.js
import { useAuth } from "@clerk/clerk-react";

const BFF = import.meta.env.VITE_BFF_URL || "http://localhost:4000";
const DEMO_TOKEN = import.meta.env.VITE_DEMO_USER_TOKEN || "demo";
const USE_DEMO = (import.meta.env.VITE_USE_DEMO_AUTH || "false") === "true";

/**
 * useBff - Hook para chamar o BFF com token do Clerk.
 * - Por padrão exige token real (Clerk). Se VITE_USE_DEMO_AUTH=true, usa DEMO_TOKEN (apenas dev).
 */
export function useBff() {
  const { getToken } = useAuth();

  async function getAuthToken() {
    // Opt-in explícito para DEMO em dev
    if (USE_DEMO && DEMO_TOKEN) {
      return DEMO_TOKEN;
    }
    // Fluxo padrão: requer Clerk
    if (typeof getToken === "function") {
      const t = await getToken().catch(() => null);
      if (t) return t;
    }
    // Sem token -> falha clara (evita mandar DEMO por engano quando MOCK_AUTH=false)
    throw new Error("Sem token de autenticação. Faça login para continuar.");
  }

  async function request(path, opts = {}) {
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BFF}${path}`, { ...opts, headers, credentials: "omit" });
    if (!res.ok) {
      let body = "";
      try { body = await res.text(); } catch {}
      const err = new Error(`BFF ${res.status} ${res.statusText} - ${body}`);
      err.status = res.status;
      throw err;
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  return {
    get: (p, opts = {}) => request(p, { method: "GET", ...opts }),
    post: (p, body = {}, opts = {}) => request(p, { method: "POST", body: JSON.stringify(body), ...opts }),
    put: (p, body = {}, opts = {}) => request(p, { method: "PUT", body: JSON.stringify(body), ...opts }),
    del: (p, opts = {}) => request(p, { method: "DELETE", ...opts })
  };
}