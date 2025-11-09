import express from "express";
export function buildReportsRoutes(controller) {
  const router = express.Router();
  router.post("/", controller.create);
  router.get("/", controller.list);
  return router;
}