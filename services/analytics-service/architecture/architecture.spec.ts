import "tsarch/dist/jest";
import { filesOfProject } from "tsarch";
import fs from "node:fs";
import path from "node:path";

/**
 * Regras Clean Architecture (features/analytics/*):
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
    if (!(has("features/analytics/domain") && has("features/analytics/interface"))) return;
    const rule = project()
      .inFolder("features/analytics/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/analytics/interface");
    await expect(rule).toPassAsync();
  });

  it("domain não deve depender de infrastructure", async () => {
    if (!(has("features/analytics/domain") && has("features/analytics/infrastructure"))) return;
    const rule = project()
      .inFolder("features/analytics/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/analytics/infrastructure");
    await expect(rule).toPassAsync();
  });

  it("application não deve depender de interface", async () => {
    if (!(has("features/analytics/application") && has("features/analytics/interface"))) return;
    const rule = project()
      .inFolder("features/analytics/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/analytics/interface");
    await expect(rule).toPassAsync();
  });

  it("application não deve depender de infrastructure", async () => {
    if (!(has("features/analytics/application") && has("features/analytics/infrastructure"))) return;
    const rule = project()
      .inFolder("features/analytics/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/analytics/infrastructure");
    await expect(rule).toPassAsync();
  });

  it("interface não deve depender de infrastructure", async () => {
    if (!(has("features/analytics/interface") && has("features/analytics/infrastructure"))) return;
    const rule = project()
      .inFolder("features/analytics/interface")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/analytics/infrastructure");
    await expect(rule).toPassAsync();
  });

  it("domain livre de ciclos", async () => {
    if (!has("features/analytics/domain")) return;
    const rule = project()
      .inFolder("features/analytics/domain")
      .should()
      .beFreeOfCycles();
    await expect(rule).toPassAsync();
  });

  it("application livre de ciclos", async () => {
    if (!has("features/analytics/application")) return;
    const rule = project()
      .inFolder("features/analytics/application")
      .should()
      .beFreeOfCycles();
    await expect(rule).toPassAsync();
  });
});