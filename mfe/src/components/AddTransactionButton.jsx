"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDownUpIcon } from "lucide-react";

export default function AddTransactionButton({ userCanAdd, disabledReason }) {
  const disabled = useMemo(() => userCanAdd === false, [userCanAdd]);
  const tooltipText =
    disabledReason ||
    "Você atingiu o limite de transações. Atualize seu plano para criar transações ilimitadas.";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-full font-bold"
            onClick={() => {/* abrirá o modal futuramente */}}
            disabled={disabled}
          >
            Adicionar transação

            <ArrowDownUpIcon />
          </Button>
        </TooltipTrigger>
        {disabled && <TooltipContent>{tooltipText}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}