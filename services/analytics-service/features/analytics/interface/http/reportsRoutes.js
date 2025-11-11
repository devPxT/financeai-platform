import express from "express";
export function buildReportsRoutes(controller) {
  const router = express.Router();
  router.post("/", controller.create);
  router.get("/", controller.list);
  // NOVO: rota de quota
  router.get("/quota", controller.quota);
  return router;
}