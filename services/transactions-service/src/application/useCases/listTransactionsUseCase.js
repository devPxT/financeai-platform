export function listTransactionsUseCase(repository) {
  return async function execute(params) {
    return repository.list(params);
  };
}