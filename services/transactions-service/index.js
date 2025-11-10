// Novo index preservando funcionalidade (você pode substituir o antigo quando testar).
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
// import swaggerUi from "swagger-ui-express";
import { buildAppContainer } from "./src/composition/root.js";

dotenv.config();
const PORT = process.env.PORT || 4100;
const MONGO_URI = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("dev"));

if (!MONGO_URI) {
  console.warn("MONGO_URI not configured.");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected (transactions-service clean)"))
    .catch((err) => console.error(err));
}

const { routes, controller } = buildAppContainer();

// Rotas
app.use("/transactions", routes);
app.post("/internal/seed", controller.seed);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, _req, res, _next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: "internal_error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`Transactions service (clean) listening on ${PORT}`);
});