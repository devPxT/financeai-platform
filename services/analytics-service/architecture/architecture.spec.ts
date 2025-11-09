import "tsarch/dist/jest";
import { filesOfProject } from "tsarch";
import fs from "node:fs";
import path from "node:path";

/**
 * Regras Clean Architecture (src/*):
 * - domain não depende de interface/infrastructure
 * - application não depende de interface/infrastructure
 * - interface não depende de infrastructure
 * - domain e application livres de ciclos
 *
 * Se alguma pasta não existir ainda (migração gradual), o teste retorna sem erro.
 */

describe("Analytics Service - Arquitetura (tsarch)", () => {
  jest.setTimeout(60000);

  const ROOT = path.resolve(__dirname, "..");
  const has = (rel: string) => fs.existsSync(path.join(ROOT, rel));
  const project = () => filesOfProject(); // usa tsconfig.json da raiz

  it("domain não deve depender de interface", async () => {
    if (!(has("src/domain") && has("src/interface"))) return;
    const rule = project()
      .inFolder("src/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/interface");
    await expect(rule).toPassAsync();
  });

  it("domain não deve depender de infrastructure", async () => {
    if (!(has("src/domain") && has("src/infrastructure"))) return;
    const rule = project()
      .inFolder("src/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure");
    await expect(rule).toPassAsync();
  });

  it("application não deve depender de interface", async () => {
    if (!(has("src/application") && has("src/interface"))) return;
    const rule = project()
      .inFolder("src/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/interface");
    await expect(rule).toPassAsync();
  });

  it("application não deve depender de infrastructure", async () => {
    if (!(has("src/application") && has("src/infrastructure"))) return;
    const rule = project()
      .inFolder("src/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure");
    await expect(rule).toPassAsync();
  });

  it("interface não deve depender de infrastructure", async () => {
    if (!(has("src/interface") && has("src/infrastructure"))) return;
    const rule = project()
      .inFolder("src/interface")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure");
    await expect(rule).toPassAsync();
  });

  it("domain livre de ciclos", async () => {
    if (!has("src/domain")) return;
    const rule = project()
      .inFolder("src/domain")
      .should()
      .beFreeOfCycles();
    await expect(rule).toPassAsync();
  });

  it("application livre de ciclos", async () => {
    if (!has("src/application")) return;
    const rule = project()
      .inFolder("src/application")
      .should()
      .beFreeOfCycles();
    await expect(rule).toPassAsync();
  });
});