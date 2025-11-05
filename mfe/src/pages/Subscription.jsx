import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { CheckIcon, XIcon } from "lucide-react";

import { useBff } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Helpers para o período do mês atual [início do mês, início do próximo mês)
function getMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

// Banner de mensagens (sucesso/info) sem usar alert
function AlertBar({ variant = "info", children }) {
  const styles =
    variant === "success"
      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
      : "bg-sky-50 border border-sky-200 text-sky-700";
  return <div className={`rounded-md px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

export default function Subscription() {
  const api = useBff();
  const { user, isLoaded } = useUser();
  const location = useLocation();

  const [currentMonthCount, setCurrentMonthCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const params = new URLSearchParams(location.search);
  const success = params.get("success") === "true";
  const canceled = params.get("canceled") === "true";

  const hasPremiumPlan = useMemo(() => {
    return Boolean(user?.publicMetadata?.subscriptionPlan === "premium");
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchCurrentMonthCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  async function fetchCurrentMonthCount() {
    try {
      setLoadingCount(true);
      // Busca transações do usuário autenticado via BFF (BFF injeta userId)
      const txs = await api.get("/bff/transactions");
      const { start, end } = getMonthRange(new Date());
      const count = (Array.isArray(txs) ? txs : []).filter((t) => {
        const ts = t?.createdAt || t?.date;
        const d = ts ? new Date(ts) : null;
        return d && d >= start && d < end;
      }).length;
      setCurrentMonthCount(count);
    } catch (err) {
      console.error("Erro ao contar transações do mês:", err);
      setCurrentMonthCount(0);
    } finally {
      setLoadingCount(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Assinatura</h1>

      {/* Mensagens de feedback por querystring */}
      <div className="space-y-3">
        {success && <AlertBar variant="success">Pagamento realizado com sucesso. Seu plano foi atualizado.</AlertBar>}
        {canceled && <AlertBar>Pagamento cancelado. Você pode tentar novamente quando quiser.</AlertBar>}
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Plano Básico */}
        <Card className="w-full md:w-[450px]">
          <CardHeader className="relative border-b border-solid py-8">
            {/* Badge "Atual" quando NÃO é premium */}
            {!hasPremiumPlan && (
              <Badge className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                Atual
              </Badge>
            )}
            <h2 className="text-center text-2xl font-semibold">Plano Básico</h2>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-4xl">R$</span>
              <span className="text-6xl font-semibold">0</span>
              <div className="text-2xl text-muted-foreground">/mês</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <div className="flex items-center gap-2">
              <CheckIcon className="text-primary" />
              <p>
                Apenas 10 transações por mês{" "}
                <span className="text-muted-foreground">({loadingCount ? "..." : currentMonthCount}/10)</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <XIcon />
              <p>Relatórios de IA</p>
            </div>
          </CardContent>
        </Card>

        {/* Plano Premium */}
        <Card className="w-full md:w-[450px]">
          <CardHeader className="relative border-b border-solid py-8">
            {/* Badge "Atual" quando É premium */}
            {hasPremiumPlan && (
              <Badge className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                Atual
              </Badge>
            )}
            <h2 className="text-center text-2xl font-semibold">Plano Premium</h2>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-4xl">R$</span>
              <span className="text-6xl font-semibold">19</span>
              <div className="text-2xl text-muted-foreground">/mês</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <div className="flex items-center gap-2">
              <CheckIcon className="text-primary" />
              <p>Transações ilimitadas</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="text-primary" />
              <p>Relatórios de IA</p>
            </div>

            <AcquirePlanButton hasPremiumPlan={hasPremiumPlan} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AcquirePlanButton({ hasPremiumPlan }) {
  const api = useBff();
  const [loading, setLoading] = useState(false);

  async function handleAcquirePlanClick() {
    try {
      setLoading(true);
      const origin = window.location.origin;
      const successUrl = `${origin}/subscription?success=true`;
      const cancelUrl = `${origin}/subscription?canceled=true`;

      // Chama o BFF que cria a sessão
      const r = await api.post("/bff/create-checkout-session", { successUrl, cancelUrl });

      if (r?.url) {
        window.location.href = r.url;
        return;
      }

      throw new Error("Não foi possível iniciar o checkout (sem url).");
    } catch (err) {
      console.error(err);
      // Exiba o erro na UI como preferir; aqui mantemos silencioso para o usuário
    } finally {
      setLoading(false);
    }
  }

  function handleManagePlanClick() {
    const portal = import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL;
    if (!portal) {
      // Sem portal configurado no seu fluxo de teste
      return;
    }
    window.open(portal, "_blank", "noopener,noreferrer");
  }

  if (hasPremiumPlan) {
    return (
      <Button className="w-full rounded-full font-bold" variant="outline" onClick={handleManagePlanClick} disabled={loading}>
        Gerenciar plano
      </Button>
    );
  }

  return (
    <Button className="w-full rounded-full font-bold" onClick={handleAcquirePlanClick} disabled={loading}>
      {loading ? "Redirecionando..." : "Adquirir plano"}
    </Button>
  );
}