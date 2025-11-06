import React, { useEffect, useState } from "react";
import { useBff } from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TRANSACTION_TYPE_OPTIONS,
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
} from "@/constants/transactions";

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function UpsertTransactionDialog({
  open,
  setOpen,
  transaction, // opcional: se presente, modo edição
  onSuccess, // callback após sucesso (para refresh)
}) {
  const api = useBff();
  const isUpdate = Boolean(transaction?._id || transaction?.id);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Despesa");
  const [category, setCategory] = useState("Outros");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [date, setDate] = useState(todayYMD());
  const [saving, setSaving] = useState(false);
  const id = transaction?._id || transaction?.id || null;

  useEffect(() => {
    if (transaction) {
      setName(transaction.name || "");
      setAmount(String(transaction.amount ?? ""));
      setType(transaction.type || "Despesa");
      setCategory(transaction.category || "Outros");
      setPaymentMethod(transaction.paymentMethod || "Pix");
      const d = transaction.date ? new Date(transaction.date) : new Date();
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      setDate(ymd);
    } else {
      setName("");
      setAmount("");
      setType("Despesa");
      setCategory("Outros");
      setPaymentMethod("Pix");
      setDate(todayYMD());
    }
  }, [transaction, open]);

  function closeAndReset() {
    setOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(String(amount).replace(/\./g, "").replace(",", "."));
    const payload = {
      name: name.trim(),
      amount: isNaN(value) ? 0 : value,
      type,
      category,
      paymentMethod,
      date, // YYYY-MM-DD
    };

    if (!payload.name) {
      alert("Preencha o nome.");
      return;
    }
    if (!payload.amount || payload.amount <= 0) {
      alert("Preencha um valor maior que zero.");
      return;
    }

    try {
      setSaving(true);
      if (isUpdate && id) {
        await api.put(`/bff/transactions/${encodeURIComponent(id)}`, payload);
      } else {
        await api.post(`/bff/transactions`, payload);
      }
      onSuccess?.();
      closeAndReset();
    } catch (err) {
      console.error("upsert transaction error", err);
      alert("Erro ao salvar transação: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeAndReset())}>
      <DialogContent className="bg-[#111114] text-white border border-[#2a2a2e]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isUpdate ? "Atualizar transação" : "Adicionar transação"}
          </DialogTitle>
          <DialogDescription className="text-neutral-300">
            Preencha as informações abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-white/90">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Almoço no trabalho"
              className="bg-[#1A1B1E] text-white placeholder:text-neutral-400 border border-[#2a2a2e] focus-visible:ring-[#39BE00]"
            />
          </div>

          {/* Valor + Data lado a lado (cada um metade) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Valor</label>
              <MoneyInput
                placeholder="R$ 0,00"
                value={amount}
                onValueChange={({ value: raw }) => setAmount(raw ?? "")}
                className="bg-[#1A1B1E] text-white placeholder:text-neutral-400 border border-[#2a2a2e] focus-visible:ring-[#39BE00]"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Data</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#1A1B1E] text-white placeholder:text-neutral-400 border border-[#2a2a2e] focus-visible:ring-[#39BE00]"
              />
            </div>
          </div>

          {/* Tipo, Categoria, Método */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-[#1A1B1E] text-white border border-[#2a2a2e] focus:ring-[#39BE00]">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1B1E] text-white border border-[#2a2a2e]">
                  {TRANSACTION_TYPE_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="focus:bg-[#2A2A2D] focus:text-white"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#1A1B1E] text-white border border-[#2a2a2e] focus:ring-[#39BE00]">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1B1E] text-white border border-[#2a2a2e]">
                  {TRANSACTION_CATEGORY_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="focus:bg-[#2A2A2D] focus:text-white"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Método</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-[#1A1B1E] text-white border border-[#2a2a2e] focus:ring-[#39BE00]">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1B1E] text-white border border-[#2a2a2e]">
                  {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="focus:bg-[#2A2A2D] focus:text-white"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={closeAndReset}
              className="bg-[#1F1F21] text-white hover:bg-[#2A2A2D] hover:text-white cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#39BE00] hover:bg-[#2FA100] text-white"
            >
              {saving ? "Salvando..." : isUpdate ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}