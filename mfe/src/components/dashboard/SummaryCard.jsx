// import React from "react";
// import { Card, CardContent, CardHeader } from "../ui/card";
// // Ajuste este import para o caminho real do seu botão:
// import AddTransactionButton from "../AddTransactionButton";

// function formatBRL(amount) {
//   return Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount || 0));
// }

// export default function SummaryCard({ icon, title, amount, size = "small", userCanAddTransaction }) {
//   return (
//     <Card>
//       <CardHeader className="flex-row items-center gap-4">
//         {icon}
//         <p className={size === "small" ? "text-muted-foreground" : "text-white opacity-70"}>
//           {title}
//         </p>
//       </CardHeader>
//       <CardContent className="flex justify-between">
//         <p className={`font-bold ${size === "small" ? "text-2xl" : "text-4xl"}`}>
//           {formatBRL(amount)}
//         </p>

//         {size === "large" && (
//           <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
//         )}
//       </CardContent>
//     </Card>
//   );
// }

import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import AddTransactionButton from "../AddTransactionButton";

function formatBRL(amount) {
  return Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount || 0));
}

export default function SummaryCard({ icon, title, amount, size = "small", userCanAddTransaction }) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
      <CardHeader className="flex-row items-center gap-4">
        {icon}
        <p className={size === "small" ? "text-neutral-400" : "text-neutral-100/70"}>
          {title}
        </p>
      </CardHeader>
      <CardContent className="flex justify-between">
        <p className={`font-bold ${size === "small" ? "text-2xl" : "text-4xl"}`}>
          {formatBRL(amount)}
        </p>

        {size === "large" && (
          <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
        )}
      </CardContent>
    </Card>
  );
}