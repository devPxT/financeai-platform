// Repositório SQL (infra) – adiciona método de contagem mensal e corrige import de crypto
import sql from "mssql";
import crypto from "node:crypto";
import { ReportEntity } from "../domain/ReportEntity.js";

function getConfig() {
  return {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    port: Number(process.env.AZURE_SQL_PORT || 1433),
    options: {
      encrypt: true,
      trustServerCertificate: (process.env.AZURE_SQL_TRUST_CERT || "false").toLowerCase() === "true"
    }
  };
}

async function run(q, inputs = []) {
  const pool = await new sql.ConnectionPool(getConfig()).connect();
  try {
    const req = pool.request();
    for (const i of inputs) {
      if (Object.prototype.hasOwnProperty.call(i, "type")) req.input(i.name, i.type, i.value);
      else req.input(i.name, i.value);
    }
    return await req.query(q);
  } finally {
    await pool.close();
  }
}

export class SqlReportRepository {
  async create({ userId, title, msg }) {
    const entity = new ReportEntity({ userId, title, msg });
    entity.validate();

    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const q = `
      INSERT INTO dbo.Reports (id, userId, title, msg)
      OUTPUT inserted.id, inserted.userId, inserted.createdAt, inserted.title, inserted.msg
      VALUES (@id, @userId, @title, @msg);
    `;
    const inputs = [
      { name: "id", type: sql.VarChar(50), value: id },
      { name: "userId", type: sql.VarChar(100), value: userId },
      { name: "title", type: sql.NVarChar(200), value: title },
      { name: "msg", type: sql.NVarChar(sql.MAX), value: msg }
    ];

    const rs = await run(q, inputs);
    const row = rs?.recordset?.[0];
    return new ReportEntity({
      id: row?.id || id,
      userId,
      title,
      msg,
      createdAt: row?.createdAt
    });
  }

  async list({ userId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const countQ = `SELECT COUNT(1) AS total FROM dbo.Reports WHERE userId=@userId`;
    const dataQ = `
      SELECT id, userId, createdAt, title, msg
      FROM dbo.Reports
      WHERE userId=@userId
      ORDER BY createdAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const countRs = await run(countQ, [{ name: "userId", type: sql.VarChar(100), value: userId }]);
    const total = Number(countRs?.recordset?.[0]?.total || 0);

    const dataRs = await run(dataQ, [
      { name: "userId", type: sql.VarChar(100), value: userId },
      { name: "offset", type: sql.Int, value: offset },
      { name: "limit", type: sql.Int, value: limit }
    ]);

    const items = (dataRs?.recordset || []).map(
      (r) =>
        new ReportEntity({
          id: r.id,
          userId: r.userId,
          title: r.title,
          msg: r.msg,
          createdAt: r.createdAt
        })
    );

    return { total, items, page, limit };
  }

  // NOVO: contagem de relatórios desde o 1º dia do mês UTC atual
  async countReportsFromUtcMonthStart(userId) {
    const q = `
      SELECT COUNT(1) AS used
      FROM dbo.Reports
      WHERE userId = @userId
        AND createdAt >= DATETIMEFROMPARTS(
              YEAR(SYSUTCDATETIME()),
              MONTH(SYSUTCDATETIME()),
              1,0,0,0,0
            );
    `;
    const inputs = [{ name: "userId", type: sql.VarChar(100), value: userId }];
    const rs = await run(q, inputs);
    return Number(rs?.recordset?.[0]?.used || 0);
  }
}