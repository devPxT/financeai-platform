import "tsarch/dist/jest";
import { slicesOfProject } from "tsarch";
import path from "node:path";
import fs from "node:fs";

describe("Transactions Service - Vertical Slice", () => {
  jest.setTimeout(60000);

  const diagram = path.resolve(__dirname, "docs", "components.puml");
  const srcDir = path.resolve(__dirname, "..", "src");

  it("aderência ao diagrama (se existir src/ e components.puml)", async () => {
    if (!fs.existsSync(srcDir) || !fs.existsSync(diagram)) return;
    const rule = await slicesOfProject()
      .definedBy("src/(**)/")
      .should()
      .adhereToDiagramInFile(diagram);
    await expect(rule).toPassAsync();
  });
});