import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import reportsRouter from "./routes/reports.routes.js";

dotenv.config();
const PORT = process.env.PORT || 4200;
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Nova rota para inserir Reports
app.use("/reports", reportsRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handler de rota não encontrada (opcional)
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

// Erros genéricos (opcional)
app.use((err, _req, res, _next) => {
  console.error("analytics-service error:", err);
  res.status(500).json({ error: "internal_error", message: err?.message || "unknown" });
});

app.listen(PORT, ()=>console.log(`Analytics service listening on ${PORT}`));