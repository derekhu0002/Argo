const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..', '..');
const exporterPath = path.join(
  repoRoot,
  'eatool',
  'EA-jsscript',
  'project_auto_gen_suitable_for_LLM-V2.js',
);

function main() {
  exportsVisibleLinksWithoutGeometry();
  prefersRelationshipsExtractedFromCurrentEaModel();
  prefersViewsExtractedFromCurrentEaModel();
  prefersCurrentDiagramMembershipOverImportedStyleSnapshot();
}

function exportsVisibleLinksWithoutGeometry() {
  const context = loadExporterContext();

  assert.strictEqual(
    context.shouldExportDiagramLink({ IsHidden: false, Geometry: '' }),
    true,
    'a visible EA connector is model data even before EA writes routing geometry',
  );
  assert.strictEqual(
    context.shouldExportDiagramLink({ IsHidden: true, Geometry: 'SX=1;' }),
    false,
    'hidden diagram links remain excluded',
  );
}

function prefersRelationshipsExtractedFromCurrentEaModel() {
  const context = loadExporterContext();
  const extracted = '[{"id":"new-relationship"}]';
  const importedSnapshot = '[{"id":"original-relationship"}]';

  assert.strictEqual(
    context.selectCurrentEaJson(extracted, 1, importedSnapshot),
    extracted,
    'package metadata must not overwrite relationships added or edited in EA',
  );
}

function prefersViewsExtractedFromCurrentEaModel() {
  const context = loadExporterContext();
  const extracted = '[{"view_id":"new-view"}]';
  const importedSnapshot = '[{"view_id":"original-view"}]';

  assert.strictEqual(
    context.selectCurrentEaJson(extracted, 1, importedSnapshot),
    extracted,
    'package metadata must not overwrite views added or edited in EA',
  );
}

function prefersCurrentDiagramMembershipOverImportedStyleSnapshot() {
  const context = loadExporterContext();
  const extracted = ['"original-element"', '"new-element"'];
  const importedSnapshot = ['original-element'];

  assert.deepStrictEqual(
    Array.from(context.selectCurrentEaArray(extracted, importedSnapshot)),
    extracted,
    'diagram StyleEx metadata must not hide elements or relationships added in EA',
  );
}

function loadExporterContext() {
  const script = fs
    .readFileSync(exporterPath, 'utf8')
    .replace(/^!INC .*$/gm, '')
    .replace(/\s+as EA\.[A-Za-z]+/g, '');

  const context = {
    console,
    EA_AUTOGEN_SKIP_MAIN: true,
    Session: {
      Output() {},
    },
  };

  vm.createContext(context);
  vm.runInContext(script, context, { filename: exporterPath });
  return context;
}

main();
