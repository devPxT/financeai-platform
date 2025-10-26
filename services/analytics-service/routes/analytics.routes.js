import express from "express";
import { kpis } from "../controllers/analytics.controller.js";
const router = express.Router();
router.get("/", kpis);
export default router;
