// import React from "react";
// import { Wallet as WalletIcon, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
// import SummaryCard from "./SummaryCard";

// export default function SummaryCards({
//   balance,
//   depositsTotal,
//   expensesTotal,
//   investmentsTotal,
//   userCanAddTransaction
// }) {
//   return (
//     <div className="space-y-6">
//       <SummaryCard
//         icon={<WalletIcon size={16} />}
//         title="Saldo"
//         amount={balance}
//         size="large"
//         userCanAddTransaction={userCanAddTransaction}
//       />

//       <div className="grid grid-cols-3 gap-6">
//         <SummaryCard
//           icon={<PiggyBank size={16} />}
//           title="Investido"
//           amount={investmentsTotal}
//         />
//         <SummaryCard
//           icon={<TrendingUp size={16} className="text-primary" />}
//           title="Receita"
//           amount={depositsTotal}
//         />
//         <SummaryCard
//           icon={<TrendingDown size={16} className="text-red-500" />}
//           title="Despesas"
//           amount={expensesTotal}
//         />
//       </div>
//     </div>
//   );
// }

import React from "react";
import { Wallet as WalletIcon, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import SummaryCard from "./SummaryCard";

export default function SummaryCards({
  balance,
  depositsTotal,
  expensesTotal,
  investmentsTotal,
  userCanAddTransaction
}) {
  return (
    <div className="space-y-6">
      <SummaryCard
        icon={<WalletIcon size={16} />}
        title="Saldo"
        amount={balance}
        size="large"
        userCanAddTransaction={userCanAddTransaction}
      />

      <div className="grid grid-cols-3 gap-6">
        <SummaryCard
          icon={<PiggyBank size={16} />}
          title="Investido"
          amount={investmentsTotal}
        />
        <SummaryCard
          icon={<TrendingUp size={16} className="text-green-500" />}
          title="Receita"
          amount={depositsTotal}
        />
        <SummaryCard
          icon={<TrendingDown size={16} className="text-red-500" />}
          title="Despesas"
          amount={expensesTotal}
        />
      </div>
    </div>
  );
}