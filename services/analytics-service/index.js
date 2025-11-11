import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
// import swaggerUi from "swagger-ui-express";
// import { swaggerSpec } from "./features/config/swagger.js";
import { buildAnalyticsContainer } from "./features/analytics/composition/root.js";

dotenv.config();
const PORT = process.env.PORT || 4200;

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("dev"));

const { routes } = buildAnalyticsContainer();

app.use("/reports", routes);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, _req, res, _next) => {
  console.error("unhandled_error", err);
  res.status(500).json({ error: "internal_error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`Analytics service (clean) listening on ${PORT}`);
});