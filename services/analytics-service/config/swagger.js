import swaggerJsdoc from "swagger-jsdoc";

const opts = {
  definition: {
    openapi: "3.0.3",
    info: { title: "Analytics Service (Azure SQL)", version: "1.0.0", description: "KPIs service backed by Azure SQL" },
    servers: [{ url: "http://localhost:4200" }]
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(opts);
