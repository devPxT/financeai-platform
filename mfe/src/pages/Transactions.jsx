import React, { useEffect, useMemo, useState } from "react";
import { useBff } from "@/utils/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddTransactionButton from "@/components/AddTransactionButton";
import TransactionTypeBadge from "@/components/TransactionTypeBadge";
import { DataTable } from "@/components/ui/data-table";
import { useCanUserAddTransaction } from "@/hooks/useCanUserAddTransaction";
import EditTransactionIcon from "@/components/EditTransactionIcon";
import DeleteTransactionIcon from "@/components/DeleteTransactionIcon";
import UpsertTransactionDialog from "@/components/UpsertTransactionDialog";
import DeleteTransactionDialog from "@/components/DeleteTransactionDialog";

function formatDateBR(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
function formatBRL(n) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));
}

export default function TransactionsPage() {
  const api = useBff();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTx, setDeleteTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { isPremium, currentMonthCount, userCanAdd } = useCanUserAddTransaction();

  const disabledReason = useMemo(() => {
    if (isPremium) return "";
    if (currentMonthCount >= 10)
      return "Limite de 10 transações/mês no plano gratuito atingido.";
    return "";
  }, [isPremium, currentMonthCount]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.get("/bff/transactions");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("transactions load error", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTx(null);
    setUpsertOpen(true);
  }
  function openEdit(tx) {
    setEditTx(tx);
    setUpsertOpen(true);
  }
  function openDelete(tx) {
    setDeleteTx(tx);
    setDeleteOpen(true);
  }

  async function onDeleteConfirm() {
    if (!deleteTx) return;
    const id = deleteTx._id || deleteTx.id;
    if (!id) return;
    try {
      setDeleting(true);
      await api.del(`/bff/transactions/${encodeURIComponent(id)}`);
      setDeleteOpen(false);
      setDeleteTx(null);
      await refresh();
    } catch (err) {
      console.error("delete error", err);
      alert("Erro ao deletar: " + (err?.message || String(err)));
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => row.original.name || "—",
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => <TransactionTypeBadge type={row.original.type} />,
      },
      {
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => row.original.category || "—",
      },
      {
        accessorKey: "paymentMethod",
        header: "Método",
        cell: ({ row }) => row.original.paymentMethod || "—",
      },
      {
        accessorKey: "date",
        header: "Data",
        cell: ({ row }) => formatDateBR(row.original.date),
      },
      {
        accessorKey: "amount",
        header: "Valor",
        cell: ({ row }) => formatBRL(row.original.amount),
      },
      {
        accessorKey: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="flex items-center gap-4">
              <EditTransactionIcon onClick={() => openEdit(tx)} />
              <DeleteTransactionIcon
                disabled={!(tx._id || tx.id)}
                onClick={() => openDelete(tx)}
              />
            </div>
          );
        },
      },
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <AddTransactionButton
          userCanAdd={userCanAdd}
          disabledReason={disabledReason}
          onClick={openCreate}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </ScrollArea>

      {/* Modal de criar/editar */}
      <UpsertTransactionDialog
        open={upsertOpen}
        setOpen={setUpsertOpen}
        transaction={editTx}
        onSuccess={refresh}
      />

      {/* Modal de deletar */}
      <DeleteTransactionDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        transactionName={deleteTx?.name}
        onConfirm={onDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}