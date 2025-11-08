// import React, { useEffect, useMemo, useState } from "react";
// import { useBff } from "../utils/api";
// import AiReportButton from "../components/AiReportButton";

// // shadcn ui
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from "../components/ui/select";

// // Componentes do dashboard
// import SummaryCards from "../components/dashboard/SummaryCards";
// import TransactionsPieChart from "../components/dashboard/TransactionsPieChart";
// import ExpensesPerCategory from "../components/dashboard/ExpensesPerCategory";
// import LastTransactions from "../components/dashboard/LastTransactions";

// import { filterByPeriod, computeDashboard } from "../utils/dashboard-agg";

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
//   window.history.pushState({}, "", url.toString());
// }

// export default function Dashboard() {
//   const api = useBff();
//   const [{ month, year }, setPeriod] = useState(getInitialPeriodFromQS());
//   const [allTransactions, setAllTransactions] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const years = useMemo(() => {
//     const y = new Date().getFullYear();
//     return Array.from({ length: 6 }).map((_, i) => String(y - i));
//   }, []);

//   // Busca as transações do usuário (todas) e filtra por período no cliente
//   useEffect(() => {
//     let ignore = false;
//     async function load() {
//       setLoading(true);
//       try {
//         // Busca as transações do usuário logado
//         const data = await api.get("/bff/transactions");
//         if (!ignore) setAllTransactions(Array.isArray(data) ? data : []);
//       } catch {
//         if (!ignore) setAllTransactions([]);
//       } finally {
//         if (!ignore) setLoading(false);
//       }
//     }
//     load();
//     return () => { ignore = true; };
//   }, []); // carrega uma vez

//   // Atualiza URL ao trocar período
//   useEffect(() => {
//     pushPeriodToURL(month, year);
//   }, [month, year]);

//   // Filtra e calcula KPIs
//   const periodTransactions = useMemo(() => filterByPeriod(allTransactions, month, year), [allTransactions, month, year]);
//   const dashboard = useMemo(() => computeDashboard(periodTransactions), [periodTransactions]);

//   return (
//     <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
//       <div className="flex justify-between">
//         <h1 className="text-2xl font-bold">Dashboard</h1>
//         <div className="flex items-center gap-3">
//           <AiReportButton />

//           <Select value={month} onValueChange={(v) => setPeriod((prev) => ({ ...prev, month: v }))}>
//             <SelectTrigger className="w-[160px]">
//               <SelectValue placeholder="Mês" />
//             </SelectTrigger>
//             <SelectContent>
//               {MONTHS.map((m) => (
//                 <SelectItem key={m.value} value={m.value}>
//                   {m.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Select value={year} onValueChange={(v) => setPeriod((prev) => ({ ...prev, year: v }))}>
//             <SelectTrigger className="w-[120px]">
//               <SelectValue placeholder="Ano" />
//             </SelectTrigger>
//             <SelectContent>
//               {years.map((y) => (
//                 <SelectItem key={y} value={y}>
//                   {y}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className="grid h-full grid-cols-[2fr,1fr] gap-6 overflow-hidden">
//         <div className="flex flex-col gap-6 overflow-hidden">
//           <SummaryCards
//             balance={dashboard.balance}
//             depositsTotal={dashboard.depositsTotal}
//             expensesTotal={dashboard.expensesTotal}
//             investmentsTotal={dashboard.investmentsTotal}
//             userCanAddTransaction={true} // ajuste caso você tenha regra para limitar
//           />

//           <div className="grid h-full grid-cols-3 grid-rows-1 gap-6 overflow-hidden">
//             <TransactionsPieChart
//               depositsTotal={dashboard.depositsTotal}
//               investmentsTotal={dashboard.investmentsTotal}
//               expensesTotal={dashboard.expensesTotal}
//               typesPercentage={dashboard.typesPercentage}
//             />

//             <ExpensesPerCategory
//               expensesPerCategory={dashboard.totalExpensePerCategory}
//             />
//           </div>
//         </div>

//         <LastTransactions lastTransactions={dashboard.lastTransactions} />
//       </div>

//       {loading && <div className="text-sm text-muted-foreground">Carregando transações...</div>}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useBff } from "../utils/api";
import AiReportButton from "../components/AiReportButton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";

import SummaryCards from "../components/dashboard/SummaryCards";
import TransactionsPieChart from "../components/dashboard/TransactionsPieChart";
import ExpensesPerCategory from "../components/dashboard/ExpensesPerCategory";
import LastTransactions from "../components/dashboard/LastTransactions";

import { filterByPeriod, computeDashboard } from "../utils/dashboard-agg";

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
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 6 }).map((_, i) => String(y - i));
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api.get("/bff/transactions");
        if (!ignore) setAllTransactions(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setAllTransactions([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    pushPeriodToURL(month, year);
  }, [month, year]);

  const periodTransactions = useMemo(
    () => filterByPeriod(allTransactions, month, year),
    [allTransactions, month, year]
  );
  const dashboard = useMemo(
    () => computeDashboard(periodTransactions),
    [periodTransactions]
  );

  return (
    <div className="flex h-full flex-col space-y-6 overflow-hidden p-6 text-neutral-100">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <AiReportButton />

          <Select
            value={month}
            onValueChange={(v) => setPeriod((prev) => ({ ...prev, month: v }))}
          >
            <SelectTrigger className="w-[160px] bg-neutral-900 text-neutral-100 border-neutral-800">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 text-neutral-100 border border-neutral-800">
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="focus:bg-neutral-800">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year}
            onValueChange={(v) => setPeriod((prev) => ({ ...prev, year: v }))}
          >
            <SelectTrigger className="w-[120px] bg-neutral-900 text-neutral-100 border-neutral-800">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 text-neutral-100 border border-neutral-800">
              {years.map((y) => (
                <SelectItem key={y} value={y} className="focus:bg-neutral-800">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid h-full grid-cols-[2fr,1fr] gap-6 overflow-hidden">
        <div className="flex flex-col gap-6 overflow-hidden">
          <SummaryCards
            balance={dashboard.balance}
            depositsTotal={dashboard.depositsTotal}
            expensesTotal={dashboard.expensesTotal}
            investmentsTotal={dashboard.investmentsTotal}
            userCanAddTransaction={false}
          />

          <div className="grid h-full grid-cols-3 grid-rows-1 gap-6 overflow-hidden">
            <TransactionsPieChart
              depositsTotal={dashboard.depositsTotal}
              investmentsTotal={dashboard.investmentsTotal}
              expensesTotal={dashboard.expensesTotal}
              typesPercentage={dashboard.typesPercentage}
            />
            <ExpensesPerCategory
              expensesPerCategory={dashboard.totalExpensePerCategory}
            />
          </div>
        </div>

        <LastTransactions lastTransactions={dashboard.lastTransactions} />
      </div>

      {loading && <div className="text-sm text-neutral-400">Carregando transações...</div>}
    </div>
  );
}