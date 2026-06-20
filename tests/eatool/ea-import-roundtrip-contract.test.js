const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const importScriptPath = path.join(repoRoot, 'eatool', 'EA-jsscript', 'import_system_architecture_json_to_ea.js');
const exportScriptPath = path.join(repoRoot, 'eatool', 'EA-jsscript', 'project_auto_gen_suitable_for_LLM-V2.js');
const architecturePath = path.join(repoRoot, 'design', 'SystemArchitecture.json');

const importScript = fs.readFileSync(importScriptPath, 'utf8');
const exportScript = fs.readFileSync(exportScriptPath, 'utf8');
const architecture = JSON.parse(fs.readFileSync(architecturePath, 'utf8'));

assert(architecture.elements.some(element => element.id === '1244' && element.type === 'System Software'));
assert(architecture.elements.some(element => element.id === '1246' && element.type === 'Constraint'));
assert(architecture.elements.some(element => element.id === '1247' && element.type === 'Constraint'));
assert.strictEqual(architecture.relationships.length, 14);

for (const relationshipId of ['1107', '1108', '1109', '1110']) {
  assert(
    architecture.relationships.some(relationship => relationship.id === relationshipId),
    `Expected source architecture to contain relationship ${relationshipId}`,
  );
}

assertIncludes(importScript, "return 'ArchiMate_SystemSoftware';");
assertIncludes(importScript, "return 'ArchiMate_Constraint';");
assertIncludes(importScript, "setStyleJsonToken(diagram.StyleEx, 'schema_included_elements_json', viewData.included_elements || []);");
assertIncludes(importScript, "setStyleJsonToken(diagram.StyleEx, 'schema_included_relationships_json', viewData.included_relationships || []);");
assertIncludes(importScript, "putTag(connector.TaggedValues, 'schema_id', data.id);");
assertIncludes(importScript, "putTag(connector.TaggedValues, 'archimate_relationship_type', canonicalArchimateType(relationshipType));");
assertIncludes(importScript, "putJsonTag(pkgElement.TaggedValues, 'schema_relationships_json', graph.relationships || []);");
assertIncludes(importScript, "putJsonTag(pkgElement.TaggedValues, 'schema_views_json', graph.views || []);");

assertIncludes(exportScript, 'var schemaArchimateType = getElementTag(ele, "archimate_type");');
assertIncludes(exportScript, 'var schemaIncludedElementsJson = getDiagramTag(currentDiagram, "schema_included_elements_json");');
assertIncludes(exportScript, 'var schemaIncludedRelationshipsJson = getDiagramTag(currentDiagram, "schema_included_relationships_json");');
assertIncludes(exportScript, 'rootRelationshipsJson = packageElement != null ? getElementTag(packageElement, "schema_relationships_json") : "";');
assertIncludes(exportScript, 'rootViewsJson = packageElement != null ? getElementTag(packageElement, "schema_views_json") : "";');
assertIncludes(exportScript, 'if (rootRelationshipsJson != "" && rootRelationshipsJson != "[]")');
assertIncludes(exportScript, 'if (rootViewsJson != "" && rootViewsJson != "[]")');

function assertIncludes(content, expected) {
  assert(
    content.includes(expected),
    `Expected file content to include: ${expected}`,
  );
}
