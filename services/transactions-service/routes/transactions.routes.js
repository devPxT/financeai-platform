import express from "express";
import * as ctrl from "../controllers/transactions.controller.js";
const router = express.Router();

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.get("/summary", ctrl.summary);

export default router;
