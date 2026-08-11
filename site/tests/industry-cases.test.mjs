import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(siteRoot, "industry-cases-src");
const publicRoot = path.join(siteRoot, "public", "industry-cases");

function read(filePath) {
  assert.ok(fs.existsSync(filePath), `Missing required file: ${filePath}`);
  return fs.readFileSync(filePath, "utf8");
}

test("publishes the complete interactive industry evidence map", () => {
  const appSource = read(path.join(sourceRoot, "AgenticEngineeringEvidenceMap.tsx"));
  const state = JSON.parse(read(path.join(sourceRoot, "canvas-state.json")));
  const html = read(path.join(publicRoot, "index.html"));
  const bundle = read(path.join(publicRoot, "app.js"));
  const styles = read(path.join(publicRoot, "app.css"));

  assert.match(appSource, /Agentic Engineering：从“会写代码”到“可信交付”/);
  assert.match(appSource, /const caseRows = buildCaseRows\(\)/);
  assert.doesNotMatch(appSource, /from ["']cursor\/canvas["']/);
  assert.equal(state["ae-refresh-grade"], "全部");
  assert.equal(state["ae-refresh-concern"], "全部");

  assert.match(html, /<title>业界案例 · ARGO HARNESS<\/title>/);
  assert.match(html, /id="industry-cases-root"/);
  assert.match(html, /href="\/industry-cases\/app\.css"/);
  assert.match(html, /src="\/industry-cases\/app\.js"/);
  assert.match(bundle, /Agentic Engineering/);
  assert.match(bundle, /localStorage/);
  assert.match(styles, /\.ae-table/);
  assert.match(styles, /@media/);
});
