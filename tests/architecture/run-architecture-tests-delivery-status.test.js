const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function main() {
  marksFailedMountedTestcaseElementsAsNotDelivered();
  treatsStructuralRelationshipsAsSourceToTargetDeliveryDependencies();
}

function marksFailedMountedTestcaseElementsAsNotDelivered() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-runner-delivery-'));
  fs.mkdirSync(path.join(tempRoot, 'design', 'KG'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'tests'), { recursive: true });

  fs.writeFileSync(path.join(tempRoot, 'tests', 'pass.js'), '', 'utf8');
  fs.writeFileSync(path.join(tempRoot, 'tests', 'fail.js'), 'process.exit(1);\n', 'utf8');

  const graphPath = path.join(tempRoot, 'design', 'KG', 'SystemArchitecture.json');
  fs.writeFileSync(graphPath, JSON.stringify({
    name: 'SystemArchitecture',
    elements: [
      {
        id: 'passed',
        name: 'Passed Element',
        type: 'Application Component',
        testcases: [
          {
            name: 'AT-PASS',
            type: 'Acceptance Test',
            description: 'A passing testcase.',
            acceptanceCriteria: 'tests/pass.js',
          },
        ],
      },
      {
        id: 'failed',
        name: 'Failed Element',
        type: 'Application Component',
        testcases: [
          {
            name: 'AT-FAIL',
            type: 'Acceptance Test',
            description: 'A failing testcase.',
            acceptanceCriteria: 'tests/fail.js',
          },
        ],
      },
      {
        id: 'untested',
        name: 'Untested Element',
        type: 'Application Component',
      },
    ],
    relationships: [],
  }, null, 2), 'utf8');

  const result = spawnSync(process.execPath, [
    path.join(repoRoot, '.argo', 'scripts', 'runArchitectureTests.js'),
  ], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ARGO_REPO_ROOT: tempRoot,
    },
    encoding: 'utf8',
  });

  assert.notStrictEqual(result.status, 0, 'runner exits non-zero when any testcase fails');

  const updatedGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  assert.strictEqual(readDeliveryStatus(updatedGraph, 'passed'), 'delivered');
  assert.strictEqual(readDeliveryStatus(updatedGraph, 'failed'), 'not_delivered');
  assert.strictEqual(readDeliveryStatus(updatedGraph, 'untested'), undefined);
}

function treatsStructuralRelationshipsAsSourceToTargetDeliveryDependencies() {
  assertStructuralRelationshipAllowsDelivery('Composition');
  assertStructuralRelationshipAllowsDelivery('Aggregation');
}

function assertStructuralRelationshipAllowsDelivery(relationshipType) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `argo-runner-${relationshipType.toLowerCase()}-delivery-`));
  fs.mkdirSync(path.join(tempRoot, 'design', 'KG'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'tests'), { recursive: true });

  fs.writeFileSync(path.join(tempRoot, 'tests', 'pass.js'), '', 'utf8');

  const graphPath = path.join(tempRoot, 'design', 'KG', 'SystemArchitecture.json');
  fs.writeFileSync(graphPath, JSON.stringify({
    name: 'SystemArchitecture',
    elements: [
      {
        id: 'whole',
        name: 'Whole Element',
        type: 'Application Component',
        testcases: [
          {
            name: 'AT-WHOLE',
            type: 'Acceptance Test',
            description: 'A passing whole testcase.',
            acceptanceCriteria: 'tests/pass.js',
          },
        ],
      },
      {
        id: 'part',
        name: 'Part Element',
        type: 'Application Component',
        testcases: [
          {
            name: 'AT-PART',
            type: 'Acceptance Test',
            description: 'A passing part testcase.',
            acceptanceCriteria: 'tests/pass.js',
          },
        ],
      },
    ],
    relationships: [
      {
        id: `whole-${relationshipType.toLowerCase()}-part`,
        name: relationshipType,
        type: relationshipType,
        statement: `Whole Element --(${relationshipType})--> Part Element`,
        source_id: 'whole',
        target_id: 'part',
        source_name: 'Whole Element',
        target_name: 'Part Element',
      },
    ],
  }, null, 2), 'utf8');

  const result = spawnSync(process.execPath, [
    path.join(repoRoot, '.argo', 'scripts', 'runArchitectureTests.js'),
  ], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ARGO_REPO_ROOT: tempRoot,
    },
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 0, result.stderr);

  const updatedGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  assert.strictEqual(readDeliveryStatus(updatedGraph, 'part'), 'delivered');
  assert.strictEqual(readDeliveryStatus(updatedGraph, 'whole'), 'delivered');
}

function readDeliveryStatus(graph, elementId) {
  const element = graph.elements.find(candidate => candidate.id === elementId);
  const attribute = (element.attributes || []).find(candidate => candidate.name === 'deliveryStatus');
  return attribute && attribute.value;
}

main();
