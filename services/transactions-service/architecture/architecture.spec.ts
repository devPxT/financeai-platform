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
    if (!(has("features/transactions/domain") && has("features/transactions/interface"))) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/transactions/interface");

    await expect(rule).toPassAsync();
  });

  it("domain não deve depender de infrastructure", async () => {
    if (!(has("features/transactions/domain") && has("features/transactions/infrastructure"))) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/transactions/infrastructure");

    await expect(rule).toPassAsync();
  });

  it("application não deve depender de interface", async () => {
    if (!(has("features/transactions/application") && has("features/transactions/interface"))) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/transactions/interface");

    await expect(rule).toPassAsync();
  });

  it("application não deve depender de infrastructure", async () => {
    if (!(has("features/transactions/application") && has("features/transactions/infrastructure"))) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/application")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/transactions/infrastructure");

    await expect(rule).toPassAsync();
  });

  it("interface não deve depender de infrastructure", async () => {
    if (!(has("features/transactions/interface") && has("features/transactions/infrastructure"))) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/interface")
      .shouldNot()
      .dependOnFiles()
      .inFolder("features/transactions/infrastructure");

    await expect(rule).toPassAsync();
  });

  it("domain deve ser livre de ciclos", async () => {
    if (!has("features/transactions/domain")) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/domain")
      .should()
      .beFreeOfCycles();

    await expect(rule).toPassAsync();
  });

  it("application deve ser livre de ciclos", async () => {
    if (!has("features/transactions/application")) return;

    const rule = filesOfProject()
      .inFolder("features/transactions/application")
      .should()
      .beFreeOfCycles();

    await expect(rule).toPassAsync();
  });
});