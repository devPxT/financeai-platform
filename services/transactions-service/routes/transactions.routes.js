import express from "express";
import * as ctrl from "../controllers/transactions.controller.js";
import { TIPOS, CATEGORIAS, METODOS_PAGAMENTO } from "../models/Transaction.js";

const router = express.Router();

// Helpers de validação
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function parseAmount(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace?.(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

function coerceDate(d) {
  if (!d) return undefined;
  // Aceita "YYYY-MM-DD" ou ISO
  const iso = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00.000Z` : d;
  const nd = new Date(iso);
  return Number.isFinite(nd.valueOf()) ? nd : undefined;
}

// Validador para criação
// function validateCreate(req, res, next) {
//   const body = { ...req.body };

//   // Não permitir sobrescrever campos sensíveis
//   delete body.userId;
//   delete body.createdAt;
//   delete body.updatedAt;
//   delete body.currency; // removido do modelo

//   // name
//   if (!isNonEmptyString(body.name)) {
//     return res.status(400).json({ error: "nome_invalido", detail: "Campo 'name' é obrigatório." });
//   }

//   // amount
//   const amount = parseAmount(body.amount);
//   if (!Number.isFinite(amount) || amount <= 0) {
//     return res.status(400).json({ error: "valor_invalido", detail: "Campo 'amount' deve ser um número > 0." });
//   }
//   body.amount = amount;

//   // type
//   if (!TIPOS.includes(body.type)) {
//     return res.status(400).json({ error: "tipo_invalido", allow: TIPOS });
//   }

//   // category
//   if (!CATEGORIAS.includes(body.category)) {
//     return res.status(400).json({ error: "categoria_invalida", allow: CATEGORIAS });
//   }

//   // paymentMethod
//   if (!METODOS_PAGAMENTO.includes(body.paymentMethod)) {
//     return res.status(400).json({ error: "metodo_pagamento_invalido", allow: METODOS_PAGAMENTO });
//   }

//   // date (opcional)
//   if (body.date != null) {
//     const d = coerceDate(body.date);
//     if (!d) {
//       return res.status(400).json({ error: "data_invalida", detail: "Use ISO ou YYYY-MM-DD." });
//     }
//     body.date = d;
//   } else {
//     delete body.date; // deixa o default do schema aplicar
//   }

//   req.body = body;
//   next();
// }

// helper que loga e retorna 400
function fail(res, code, extra, body) {
  console.warn("[transactions-service] validateCreate failed", { code, extra, body });
  return res.status(400).json({ error: code, ...(extra || {}) });
}

// Validador para criação
function validateCreate(req, res, next) {
  const body = { ...req.body };

  //delete body.userId;
  delete body.createdAt;
  delete body.updatedAt;
  delete body.currency; // removido do modelo

  if (!isNonEmptyString(body.name)) {
    return fail(res, "nome_invalido", { detail: "Campo 'name' é obrigatório." }, body);
  }

  const amount = parseAmount(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail(res, "valor_invalido", { detail: "Campo 'amount' deve ser um número > 0." }, body);
  }
  body.amount = amount;

  if (!TIPOS.includes(body.type)) {
    return fail(res, "tipo_invalido", { allow: TIPOS }, body);
  }
  if (!CATEGORIAS.includes(body.category)) {
    return fail(res, "categoria_invalida", { allow: CATEGORIAS }, body);
  }
  if (!METODOS_PAGAMENTO.includes(body.paymentMethod)) {
    return fail(res, "metodo_pagamento_invalido", { allow: METODOS_PAGAMENTO }, body);
  }

  if (body.date != null) {
    const d = coerceDate(body.date);
    if (!d) {
      return fail(res, "data_invalida", { detail: "Use ISO ou YYYY-MM-DD." }, body);
    }
    body.date = d;
  } else {
    delete body.date;
  }

  req.body = body;
  next();
}

// Validador para atualização (parcial)
function validateUpdate(req, res, next) {
  const body = { ...req.body };

  // Remover campos proibidos de update
  delete body.userId;
  delete body.createdAt;
  delete body.updatedAt;
  delete body.currency; // não existe mais

  // Validar apenas se presentes
  if (body.name != null && !isNonEmptyString(body.name)) {
    return res.status(400).json({ error: "nome_invalido" });
  }

  if (body.amount != null) {
    const amount = parseAmount(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "valor_invalido" });
    }
    body.amount = amount;
  }

  if (body.type != null && !TIPOS.includes(body.type)) {
    return res.status(400).json({ error: "tipo_invalido", allow: TIPOS });
  }

  if (body.category != null && !CATEGORIAS.includes(body.category)) {
    return res.status(400).json({ error: "categoria_invalida", allow: CATEGORIAS });
  }

  if (body.paymentMethod != null && !METODOS_PAGAMENTO.includes(body.paymentMethod)) {
    return res.status(400).json({ error: "metodo_pagamento_invalido", allow: METODOS_PAGAMENTO });
  }

  if (body.date != null) {
    const d = coerceDate(body.date);
    if (!d) {
      return res.status(400).json({ error: "data_invalida", detail: "Use ISO ou YYYY-MM-DD." });
    }
    body.date = d;
  }

  req.body = body;
  next();
}

// Rotas
router.get("/", ctrl.list);
router.post("/", validateCreate, ctrl.create);
router.put("/:id", validateUpdate, ctrl.update);
router.delete("/:id", ctrl.remove);

// Mantém summary (sem alteração)
router.get("/summary", ctrl.summary);

export default router;