// import React, { useEffect, useMemo, useState } from "react";
// import AiReportModal from "../components/AiReportModal";
// import { useBff } from "../utils/api";

// // Meses em pt-BR
// const MONTHS = [
//   { label: "Janeiro", value: "01" },
//   { label: "Fevereiro", value: "02" },
//   { label: "Março", value: "03" },
//   { label: "Abril", value: "04" },
//   { label: "Maio", value: "05" },
//   { label: "Junho", value: "06" },
//   { label: "Julho", value: "07" },
//   { label: "Agosto", value: "08" },
//   { label: "Setembro", value: "09" },
//   { label: "Outubro", value: "10" },
//   { label: "Novembro", value: "11" },
//   { label: "Dezembro", value: "12" }
// ];

// function getInitialPeriodFromQS() {
//   const params = new URLSearchParams(window.location.search);
//   const now = new Date();
//   const mm = params.get("month");
//   const yy = params.get("year");
//   const curMonth = String(now.getMonth() + 1).padStart(2, "0");
//   const curYear = String(now.getFullYear());
//   return {
//     month: mm && /^\d{2}$/.test(mm) ? mm : curMonth,
//     year: yy && /^\d{4}$/.test(yy) ? yy : curYear
//   };
// }

// function pushPeriodToURL(month, year) {
//   const url = new URL(window.location.href);
//   url.searchParams.set("month", month);
//   url.searchParams.set("year", year);
//   // Atualiza a URL sem recarregar a página
//   window.history.pushState({}, "", url.toString());
// }

// export default function Dashboard() {
//   const api = useBff();
//   const [{ month, year }, setPeriod] = useState(getInitialPeriodFromQS());

//   // Anos: atual e mais 5 para trás
//   const years = useMemo(() => {
//     const y = new Date().getFullYear();
//     return Array.from({ length: 6 }).map((_, i) => String(y - i));
//   }, []);

//   // Sempre que o período mudar, atualiza a URL e (depois) busca os dados do período
//   useEffect(() => {
//     pushPeriodToURL(month, year);
//     // TODO: Buscar transações do período selecionado (quando você quiser ligar isso)
//     // Exemplo futuro:
//     // api.get(`/bff/transactions?month=${month}&year=${year}`)
//     //   .then(setTransactions)
//     //   .catch(() => setTransactions([]));
//     // Por enquanto apenas log:
//     // console.log("Período selecionado:", { month, year });
//   }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

//   function handleMonthChange(e) {
//     const newMonth = e.target.value;
//     setPeriod((prev) => ({ ...prev, month: newMonth }));
//   }

//   function handleYearChange(e) {
//     const newYear = e.target.value;
//     setPeriod((prev) => ({ ...prev, year: newYear }));
//   }

//   return (
//     <div className="dashboard-page" style={{ padding: 16 }}>
//       <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//         <h1 className="text-2xl font-bold">Dashboard</h1>

//         <div className="actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           {/* Modal da IA */}
//           <AiReportModal />

//           {/* Select do mês */}
//           <select aria-label="Selecionar mês" value={month} onChange={handleMonthChange}>
//             {MONTHS.map((m) => (
//               <option key={m.value} value={m.value}>{m.label}</option>
//             ))}
//           </select>

//           {/* Select do ano */}
//           <select aria-label="Selecionar ano" value={year} onChange={handleYearChange}>
//             {years.map((y) => (
//               <option key={y} value={y}>{y}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Aqui ficarão seus componentes do Dashboard.
//           Por enquanto, só demostrando o período atual selecionado. */}
//       <div style={{ marginTop: 8 }}>
//         <strong>Período atual:</strong> {MONTHS.find((m) => m.value === month)?.label} / {year}
//       </div>

//       {/* TODO: Renderizar seus cards, gráficos e listas com base nas transações do período selecionado */}
//       {/* <SummaryCards ... /> */}
//       {/* <TransactionsPieChart ... /> */}
//       {/* <ExpensesPerCategory ... /> */}
//       {/* <LastTransactions ... /> */}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import AiReportButton from "../components/AiReportButton";
import { useBff } from "../utils/api";

// shadcn ui
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Button } from "../components/ui/button"; // caso precise no futuro

const MONTHS = [
  { label: "Janeiro", value: "01" },
  { label: "Fevereiro", value: "02" },
  { label: "Março", value: "03" },
  { label: "Abril", value: "04" },
  { label: "Maio", value: "05" },
  { label: "Junho", value: "06" },
  { label: "Julho", value: "07" },
  { label: "Agosto", value: "08" },
  { label: "Setembro", value: "09" },
  { label: "Outubro", value: "10" },
  { label: "Novembro", value: "11" },
  { label: "Dezembro", value: "12" }
];

function getInitialPeriodFromQS() {
  const params = new URLSearchParams(window.location.search);
  const now = new Date();
  const mm = params.get("month");
  const yy = params.get("year");
  const curMonth = String(now.getMonth() + 1).padStart(2, "0");
  const curYear = String(now.getFullYear());
  return {
    month: mm && /^\d{2}$/.test(mm) ? mm : curMonth,
    year: yy && /^\d{4}$/.test(yy) ? yy : curYear
  };
}

function pushPeriodToURL(month, year) {
  const url = new URL(window.location.href);
  url.searchParams.set("month", month);
  url.searchParams.set("year", year);
  window.history.pushState({}, "", url.toString());
}

export default function Dashboard() {
  const api = useBff();
  const [{ month, year }, setPeriod] = useState(getInitialPeriodFromQS());

  // Anos: atual + 5 anos para trás
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 6 }).map((_, i) => String(y - i));
  }, []);

  // Atualiza URL e (futuramente) busca dados do período selecionado
  useEffect(() => {
    pushPeriodToURL(month, year);
    // TODO: buscar transações do período quando você quiser plugar os componentes:
    // api.get(`/bff/transactions?month=${month}&year=${year}`)
    //   .then(...)
    //   .catch(...)
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-3">
          {/* Botão/Modal de IA (usa shadcn + verificação de plano premium via Clerk) */}
          <AiReportButton />

          {/* Select de Mês (shadcn) */}
          <Select
            value={month}
            onValueChange={(v) => setPeriod((prev) => ({ ...prev, month: v }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Select de Ano (shadcn) */}
          <Select
            value={year}
            onValueChange={(v) => setPeriod((prev) => ({ ...prev, year: v }))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Espaço futuro para seus componentes de dashboard baseados no período */}
      <div className="text-sm text-muted-foreground">
        Período atual: {MONTHS.find((m) => m.value === month)?.label} / {year}
      </div>

      {/* TODO: SummaryCards, Charts, Lists... quando você enviar os requisitos de cálculo */}
    </div>
  );
}