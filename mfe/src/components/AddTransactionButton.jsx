"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDownUpIcon } from "lucide-react";

export default function AddTransactionButton({ userCanAdd, disabledReason, onClick }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-full font-bold"
            onClick={onClick}
            disabled={!userCanAdd}
          >
            Adicionar transação

            <ArrowDownUpIcon />
          </Button>
        </TooltipTrigger>
        {!userCanAdd && (
          <TooltipContent>
            {disabledReason ||
              "Você atingiu o limite de transações. Atualize seu plano para criar transações ilimitadas."}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}