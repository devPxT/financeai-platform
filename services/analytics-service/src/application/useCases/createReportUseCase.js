export function createReportUseCase(repository) {
  return async function execute({ userId, msg, titleFactory }) {
    const title =
      typeof titleFactory === "function"
        ? titleFactory()
        : `Relatório - ${new Date().toISOString().slice(0, 10)}`;
    return repository.create({ userId, msg, title });
  };
}