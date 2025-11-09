import { SqlReportRepository } from "../infrastructure/sqlReportRepository.js";
import { createReportUseCase } from "../application/useCases/createReportUseCase.js";
import { listReportsUseCase } from "../application/useCases/listReportsUseCase.js";
import { buildReportsController } from "../interface/http/reportsController.js";
import { buildReportsRoutes } from "../interface/http/reportsRoutes.js";

export function buildAnalyticsContainer() {
  const repository = new SqlReportRepository();
  const useCases = {
    create: createReportUseCase(repository),
    list: listReportsUseCase(repository)
  };
  const controller = buildReportsController(useCases);
  const routes = buildReportsRoutes(controller);
  return { repository, useCases, controller, routes };
}