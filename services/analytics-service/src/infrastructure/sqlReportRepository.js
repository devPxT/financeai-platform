import sql from "mssql";
import { ReportEntity } from "../domain/ReportEntity.js";

function getConfig() {
  return {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    port: Number(process.env.AZURE_SQL_PORT || 1433),
    options: { encrypt: true }
  };
}

async function run(q, inputs = []) {
  const pool = await new sql.ConnectionPool(getConfig()).connect();
  try {
    const req = pool.request();
    for (const i of inputs) {
      if (i.type) req.input(i.name, i.type, i.value);
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
    const q = `
      INSERT INTO dbo.Reports (id, userId, title, msg)
      OUTPUT inserted.id, inserted.userId, inserted.createdAt, inserted.title, inserted.msg
      VALUES (@id, @userId, @title, @msg);
    `;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const sqlLib = sql;
    const inputs = [
      { name: "id", type: sqlLib.VarChar(50), value: id },
      { name: "userId", type: sqlLib.VarChar(100), value: userId },
      { name: "title", type: sqlLib.NVarChar(200), value: title },
      { name: "msg", type: sqlLib.NVarChar(sqlLib.MAX), value: msg }
    ];
    const rs = await run(q, inputs);
    const row = rs.recordset?.[0];
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
    const sqlLib = sql;
    const countRs = await run(countQ, [{ name: "userId", type: sqlLib.VarChar(100), value: userId }]);
    const total = Number(countRs.recordset?.[0]?.total || 0);
    const dataRs = await run(dataQ, [
      { name: "userId", type: sqlLib.VarChar(100), value: userId },
      { name: "offset", type: sqlLib.Int, value: offset },
      { name: "limit", type: sqlLib.Int, value: limit }
    ]);
    const items = (dataRs.recordset || []).map(
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
}