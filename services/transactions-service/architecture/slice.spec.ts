import "tsarch/dist/jest";
import { slicesOfProject } from "tsarch";
import path from "node:path";
import fs from "node:fs";

describe("Transactions Service - Vertical Slice", () => {
  jest.setTimeout(60000);

  const diagram = path.resolve(__dirname, "docs", "components.puml");
  const srcDir = path.resolve(__dirname, "..", "features/transations");

  it("aderência ao diagrama (se existir features/transations/ e components.puml)", async () => {
    if (!fs.existsSync(srcDir) || !fs.existsSync(diagram)) return;
    const rule = await slicesOfProject()
      .definedBy("features/transations/(**)/")
      .should()
      .adhereToDiagramInFile(diagram);
    await expect(rule).toPassAsync();
  });
});