const assert = require('node:assert');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const argo = require(path.join(repoRoot, '.argo', 'scripts', 'argo-mcp-server.js'));

const TARGET_ID = 'bp-autoalign-goal';
const ORIGINAL_DESCRIPTION = 'Accepted BusinessPartner SMART problem: intent-architecture writes are not business-successful until embedding generation, durable semantic projection, touched-record queryability, global coherence, and readiness alignment complete for Element, ArchitectureRelationship, and View channels; ordinary semantic queries automatically align and retry once when readiness is unaligned; Agent workflows do not depend on manual lifecycle command awareness.';

async function main() {
  const rounds = Number.parseInt(process.env.BP_AUTOALIGN_PRESSURE_ROUNDS || '5', 10);
  assert(Number.isInteger(rounds) && rounds > 0, 'BP_AUTOALIGN_PRESSURE_ROUNDS_INVALID');

  const observations = [];
  for (let index = 0; index < rounds; index += 1) {
    const token = `MCP_PRESSURE_SUPPORT_${process.pid}_${Date.now()}_${index}`;
    observations.push(await runRound(token));
  }

  console.log(JSON.stringify({
    status: 'passed',
    rounds: observations.length,
    observations,
  }, null, 2));
}

async function runRound(token) {
  let restored = false;
  try {
    const write = parseToolPayload(await argo.callTool('updateArchitectureElement', {
      id: TARGET_ID,
      patch: {
        description: `${token} ${ORIGINAL_DESCRIPTION}`,
      },
    }));
    assertAlignedWrite(write, `write:${token}`);

    const query = parseToolPayload(await argo.callTool('getSystemArchitecture', {
      query: {
        purpose: 'implementation-design',
        intent: token,
      },
    }));
    assert.strictEqual(query.status, 'passed', `BP_AUTOALIGN_PRESSURE_QUERY_FAILED:${token}`);
    assert(
      JSON.stringify(query).includes(token),
      `BP_AUTOALIGN_PRESSURE_QUERY_TOKEN_MISSING:${token}`,
    );

    const restore = parseToolPayload(await argo.callTool('updateArchitectureElement', {
      id: TARGET_ID,
      patch: {
        description: ORIGINAL_DESCRIPTION,
      },
    }));
    restored = true;
    assertAlignedWrite(restore, `restore:${token}`);

    return {
      token,
      writeBusinessComplete: write.businessComplete,
      queryStatus: query.status,
      restoreBusinessComplete: restore.businessComplete,
    };
  } finally {
    if (!restored) {
      await argo.callTool('updateArchitectureElement', {
        id: TARGET_ID,
        patch: {
          description: ORIGINAL_DESCRIPTION,
        },
      });
    }
  }
}

function assertAlignedWrite(payload, label) {
  assert.strictEqual(payload.status, 'passed', `BP_AUTOALIGN_PRESSURE_WRITE_STATUS:${label}`);
  assert.strictEqual(payload.written, true, `BP_AUTOALIGN_PRESSURE_WRITE_NOT_APPLIED:${label}`);
  assert.strictEqual(payload.businessComplete, true, `BP_AUTOALIGN_PRESSURE_NOT_BUSINESS_COMPLETE:${label}`);
  assert.strictEqual(
    payload.embeddingLifecycle && payload.embeddingLifecycle.state,
    'Aligned',
    `BP_AUTOALIGN_PRESSURE_LIFECYCLE_NOT_ALIGNED:${label}`,
  );
  assert.strictEqual(
    payload.alignment && payload.alignment.state,
    'Aligned',
    `BP_AUTOALIGN_PRESSURE_ALIGNMENT_NOT_ALIGNED:${label}`,
  );
  assert.deepStrictEqual(
    payload.alignment && payload.alignment.missingChannels,
    [],
    `BP_AUTOALIGN_PRESSURE_MISSING_CHANNELS:${label}`,
  );
}

function parseToolPayload(result) {
  assert(result && Array.isArray(result.content), 'BP_AUTOALIGN_PRESSURE_RESULT_SHAPE_INVALID');
  return JSON.parse(result.content[0].text);
}

main().then(
  () => process.exit(0),
  error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  },
);
