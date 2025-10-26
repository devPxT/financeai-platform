import sql from "mssql";

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

async function query(q, inputs = []) {
  const pool = await new sql.ConnectionPool(getConfig()).connect();
  const req = pool.request();
  for (const inp of inputs) req.input(inp.name, inp.type, inp.value);
  const res = await req.query(q);
  await pool.close();
  return res;
}

export async function kpis(req, res) {
  try {
    const userId = req.query.userId || null;
    const where = userId ? `WHERE userId = @userId` : "";
    const inputs = userId ? [{ name: "userId", type: sql.VarChar, value: userId }] : [];
    const q = `
      SELECT
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS totalExpense
      FROM Transactions ${where};
    `;
    const r = await query(q, inputs);
    const row = r.recordset[0] || { totalIncome: 0, totalExpense: 0 };
    res.json({ totalIncome: Number(row.totalIncome || 0), totalExpense: Number(row.totalExpense || 0), net: Number((row.totalIncome || 0) - (row.totalExpense || 0)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function seed() {
  const pool = await new sql.ConnectionPool(getConfig()).connect();
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Transactions]') AND type in (N'U'))
      BEGIN
        CREATE TABLE dbo.Transactions (
          id NVARCHAR(50) PRIMARY KEY,
          userId NVARCHAR(100) NOT NULL,
          type NVARCHAR(10) NOT NULL,
          category NVARCHAR(100),
          amount DECIMAL(18,2),
          date DATETIME2,
          note NVARCHAR(400),
          createdAt DATETIME2 DEFAULT SYSUTCDATETIME()
        );
      END
    `);
    const r = await pool.request().query(`SELECT COUNT(1) AS cnt FROM dbo.Transactions`);
    const cnt = r.recordset[0]?.cnt || 0;
    if (cnt === 0) {
      await pool.request().query(`
        INSERT INTO dbo.Transactions (id, userId, type, category, amount, date, note) VALUES
        ('t1','demo','income','Salary',5000, SYSDATETIME()-3,'Demo salary'),
        ('t2','demo','expense','Groceries',120, SYSDATETIME()-2,'Market'),
        ('t3','demo','expense','Transport',250, SYSDATETIME()-10,'Uber')
      `);
      await pool.close();
      return { inserted: 3 };
    } else {
      await pool.close();
      return { inserted: 0 };
    }
  } catch (err) {
    await pool.close();
    throw err;
  }
}
