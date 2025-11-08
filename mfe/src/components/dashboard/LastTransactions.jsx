// import React from "react";
// import { Button } from "../ui/button";
// import { CardContent, CardHeader, CardTitle } from "../ui/card";
// import { ScrollArea } from "../ui/scroll-area";

// function formatCurrency(n) {
//   return Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));
// }

// function amountColor(t) {
//   const tp = String(t?.type || "").toUpperCase();
//   if (tp.includes("EXPENSE")) return "text-red-500";
//   if (tp.includes("DEPOSIT")) return "text-primary";
//   return "text-white";
// }
// function amountPrefix(t) {
//   const tp = String(t?.type || "").toUpperCase();
//   return tp.includes("DEPOSIT") ? "+" : "-";
// }

// export default function LastTransactions({ lastTransactions }) {
//   return (
//     <ScrollArea className="rounded-md border">
//       <CardHeader className="flex-row items-center justify-between">
//         <CardTitle className="font-bold">Últimas Transações</CardTitle>
//         <Button variant="outline" className="rounded-full font-bold" asChild>
//           <a href="/transactions">Ver mais</a>
//         </Button>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         {lastTransactions.map((t) => (
//           <div key={t.id} className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="rounded-lg bg-white/5 p-3 text-white">
//                 {/* Ícone de método de pagamento pode ser adicionado depois conforme seu mapeamento */}
//                 <span className="text-xs opacity-70">{t.paymentMethod || "—"}</span>
//               </div>
//               <div>
//                 <p className="text-sm font-bold">{t.name}</p>
//                 <p className="text-sm text-muted-foreground">
//                   {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
//                 </p>
//               </div>
//             </div>
//             <p className={`text-sm font-bold ${amountColor(t)}`}>
//               {amountPrefix(t)}
//               {formatCurrency(t.amount)}
//             </p>
//           </div>
//         ))}
//       </CardContent>
//     </ScrollArea>
//   );
// }

import React from "react";
import { Button } from "../ui/button";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";

function formatCurrency(n) {
  return Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));
}

function amountColor(t) {
  const tp = String(t?.type || "").toUpperCase();
  if (tp.includes("EXPENSE")) return "text-red-500";
  if (tp.includes("DEPOSIT")) return "text-primary";
  return "text-white";
}
function amountPrefix(t) {
  const tp = String(t?.type || "").toUpperCase();
  return tp.includes("DEPOSIT") ? "+" : "-";
}

export default function LastTransactions({ lastTransactions }) {
  return (
    <ScrollArea className="rounded-md border bg-neutral-900 border-neutral-800 text-neutral-100">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-bold">Últimas Transações</CardTitle>
        <Button variant="secondary" className="rounded-full font-bold" asChild>
          <a href="/transactions">Ver mais</a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastTransactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/5 p-3 text-white">
                <span className="text-xs opacity-70">{t.paymentMethod || "—"}</span>
              </div>
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-sm text-neutral-400">
                  {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <p className={`text-sm font-bold ${amountColor(t)}`}>
              {amountPrefix(t)}
              {formatCurrency(t.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </ScrollArea>
  );
}