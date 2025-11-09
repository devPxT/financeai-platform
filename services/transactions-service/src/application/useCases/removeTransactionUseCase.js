export function removeTransactionUseCase(repository) {
  return async function execute(id) {
    return repository.remove(id);
  };
}