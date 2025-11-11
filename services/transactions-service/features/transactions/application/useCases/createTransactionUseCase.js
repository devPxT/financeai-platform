export function createTransactionUseCase(repository) {
  return async function execute(payload) {
    return repository.create(payload);
  };
}