export function listReportsUseCase(repository) {
  return async function execute({ userId, page = 1, limit = 10 }) {
    return repository.list({ userId, page, limit });
  };
}