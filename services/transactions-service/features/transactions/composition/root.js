// Composition Root: injeta dependências
import { MongooseTransactionRepository } from "../infrastructure/mongooseTransactionRepository.js";
import { listTransactionsUseCase } from "../application/useCases/listTransactionsUseCase.js";
import { createTransactionUseCase } from "../application/useCases/createTransactionUseCase.js";
import { updateTransactionUseCase } from "../application/useCases/updateTransactionUseCase.js";
import { removeTransactionUseCase } from "../application/useCases/removeTransactionUseCase.js";
import { seedTransactionsUseCase } from "../application/useCases/seedTransactionsUseCase.js";
import { buildTransactionsController } from "../interface/http/transactionsController.js";
import { buildTransactionsRoutes } from "../interface/http/transactionsRoutes.js";

// import { listTransactionsUseCase } from "../application/useCases/listTransactionsUseCase.js";

export function buildAppContainer() {
  const repository = new MongooseTransactionRepository();
  const useCases = {
    list: listTransactionsUseCase(repository),
    create: createTransactionUseCase(repository),
    update: updateTransactionUseCase(repository),
    remove: removeTransactionUseCase(repository),
    seed: seedTransactionsUseCase(repository)
  };
  const controller = buildTransactionsController(useCases);
  const routes = buildTransactionsRoutes(controller);
  return { repository, useCases, controller, routes };
}