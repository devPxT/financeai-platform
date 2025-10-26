import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import analyticsRouter from "./routes/analytics.routes.js";

dotenv.config();
const PORT = process.env.PORT || 4200;
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/kpis", analyticsRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post("/internal/seed", async (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (process.env.INTERNAL_SECRET && secret !== process.env.INTERNAL_SECRET) return res.status(401).json({ error: "unauthorized" });
  const { seed } = await import("./controllers/analytics.controller.js");
  try {
    const r = await seed();
    res.json({ ok: true, r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, ()=>console.log(`Analytics service listening on ${PORT}`));
