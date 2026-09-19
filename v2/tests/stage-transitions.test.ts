import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as E from "../src/engine";

/** Execute the real presentation reconciler with minimal rendering doubles; no DOM or GPU. */
function stageHarness() {
  const source = readFileSync(
    new URL("../src/stage.ts", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (id: string) =>
      id === "phaser" ? { Scene: class {} } : { IMAGE_ASSETS: {} },
    matchMedia: () => ({ matches: false }),
    setTimeout,
    clearTimeout,
  });
  const stage = new module.exports.BattleStage({ play() {} }, () => {});
  stage.ready = true;
  stage.backdrop = {
    setTexture() {
      return this;
    },
    setDisplaySize() {
      return this;
    },
  };
  const created: string[] = [],
    destroyed: string[] = [];
  stage.makeActor = (u: E.Unit) => {
    created.push(u.id);
    stage.actors.set(u.id, {
      setPosition() {
        return this;
      },
      setAlpha() {
        return this;
      },
      destroy() {
        destroyed.push(u.id);
      },
    });
    stage.sprites.set(u.id, { setTint() {} });
    stage.rings.set(u.id, { setAlpha() {} });
  };
  stage.pose = () => {};
  return { stage, created, destroyed };
}

test("importing another formation into the same encounter rebuilds actor identities", () => {
  const { stage, created, destroyed } = stageHarness();
  const original = E.createGame(43);
  E.embark(original, "Original");
  E.chooseRoute(original, "sentries");
  stage.sync(original);
  const imported = E.createGame(44);
  imported.party[0] = E.hero("barbarian", 1);
  E.embark(imported, "Imported");
  E.chooseRoute(imported, "sentries");
  assert.equal(imported.run, original.run);
  assert.equal(imported.floor, original.floor);
  assert.doesNotThrow(() => stage.sync(imported));
  assert.ok(created.includes("barbarian"));
  assert.ok(destroyed.includes("fighter"));
  assert.equal(stage.actors.has("fighter"), false);
});

test("ordinary combat state updates reuse actors and leaving combat tears them down", () => {
  const { stage, created, destroyed } = stageHarness();
  const s = E.createGame();
  E.embark(s, "Stage");
  E.chooseRoute(s, "sentries");
  stage.sync(s);
  const count = created.length;
  s.party[0].hp = 0;
  stage.sync(s);
  assert.equal(created.length, count);
  assert.equal(destroyed.length, 0);
  s.screen = "summary";
  stage.sync(s);
  assert.equal(destroyed.length, count);
  assert.equal(stage.actors.size, 0);
});
