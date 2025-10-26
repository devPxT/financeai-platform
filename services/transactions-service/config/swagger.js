import swaggerJsdoc from "swagger-jsdoc";

const opts = {
  definition: {
    openapi: "3.0.3",
    info: { title: "Transactions Service", version: "1.0.0", description: "Transactions microservice for FinanceAI" },
    servers: [{ url: "http://localhost:4100" }]
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(opts);
