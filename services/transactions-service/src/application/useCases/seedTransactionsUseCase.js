export function seedTransactionsUseCase(repository) {
  return async function execute() {
    return repository.seedDemo();
  };
}