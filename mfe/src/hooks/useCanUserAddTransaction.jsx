import { useEffect, useMemo, useState } from "react";
import { useBff } from "@/utils/api";

// Conta transações do mês corrente usando createdAt (UTC-safe)
function getMonthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

export function useCanUserAddTransaction() {
  const api = useBff();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [currentMonthCount, setCurrentMonthCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        // 1) Plano do usuário (whoami)
        const who = await api.get("/bff/whoami");
        // Em MOCK_AUTH vem plan: "free"; com Clerk real, pode não vir -> tratar como não premium
        const plan =
          who?.user?.plan ||
          who?.user?.publicMetadata?.subscriptionPlan ||
          who?.user?.subscriptionPlan ||
          "free";
        const premium = String(plan).toLowerCase() === "premium";
        if (mounted) setIsPremium(premium);

        // 2) Transações do usuário
        const txs = await api.get("/bff/transactions");
        const { start, end } = getMonthRange(new Date());
        const count = (Array.isArray(txs) ? txs : []).filter((t) => {
          const d = t?.createdAt ? new Date(t.createdAt) : null;
          return d && d >= start && d < end;
        }).length;
        if (mounted) setCurrentMonthCount(count);
      } catch (err) {
        if (mounted) setError(err?.message || "Falha ao carregar permissões.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []); // uma vez ao montar

  // Regra: premium = sempre pode; free = bloqueia se >=10 no mês
  const userCanAdd = useMemo(() => {
    if (isPremium) return true;
    return currentMonthCount < 10;
  }, [isPremium, currentMonthCount]);

  return { loading, error, isPremium, currentMonthCount, userCanAdd };
}