export function updateTransactionUseCase(repository) {
  return async function execute(id, data) {
    return repository.update(id, data);
  };
}