import { Badge } from "@/components/ui/badge";
import { Circle as CircleIcon } from "lucide-react";

// Cores pedidas
const GREEN = "#55B02E";
const RED = "#E93030";
const WHITE = "#FFFFFF";

export default function TransactionTypeBadge({ type }) {
  const t = String(type || "").toLowerCase();

  if (t === "depósito" || t === "deposito") {
    return (
      <Badge
        className="font-bold"
        style={{
          color: GREEN,
          backgroundColor: "color-mix(in oklab, #55B02E 15%, transparent)",
          borderColor: "color-mix(in oklab, #55B02E 40%, transparent)",
        }}
      >
        <CircleIcon size={10} className="mr-2" style={{ fill: GREEN, color: GREEN }} />
        Depósito
      </Badge>
    );
  }

  if (t === "despesa") {
    return (
      <Badge
        className="font-bold"
        style={{
          color: RED,
          backgroundColor: "color-mix(in oklab, #E93030 15%, transparent)",
          borderColor: "color-mix(in oklab, #E93030 40%, transparent)",
        }}
      >
        <CircleIcon size={10} className="mr-2" style={{ fill: RED, color: RED }} />
        Despesa
      </Badge>
    );
  }

  // Investimento
  return (
    <Badge
      className="font-bold"
      style={{
        color: WHITE,
        backgroundColor: "color-mix(in oklab, #FFFFFF 10%, transparent)",
        borderColor: "color-mix(in oklab, #FFFFFF 35%, transparent)",
      }}
    >
      <CircleIcon size={10} className="mr-2" style={{ fill: WHITE, color: WHITE }} />
      Investimento
    </Badge>
  );
}