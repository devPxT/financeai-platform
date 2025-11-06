import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DeleteTransactionDialog({
  open,
  setOpen,
  transactionName,
  onConfirm,
  loading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-[#111114] text-white border border-[#2a2a2e]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Deletar transação</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-300">
            Tem certeza que deseja deletar {transactionName ? `“${transactionName}”` : "esta transação"}?
            Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          {/* Cancelar com o tom escuro, para ficar consistente com o modal de upsert */}
          <AlertDialogCancel className="bg-[#1F1F21] text-white border-none hover:bg-[#2A2A2D] hover:text-white cursor-pointer">
            Cancelar
          </AlertDialogCancel>
          {/* Confirmar em vermelho (padrão destrutivo) */}
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-[#E93030] hover:bg-[#FF4747] text-white"
          >
            {loading ? "Removendo..." : "Deletar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}