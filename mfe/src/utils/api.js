// import { getAuth } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
const BFF = import.meta.env.VITE_BFF_URL || "http://localhost:4000";
const DEMO_TOKEN = import.meta.env.VITE_DEMO_USER_TOKEN || "demo";

async function getTokenOrDemo() {
  try {
    const auth = await useAuth();
    if (auth && typeof auth.getToken === "function") {
      const token = await auth.getToken();
      if (token) return token;
    }
    return DEMO_TOKEN;
  } catch {
    return DEMO_TOKEN;
  }
}

export async function bffFetch(path, opts = {}) {
  const token = await getTokenOrDemo();
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BFF}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BFF ${res.status} - ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}
