const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const GRAPH_PATH = path.join(REPO_ROOT, 'design', 'KG', 'SystemArchitecture.json');

const AGENTS = [
  'ArchimateLanguagistAudit',
  'BusinessPartner',
  'CleanArchitectureAuditor',
  'CodingAndReparing',
  'ImplementationDesign',
  'IntentionDesign',
  'Orchestrator',
  'ReverseArchitectureExtraction',
  'TaskTidyGraphIntegrator',
  'teacher',
];

const SKILLS = [
  'architecture-diff-plantuml',
  'architecture-drift-recovery',
  'brief',
  'coding-delivery-acceptance',
  'coding-gap-report',
  'delivery-archive',
  'distill-agent-rules',
  'grill-me',
  'guizang-ppt-skill',
  'impl-gap-report',
  'improve-codebase-architecture',
  'market-research',
  'reverse-architecture-extraction',
  'task-emit-afk',
  'task-emit-human-in-the-loop',
  'task-tidy',
];

const RULES = [
  { id: 'harness-rule-viewpoint-first-modeling', file: '.github/copilot-instructions.md' },
  { id: 'harness-rule-coding-delivery-acceptance', file: '.argo/rules/CODING_DELIVERY_ACCEPTANCE.md' },
  { id: 'harness-rule-implementation-design-checklist', file: '.argo/rules/IMPLEMENTATION_DESIGN_CHECKLIST.md' },
  { id: 'harness-rule-intention-design-checklist', file: '.argo/rules/INTENTION_DESIGN_CHECKLIST.md' },
];

const HARNESS_VIEW_IDS = [
  'harness-agent-organization',
  'harness-stage-pipeline',
  'harness-rule-modules',
  'harness-skill-modules-a',
  'harness-skill-modules-b',
  'harness-archgraph-modeling-task',
];

const STAGE_CHAIN = [
  ['harness-role-business-partner', 'harness-role-intention-design'],
  ['harness-role-intention-design', 'harness-role-implementation-design'],
  ['harness-role-implementation-design', 'harness-role-coding-and-repairing'],
];

function readGraph() {
  assert.ok(fs.existsSync(GRAPH_PATH), `graph missing: ${GRAPH_PATH}`);
  return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
}

function attrOf(element, name) {
  const attributes = Array.isArray(element.attributes) ? element.attributes : [];
  const hit = attributes.find(attribute => attribute.name === name);
  return hit ? hit.value : undefined;
}

function elementByTypeAndFile(elements, type, attrName, file) {
  return elements.find(element => (
    element.type === type && attrOf(element, attrName) === file
  ));
}

async function main() {
  // GIVEN the harness defines agents, skills, and rules as files in the repository
  const graph = readGraph();
  const elements = graph.elements;
  const relationships = graph.relationships;
  const views = graph.views;

  // WHEN the intent knowledge graph is read
  // THEN every harness agent is modelled as a Business Role bound to its file
  for (const agent of AGENTS) {
    const file = `.github/agents/${agent}.md`;
    const element = elementByTypeAndFile(elements, 'Business Role', 'agentFile', file);
    assert.ok(element, `HARNESS_AGENT_MISSING: no Business Role with agentFile=${file}`);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, file)), `HARNESS_AGENT_FILE_MISSING: ${file}`);
  }

  // THEN every .github skill is modelled as a Skill bound to its SKILL.md
  for (const skill of SKILLS) {
    const file = `.github/skills/${skill}/SKILL.md`;
    const element = elementByTypeAndFile(elements, 'Skill', 'skillFile', file);
    assert.ok(element, `HARNESS_SKILL_MISSING: no Skill with skillFile=${file}`);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, file)), `HARNESS_SKILL_FILE_MISSING: ${file}`);
  }

  // THEN every repo rule is modelled as a Rule bound to its file
  for (const rule of RULES) {
    const element = elementByTypeAndFile(elements, 'Rule', 'ruleFile', rule.file);
    assert.ok(element, `HARNESS_RULE_MISSING: no Rule with ruleFile=${rule.file}`);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, rule.file)), `HARNESS_RULE_FILE_MISSING: ${rule.file}`);
  }

  // THEN the stage pipeline is expressed as a Triggering chain
  const byId = new Map(elements.map(element => [element.id, element]));
  for (const [sourceId, targetId] of STAGE_CHAIN) {
    const hit = relationships.find(relationship => (
      relationship.type === 'Triggering'
      && relationship.source_id === sourceId
      && relationship.target_id === targetId
    ));
    assert.ok(hit, `HARNESS_STAGE_CHAIN_MISSING: ${sourceId} --Triggering--> ${targetId}`);
    assert.ok(byId.has(sourceId), `HARNESS_STAGE_SOURCE_MISSING: ${sourceId}`);
    assert.ok(byId.has(targetId), `HARNESS_STAGE_TARGET_MISSING: ${targetId}`);
  }

  // THEN every harness view carries an explicit viewpoint binding
  const harnessViews = views.filter(view => HARNESS_VIEW_IDS.includes(view.view_id));
  assert.strictEqual(
    harnessViews.length,
    HARNESS_VIEW_IDS.length,
    `HARNESS_VIEW_COUNT: expected ${HARNESS_VIEW_IDS.length} harness views`,
  );
  for (const view of harnessViews) {
    assert.ok(
      typeof view.description === 'string' && view.description.startsWith('Viewpoint:'),
      `HARNESS_VIEW_UNBOUND: view ${view.view_id} lacks a Viewpoint binding`,
    );
  }

  console.log('HARNESS_GRAPH_MODELING_PASSED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
