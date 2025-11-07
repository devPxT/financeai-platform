-- Cria a nova tabela de relatórios (histórico de respostas da OpenAI)
IF OBJECT_ID('dbo.Reports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Reports (
    id        VARCHAR(50)    NOT NULL PRIMARY KEY,
    userId    VARCHAR(100)   NOT NULL,
    createdAt DATETIME2      NOT NULL CONSTRAINT DF_Reports_createdAt DEFAULT SYSUTCDATETIME(),
    title     NVARCHAR(200)  NOT NULL,
    msg       NVARCHAR(MAX)  NOT NULL
  );

  CREATE INDEX IX_Reports_UserId_CreatedAt ON dbo.Reports (userId, createdAt DESC);
END
GO  