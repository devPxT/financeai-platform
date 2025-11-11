import "tsarch/dist/jest";
import { slicesOfProject } from "tsarch";
import path from "node:path";
import fs from "node:fs";

/**
 * Vertical Slice: valida aderência ao diagrama PlantUML se ele existir.
 * Pula o teste se src/ ou o diagrama não existirem.
 */
describe("Analytics Service - Vertical Slice", () => {
  jest.setTimeout(60000);

  const diagram = path.resolve(__dirname, "docs", "components.puml");
  const srcDir = path.resolve(__dirname, "..", "features/analytics");

  it("aderência ao diagrama (se existir features/analytics e components.puml)", async () => {
    if (!fs.existsSync(srcDir) || !fs.existsSync(diagram)) return;
    const rule = await slicesOfProject()
      .definedBy("features/analytics/(**)/")
      .should()
      .adhereToDiagramInFile(diagram);
    await expect(rule).toPassAsync();
  });
});