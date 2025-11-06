import React from "react";
import { Pencil } from "lucide-react";

/**
 * Ícone de editar com espaçamento maior e hover verde (#55B02E).
 */
export default function EditTransactionIcon({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Editar"
      className="
        inline-flex items-center justify-center
        h-9 w-9
        rounded-md
        transition-colors
        bg-[#161716]
        text-[#55B02E]
        border border-[#1F1F21]
        cursor-pointer
        hover:bg-[#55B02E] hover:text-white
        active:scale-[0.97]
        focus:outline-none focus:ring-1 focus:ring-[#55B02E]
      "
      style={{ lineHeight: 0 }}
    >
      <Pencil size={18} />
    </button>
  );
}