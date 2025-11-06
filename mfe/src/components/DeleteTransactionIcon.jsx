import React, { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Ícone de deletar com hover vermelho (#E93030).
 */
export default function DeleteTransactionIcon({ onClick, disabled }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (disabled || loading) return;
    try {
      setLoading(true);
      await onClick?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      title={disabled ? "Indisponível" : "Deletar"}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        h-9 w-9
        rounded-md
        transition-colors
        bg-[#161716]
        text-[#E93030]
        border border-[#1F1F21]
        cursor-pointer
        hover:bg-[#E93030] hover:text-white
        active:scale-[0.97]
        focus:outline-none focus:ring-1 focus:ring-[#E93030]
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
      style={{ lineHeight: 0 }}
    >
      {loading ? (
        <span className="animate-pulse text-xs font-semibold">…</span>
      ) : (
        <Trash2 size={18} />
      )}
    </button>
  );
}