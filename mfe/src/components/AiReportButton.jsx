// import React, { useState } from "react";
// import { useBff } from "../utils/api";

// export default function AiReportModal() {
//   const api = useBff();
//   const [open, setOpen] = useState(false);
//   const [report, setReport] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");

//   async function generateReport() {
//     setLoading(true);
//     setErr("");
//     setReport("");
//     try {
//       const r = await api.post("/bff/report", {}); // BFF gera e persiste no analytics-service
//       setReport(r?.report || "Sem resultado.");
//     } catch (e) {
//       setErr(e?.message || "Falha ao gerar relatório.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <>
//       <button
//         className="button"
//         onClick={() => setOpen(true)}
//         title="Relatório IA"
//         style={{ padding: "6px 10px" }}
//       >
//         Relatório IA
//       </button>

//       {open && (
//         <div
//           className="modal-backdrop"
//           onClick={() => setOpen(false)}
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.5)",
//             display: "grid",
//             placeItems: "center",
//             zIndex: 9999
//           }}
//         >
//           <div
//             className="modal-content"
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               width: "min(640px, 94vw)",
//               background: "#111",
//               color: "#fff",
//               borderRadius: 8,
//               padding: 16,
//               boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
//             }}
//           >
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <h3 style={{ margin: 0 }}>Relatório de IA</h3>
//               <button onClick={() => setOpen(false)} aria-label="Fechar" style={{ background: "transparent", color: "#fff", border: "none", fontSize: 18 }}>
//                 ✕
//               </button>
//             </div>

//             <p style={{ opacity: 0.8, marginTop: 8 }}>
//               Gere um relatório com insights usando seus dados de transações.
//             </p>

//             <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
//               <button
//                 onClick={generateReport}
//                 disabled={loading}
//                 style={{ padding: "6px 10px" }}
//               >
//                 {loading ? "Gerando..." : "Gerar relatório"}
//               </button>
//               <button onClick={() => setOpen(false)} style={{ padding: "6px 10px" }}>
//                 Fechar
//               </button>
//             </div>

//             <div style={{ marginTop: 12, maxHeight: 360, overflow: "auto", background: "#0b0b0b", padding: 12, borderRadius: 6 }}>
//               {err && <div style={{ color: "#ff6b6b", marginBottom: 8 }}>Erro: {err}</div>}
//               {report ? (
//                 <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{report}</pre>
//               ) : (
//                 !loading && <div style={{ opacity: 0.75 }}>Nenhum relatório gerado ainda.</div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
import React, { useState } from "react";
import { useBff } from "../utils/api";
import { useUser } from "@clerk/clerk-react";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
// import { Bot, Loader2 } from "lucide-react"; // (opcional) se quiser ícones

export default function AiReportButton() {
  const api = useBff();
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  const hasPremiumPlan =
    (user?.publicMetadata && user.publicMetadata.subscriptionPlan === "premium") ||
    false;

  async function handleGenerate() {
    setLoading(true);
    setReport("");
    try {
      const r = await api.post("/bff/report", {});
      setReport(r?.report || "Sem resultado.");
    } catch (e) {
      setReport("Falha ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReport("");
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2 text-sm">
          Relatório IA
          {/* <Bot className="h-4 w-4" /> */}
        </Button>
      </DialogTrigger>

      {/* Dark modal classes adicionadas */}
      <DialogContent
        className="
          sm:max-w-[640px]
          bg-neutral-900
          border border-neutral-800
          text-neutral-100
          shadow-2xl
          [&>button]:text-neutral-400
        "
      >
        <DialogHeader>
          <DialogTitle className="text-neutral-100">Relatório IA</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Use inteligência artificial para gerar um relatório com insights sobre suas finanças.
          </DialogDescription>
        </DialogHeader>

        {hasPremiumPlan ? (
          <>
            <ScrollArea className="
              max-h-[450px]
              rounded-md
              border border-neutral-800
              bg-neutral-950/70
              p-3
              text-sm
              text-neutral-200
              font-mono
              whitespace-pre-wrap
              leading-relaxed
            ">
              {report || "Nenhum relatório gerado ainda."}
            </ScrollArea>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="bg-[#1F1F21] text-white hover:bg-[#2A2A2D] hover:text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-[#55B02E] hover:bg-[#55B02E]-800 text-white"
              >
                {loading ? "Gerando..." : "Gerar relatório"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="text-sm text-neutral-300">
              Você precisa de um plano premium para gerar relatórios com IA.
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="bg-[#1F1F21] text-white hover:bg-[#2A2A2D] hover:text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                asChild
                className="bg-[#55B02E] hover:bg-[#61994A] text-white"
              >
                <a href="/subscription">Assinar plano premium</a>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}