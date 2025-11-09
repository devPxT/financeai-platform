// Use case de quota mensal de relatórios
export function getReportsQuotaUseCase(repository, { monthlyLimitProvider } = {}) {
  return async function execute({ userId }) {
    if (!userId) {
      const err = new Error("missing_userId");
      err.code = "missing_userId";
      throw err;
    }

    const limitFromEnv = Number(process.env.REPORTS_MONTHLY_LIMIT || 3);
    const limit = typeof monthlyLimitProvider === "function" ? Number(monthlyLimitProvider()) || limitFromEnv : limitFromEnv;

    const used = await repository.countReportsFromUtcMonthStart(userId);
    const remaining = Math.max(0, limit - used);
    return { limit, used, remaining };
  };
}