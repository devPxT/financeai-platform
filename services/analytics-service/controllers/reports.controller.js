import sql from "mssql";
import { v4 as uuidv4 } from "uuid";

/**
 * Configuração do Azure SQL via variáveis separadas (mesmo padrão do controller antigo).
 */
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

/**
 * Execução de query abrindo/fechando o pool por chamada (padrão antigo).
 * inputs aceita:
 *  - { name, type, value }  -> usa req.input(name, type, value)
 *  - { name, value }        -> usa req.input(name, value)
 */
async function runQuery(q, inputs = []) {
  const pool = await new sql.ConnectionPool(getConfig()).connect();
  try {
    const req = pool.request();
    for (const inp of inputs) {
      if (Object.prototype.hasOwnProperty.call(inp, "type")) {
        req.input(inp.name, inp.type, inp.value);
      } else {
        req.input(inp.name, inp.value);
      }
    }
    const res = await req.query(q);
    return res;
  } finally {
    await pool.close();
  }
}

/**
 * Gera título padrão: "Relatório - DD/MM/YYYY"
 */
function makeTitle(date = new Date()) {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `Relatório - ${dd}/${mm}/${yyyy}`;
}

/**
 * POST /reports
 * body: { userId: string, msg: string }
 * Insere um registro na dbo.Reports e retorna o item criado.
 */
export async function createReport(req, res) {
  try {
    const userId = String(req.body?.userId || "").trim();
    const msg = String(req.body?.msg || "").trim();
    if (!userId || !msg) {
      return res.status(400).json({ error: "missing_userId_or_msg" });
    }

    const id = uuidv4();
    const title = makeTitle();

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

    const rs = await runQuery(q, inputs);
    const created = rs?.recordset?.[0] || { id, userId, title, msg, createdAt: new Date().toISOString() };
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: "create_failed", details: err.message });
  }
}

/**
 * GET /reports?userId=...&page=1&limit=10
 * Lista histórico do usuário com paginação.
 */
export async function listReports(req, res) {
  try {
    const userId = String(req.query?.userId || "").trim();
    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit || 10)));
    const offset = (page - 1) * limit;

    if (!userId) return res.status(400).json({ error: "missing_userId" });

    // total
    {
      const qTotal = "SELECT COUNT(1) AS total FROM dbo.Reports WHERE userId = @userId;";
      const inTotal = [{ name: "userId", type: sql.VarChar(100), value: userId }];
      const rTotal = await runQuery(qTotal, inTotal);
      var total = Number(rTotal?.recordset?.[0]?.total || 0);
    }

    // page
    const qPage = `
      SELECT id, userId, createdAt, title, msg
      FROM dbo.Reports
      WHERE userId = @userId
      ORDER BY createdAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
    const inPage = [
      { name: "userId", type: sql.VarChar(100), value: userId },
      { name: "offset", type: sql.Int, value: offset },
      { name: "limit", type: sql.Int, value: limit }
    ];
    const rPage = await runQuery(qPage, inPage);

    return res.json({
      items: rPage?.recordset || [],
      page,
      limit,
      total
    });
  } catch (err) {
    return res.status(500).json({ error: "list_failed", details: err.message });
  }
}

/**
 * GET /reports/quota?userId=...
 * Retorna o uso do mês: { limit, used, remaining }
 */
export async function getQuota(req, res) {
  try {
    const userId = String(req.query?.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "missing_userId" });

    const monthlyLimit = Number(process.env.REPORTS_MONTHLY_LIMIT || 3);

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
    const rs = await runQuery(q, inputs);

    const used = Number(rs?.recordset?.[0]?.used || 0);
    const remaining = Math.max(0, monthlyLimit - used);
    return res.json({ limit: monthlyLimit, used, remaining });
  } catch (err) {
    return res.status(500).json({ error: "quota_failed", details: err.message });
  }
}