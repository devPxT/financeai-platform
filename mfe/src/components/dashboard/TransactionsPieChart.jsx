// "use client";

// import React from "react";
// import { Card, CardContent } from "../ui/card";
// import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
// import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

// function PercentageItem({ icon, title, value }) {
//   return (
//     <div className="flex items-center gap-2">
//       {icon}
//       <p className="text-sm font-bold">{title}</p>
//       <p className="ml-auto text-sm font-bold">{value}%</p>
//     </div>
//   );
// }

// export default function TransactionsPieChart({ typesPercentage, depositsTotal, investmentsTotal, expensesTotal }) {
//   const chartData = [
//     { type: "DEPOSIT", amount: depositsTotal, fill: "#55B02E" },
//     { type: "EXPENSE", amount: expensesTotal, fill: "#E93030" },
//     { type: "INVESTMENT", amount: investmentsTotal, fill: "#FFFFFF" }
//   ];

//   return (
//     <Card className="flex flex-col p-6">
//       <CardContent className="flex-1 pb-0">
//         <div className="mx-auto aspect-square max-h-[250px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Tooltip contentStyle={{ background: "#0b0b0b", border: "1px solid #222", color: "#fff" }} />
//               <Pie data={chartData} dataKey="amount" nameKey="type" innerRadius={60} />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="space-y-3">
//           <PercentageItem
//             icon={<TrendingUp size={16} className="text-primary" />}
//             title="Receita"
//             value={typesPercentage?.DEPOSIT || 0}
//           />
//           <PercentageItem
//             icon={<TrendingDown size={16} className="text-red-500" />}
//             title="Despesas"
//             value={typesPercentage?.EXPENSE || 0}
//           />
//           <PercentageItem
//             icon={<PiggyBank size={16} />}
//             title="Investido"
//             value={typesPercentage?.INVESTMENT || 0}
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import React from "react";
import { Card, CardContent } from "../ui/card";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

function PercentageItem({ icon, title, value }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-sm font-bold">{title}</p>
      <p className="ml-auto text-sm font-bold">{value}%</p>
    </div>
  );
}

export default function TransactionsPieChart({ typesPercentage, depositsTotal, investmentsTotal, expensesTotal }) {
  const chartData = [
    { type: "DEPOSIT", amount: depositsTotal, fill: "#55B02E" },
    { type: "EXPENSE", amount: expensesTotal, fill: "#E93030" },
    { type: "INVESTMENT", amount: investmentsTotal, fill: "#FFFFFF" }
  ];

  return (
    <Card className="flex flex-col p-6 bg-neutral-900 border-neutral-800 text-neutral-100">
      <CardContent className="flex-1 pb-0">
        <div className="mx-auto aspect-square max-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: "#0b0b0b",
                  border: "1px solid #222",
                  color: "#fff"
                }}
              />
              <Pie data={chartData} dataKey="amount" nameKey="type" innerRadius={60} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <PercentageItem
            icon={<TrendingUp size={16} className="text-green-500" />}
            title="Receita"
            value={typesPercentage?.DEPOSIT || 0}
          />
          <PercentageItem
            icon={<TrendingDown size={16} className="text-red-500" />}
            title="Despesas"
            value={typesPercentage?.EXPENSE || 0}
          />
          <PercentageItem
            icon={<PiggyBank size={16} />}
            title="Investido"
            value={typesPercentage?.INVESTMENT || 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}