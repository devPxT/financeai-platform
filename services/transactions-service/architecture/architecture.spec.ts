import "tsarch/dist/jest";
import { filesOfProject } from "tsarch";
import fs from "node:fs";
import path from "node:path";

/**
 * Regras Clean Architecture só para src/*:
 * - domain não depende de interface nem de infrastructure
 * - application não depende de interface nem de infrastructure
 * - interface não depende de infrastructure
 * - domain e application livres de ciclos
 */
describe("Transactions Service - Arquitetura (tsarch)", () => {
  jest.setTimeout(60000);

  const ROOT = path.resolve(__dirname, "..");
  const has = (rel: string) => fs.existsSync(path.join(ROOT, rel));

  it("domain não deve depender de interface", async () => {
    if (!(has("src/domain") && has("src/interface"))) return;

    const rule = filesOfProject()
      .inFolder("src/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/interface");

    await expect(rule).toPassAsync();
  });

  it("domain não deve depender de infrastructure", async () => {
    if (!(has("src/domain") && has("src/infrastructure"))) return;

    const rule = filesOfProject()
      .inFolder("src/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure");

    await expect(rule).toPassAsync();
  });

  it("application não deve depender de interface", async () => {
    if (!(has("src/application") && has("src/interface"))) return;

    const rule = filesOfProject()
      .inFolder("src/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/interface");

    await expect(rule).toPassAsync();
  });

  it("application não deve depender de infrastructure", async () => {
    if (!(has("src/application") && has("src/infrastructure"))) return;

    const rule = filesOfProject()
      .inFolder("src/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure");

    await expect(rule).toPassAsync();
  });

  it("interface não deve depender de infrastructure", async () => {
    if (!(has("src/interface") && has("src/infrastructure"))) return;

    const rule = filesOfProject()
      .inFolder("src/interface")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure");

    await expect(rule).toPassAsync();
  });

  it("domain deve ser livre de ciclos", async () => {
    if (!has("src/domain")) return;

    const rule = filesOfProject()
      .inFolder("src/domain")
      .should()
      .beFreeOfCycles();

    await expect(rule).toPassAsync();
  });

  it("application deve ser livre de ciclos", async () => {
    if (!has("src/application")) return;

    const rule = filesOfProject()
      .inFolder("src/application")
      .should()
      .beFreeOfCycles();

    await expect(rule).toPassAsync();
  });
});