import express from "express";
import { createReport, listReports, getQuota } from "../controllers/reports.controller.js";

const router = express.Router();

router.post("/", createReport); // Cria registro de relatório (msg gerada pelo BFF via OpenAI)
router.get("/", listReports); // Lista histórico de relatórios do usuário
router.get("/quota", getQuota); // Quota mensal (quantos usados / restante)

export default router;

// import express from "express";
// import { createReport } from "../controllers/reports.controller.js";

// const router = express.Router();

// // Apenas insert do relatório
// router.post("/", createReport);

// export default router;