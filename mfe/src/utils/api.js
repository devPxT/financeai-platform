// src/utils/api.js
import { useAuth } from "@clerk/clerk-react";

const BFF = import.meta.env.VITE_BFF_URL || "http://localhost:4000";
const DEMO_TOKEN = import.meta.env.VITE_DEMO_USER_TOKEN || "demo";

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
      //JUST FOR DEV
      // const isDev = import.meta.env.MODE === "development";
      // if (isDev && DEMO_TOKEN) {
      //   return DEMO_TOKEN;
      // }
      //JUST FOR DEV

      if (typeof getToken === "function") {
        const t = await getToken();
        if (t) return t;
      }
      return DEMO_TOKEN;
    } catch {
      return DEMO_TOKEN;
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


// Hook useBff - usa token Clerk (não usa demo)
// import { useAuth } from "@clerk/clerk-react";

// const BFF = import.meta.env.VITE_BFF_URL || "http://localhost:4000";

// export function useBff() {
//   const { getToken } = useAuth();

//   async function getAuthToken() {
//     if (typeof getToken === "function") {
//       const t = await getToken();
//       if (t) return t;
//     }
//     throw new Error("Sem token de autenticação. Faça login para continuar.");
//   }

//   async function request(path, opts = {}) {
//     const token = await getAuthToken();
//     const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
//     headers["Authorization"] = `Bearer ${token}`;

//     const res = await fetch(`${BFF}${path}`, { ...opts, headers, credentials: "omit" });
//     if (!res.ok) {
//       let body = "";
//       try { body = await res.text(); } catch {}
//       const err = new Error(`BFF ${res.status} ${res.statusText} - ${body}`);
//       err.status = res.status;
//       throw err;
//     }
//     const ct = res.headers.get("content-type") || "";
//     return ct.includes("application/json") ? res.json() : res.text();
//   }

//   return {
//     get: (p, opts = {}) => request(p, { method: "GET", ...opts }),
//     post: (p, body = {}, opts = {}) => request(p, { method: "POST", body: JSON.stringify(body), ...opts }),
//     put: (p, body = {}, opts = {}) => request(p, { method: "PUT", body: JSON.stringify(body), ...opts }),
//     del: (p, opts = {}) => request(p, { method: "DELETE", ...opts })
//   };
// }