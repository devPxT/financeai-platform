// src/utils/api.js
import { useAuth } from "@clerk/clerk-react";

const BFF = import.meta.env.VITE_BFF_URL || "http://localhost:4000";
const DEMO_TOKEN = import.meta.env.VITE_DEMO_USER_TOKEN || "demo";
const USE_DEMO = import.meta.env.VITE_USE_DEMO_AUTH === "true";

/**
 * useBff - Hook that returns helpers to call the BFF with the Clerk token.
 * Usage:
 *  const api = useBff();
 *  const data = await api.get("/bff/aggregate");
 */
export function useBff() {
  const { getToken } = useAuth();

  async function getAuthToken() {
    try {
      // If VITE_USE_DEMO_AUTH=true, allow demo token fallback for local dev
      if (USE_DEMO && DEMO_TOKEN) {
        return DEMO_TOKEN;
      }

      // Attempt to get Clerk token
      if (typeof getToken === "function") {
        const t = await getToken();
        if (t) return t;
      }

      // No token available - throw error to prompt login
      throw new Error("No authentication token available. Please log in to continue.");
    } catch (err) {
      // In demo mode, fallback to demo token
      if (USE_DEMO && DEMO_TOKEN) {
        return DEMO_TOKEN;
      }
      throw err;
    }
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