// import React from "react";
// import { CardContent, CardHeader, CardTitle } from "../ui/card";
// import { Progress } from "../ui/progress";

// export default function ExpensesPerCategory({ expensesPerCategory }) {
//   return (
//     <div className="col-span-2 h-full rounded-md border pb-6 overflow-hidden">
//       <CardHeader>
//         <CardTitle className="font-bold">Gastos por Categoria</CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-6">
//         {expensesPerCategory.map((category) => (
//           <div key={category.category} className="space-y-2">
//             <div className="flex w-full justify-between">
//               <p className="text-sm font-bold">{category.category}</p>
//               <p className="text-sm font-bold">{category.percentageOfTotal}%</p>
//             </div>
//             <Progress value={category.percentageOfTotal} />
//           </div>
//         ))}
//       </CardContent>
//     </div>
//   );
// }

import React from "react";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

export default function ExpensesPerCategory({ expensesPerCategory }) {
  return (
    <div className="col-span-2 h-full rounded-md border bg-neutral-900 border-neutral-800 text-neutral-100 pb-6 overflow-hidden">
      <CardHeader>
        <CardTitle className="font-bold">Gastos por Categoria</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {expensesPerCategory.map((category) => (
          <div key={category.category} className="space-y-2">
            <div className="flex w-full justify-between">
              <p className="text-sm font-bold">{category.category}</p>
              <p className="text-sm font-bold">{category.percentageOfTotal}%</p>
            </div>
            <Progress value={category.percentageOfTotal} />
          </div>
        ))}
      </CardContent>
    </div>
  );
}