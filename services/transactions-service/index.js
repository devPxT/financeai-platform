import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import transactionsRouter from "./routes/transactions.routes.js";

dotenv.config();
const PORT = process.env.PORT || 4100;
const MONGO_URI = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("dev"));

if (!MONGO_URI) {
  console.warn("MONGO_URI not configured - service will start but DB operations will fail.");
} else {
  mongoose.connect(MONGO_URI).then(()=>console.log("MongoDB connected (transactions)")).catch(err=>console.error(err));
}

/* Logger de requisições de /transactions (COLoque AQUI)
   - Precisa vir DEPOIS do bodyParser.json e ANTES do router */
app.use((req, _res, next) => {
    if (req.path.startsWith("/transactions")) {
      console.log("[transactions-service] incoming", {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        body: req.body, // aqui você vê o payload que pode estar causando o 400
      });
    }
  next();
});

app.use("/transactions", transactionsRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post("/internal/seed", async (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (process.env.INTERNAL_SECRET && secret !== process.env.INTERNAL_SECRET) return res.status(401).json({ error: "unauthorized" });
  try {
    const { seed } = await import("./controllers/transactions.controller.js");
    const r = await seed();
    res.json({ ok: true, r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, ()=>console.log(`Transactions service listening on ${PORT}`));
