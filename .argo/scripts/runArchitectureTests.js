const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const repoRoot = process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
const PYTHON_EXECUTABLE = resolvePythonExecutable(repoRoot);
const DEFAULT_ARCHITECTURE_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const FAILURE_RECORDS_PATH = 'design/KG/test-failure-records.json';
const DEFAULT_TEST_TIMEOUT_MS = 120000;
const TEST_TIMEOUT_MS = readPositiveInteger(process.env.ARGO_TEST_TIMEOUT_MS, DEFAULT_TEST_TIMEOUT_MS);
const SUPPORTED_TEST_SCRIPT_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.py', '.ps1', '.cmd', '.bat']);
const DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS = [
    /[\r\n]/,
    /[|&;<>]/,
    /^['"].*['"]$/,
    /^(?:npm|pnpm|yarn|npx|node|python|py|powershell|pwsh|cmd|bash|sh)\b/i,
];

async function main() {
    const architecturePath = normalizeRelativePath(process.argv[2] || DEFAULT_ARCHITECTURE_GRAPH_PATH);
    let summary;
    try {
        summary = await runArchitectureTests(repoRoot, architecturePath);
    } catch (error) {
        console.error(`Argo architecture test execution failed: ${String(error && error.stack ? error.stack : error)}`);
        process.exit(1);
    }

    printSummary(summary);
    if (summary.failedCount > 0) {
        process.exit(1);
    }
}

async function runArchitectureTests(workspaceRoot, architecturePath) {
    const resolvedArchitecturePath = normalizeRelativePath(architecturePath || DEFAULT_ARCHITECTURE_GRAPH_PATH);
    const graphPath = path.join(workspaceRoot, ...resolvedArchitecturePath.split('/'));
    const graph = await readArchitectureGraph(graphPath);
    const explicitTestcases = collectExplicitTestcases(graph);
    const results = [];
    const failureRecords = [];

    for (const [index, testcase] of explicitTestcases.entries()) {
        logTestcaseStart(index, explicitTestcases.length, testcase);
        const resolvedScriptPath = testcase.acceptanceCriteria
            ? normalizeRelativePath(testcase.acceptanceCriteria)
            : '';

        if (!testcase.acceptanceCriteria) {
            const result = buildExecutionResult({
                testcase,
                resolvedScriptPath: '',
                executionCommand: '',
                status: 'missing-criteria',
                exitCode: null,
                durationMs: 0,
                stdout: '',
                stderr: 'acceptanceCriteria is empty',
            });
            results.push(result);
            logTestcaseFinish(index, explicitTestcases.length, result);
            failureRecords.push(toFailedTestRecord(result));
            continue;
        }

        const validation = validateAcceptanceCriteria(resolvedScriptPath);
        if (!validation.valid) {
            const result = buildExecutionResult({
                testcase,
                resolvedScriptPath,
                executionCommand: '',
                status: 'invalid-criteria',
                exitCode: null,
                durationMs: 0,
                stdout: '',
                stderr: validation.reason || 'acceptanceCriteria must be a direct script file path',
            });
            results.push(result);
            logTestcaseFinish(index, explicitTestcases.length, result);
            failureRecords.push(toFailedTestRecord(result));
            continue;
        }

        const parsedAcceptanceCriteria = parseAcceptanceCriteria(resolvedScriptPath);
        const executionCommand = buildExecutionCommandPreview(parsedAcceptanceCriteria);
        const scriptPath = path.join(workspaceRoot, ...parsedAcceptanceCriteria.scriptRelativePath.split('/'));
        if (!fs.existsSync(scriptPath)) {
            const result = buildExecutionResult({
                testcase,
                resolvedScriptPath,
                executionCommand,
                status: 'missing-file',
                exitCode: null,
                durationMs: 0,
                stdout: '',
                stderr: `test script not found: ${resolvedScriptPath}`,
            });
            results.push(result);
            logTestcaseFinish(index, explicitTestcases.length, result);
            failureRecords.push(toFailedTestRecord(result));
            continue;
        }

        const start = Date.now();
        const execution = await executeAcceptanceScript(parsedAcceptanceCriteria, workspaceRoot, scriptPath);
        const passed = execution.exitCode === 0;
        const result = buildExecutionResult({
            testcase,
            resolvedScriptPath,
            executionCommand,
            status: passed ? 'passed' : 'failed',
            exitCode: execution.exitCode,
            durationMs: Date.now() - start,
            stdout: execution.stdout,
            stderr: execution.stderr,
        });
        results.push(result);
        logTestcaseFinish(index, explicitTestcases.length, result);
        if (!passed) {
            failureRecords.push(toFailedTestRecord(result));
        }
    }

    await writeFailureRecords(workspaceRoot, failureRecords);

    const deliveryChanges = refreshDeliveryStatus(graph, results);
    if (deliveryChanges.length > 0) {
        await writeArchitectureGraph(graphPath, graph);
        console.log(`[DELIVERY] Refreshed delivery status: ${deliveryChanges.length} element(s) changed`);
        for (const change of deliveryChanges) {
            console.log(`[DELIVERY]   ${change.id} "${change.name}" → ${change.deliveryStatus}`);
        }
    }

    return {
        architecturePath: resolvedArchitecturePath,
        failureRecordsPath: FAILURE_RECORDS_PATH,
        totalTestCases: explicitTestcases.length,
        passedCount: results.filter(result => result.passed).length,
        failedCount: failureRecords.length,
        missingCriteriaCount: results.filter(result => result.status === 'missing-criteria').length,
        deliveryChanges,
        results,
        failureRecords,
    };
}

async function readArchitectureGraph(graphPath) {
    try {
        return JSON.parse(await fs.promises.readFile(graphPath, 'utf8'));
    } catch (error) {
        throw new Error(`Failed to read architecture graph: ${graphPath}. ${String(error)}`);
    }
}

function buildExecutionResult(input) {
    return {
        testcaseName: input.testcase.testcaseName,
        testDescription: input.testcase.testDescription,
        acceptanceCriteria: input.testcase.acceptanceCriteria,
        elementId: input.testcase.elementId,
        resolvedScriptPath: input.resolvedScriptPath,
        executionCommand: input.executionCommand,
        status: input.status,
        passed: input.status === 'passed',
        exitCode: input.exitCode,
        durationMs: input.durationMs,
        stdout: input.stdout,
        stderr: input.stderr,
    };
}

async function writeFailureRecords(workspaceRoot, records) {
    const targetPath = path.join(workspaceRoot, ...FAILURE_RECORDS_PATH.split('/'));
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
}

function toFailedTestRecord(result) {
    return {
        testcasename: result.testcaseName,
        testdescription: result.testDescription,
        acceptanceCriteria: result.acceptanceCriteria,
        relatedIntentElementId: result.elementId,
        status: result.status,
        resolvedScriptPath: result.resolvedScriptPath,
        executionCommand: result.executionCommand,
        exitCode: result.exitCode,
        failureError: buildFailureError(result),
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function buildFailureError(result) {
    const stderr = result.stderr.trim();
    if (stderr) {
        return stderr;
    }
    const stdout = result.stdout.trim();
    if (stdout) {
        return stdout;
    }
    if (result.exitCode !== null) {
        return `Command exited with code ${result.exitCode}`;
    }
    return `Test status: ${result.status}`;
}

async function executeAcceptanceScript(criteria, cwd, scriptPath) {
    if (criteria.selector) {
        return runPythonPytestNodeId(criteria, cwd);
    }

    const extension = path.extname(scriptPath).toLowerCase();
    switch (extension) {
        case '.js':
        case '.cjs':
        case '.mjs':
            return runCommand(process.execPath, [scriptPath], cwd);
        case '.py':
            return runCommand(PYTHON_EXECUTABLE, [scriptPath], cwd);
        case '.ps1':
            return runCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], cwd);
        case '.cmd':
        case '.bat':
            return runCommand(scriptPath, [], cwd);
        default:
            return runCommand(scriptPath, [], cwd);
    }
}

async function runPythonPytestNodeId(criteria, cwd) {
    return runCommand(PYTHON_EXECUTABLE, ['-m', 'pytest', buildPytestNodeId(criteria)], cwd);
}

function resolvePythonExecutable(workspaceRoot) {
    const candidates = process.platform === 'win32'
        ? [
            path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe'),
            path.join(workspaceRoot, 'venv', 'Scripts', 'python.exe'),
        ]
        : [
            path.join(workspaceRoot, '.venv', 'bin', 'python'),
            path.join(workspaceRoot, 'venv', 'bin', 'python'),
        ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return 'python';
}

async function runCommand(command, args, cwd) {
    try {
        const { stdout, stderr } = await execFileAsync(command, args, {
            cwd,
            windowsHide: true,
            maxBuffer: 1024 * 1024 * 10,
            timeout: TEST_TIMEOUT_MS,
        });
        return {
            exitCode: 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
        };
    } catch (error) {
        const timedOut = error && (error.killed || error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT');
        return {
            exitCode: typeof error.code === 'number' ? error.code : 1,
            stdout: String(error.stdout || '').trim(),
            stderr: timedOut
                ? `Command timed out after ${TEST_TIMEOUT_MS}ms: ${formatCommand(command, args)}`
                : String(error.stderr || error.message || error).trim(),
        };
    }
}

function validateAcceptanceCriteria(value) {
    if (!value) {
        return { valid: false, reason: 'acceptanceCriteria is empty' };
    }

    for (const pattern of DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS) {
        if (pattern.test(value)) {
            return {
                valid: false,
                reason: 'acceptanceCriteria must be a single workspace-relative test entry only, without extra command wrappers or arguments',
            };
        }
    }

    const parsed = parseAcceptanceCriteria(value);
    const extension = path.extname(parsed.scriptRelativePath).toLowerCase();
    if (!SUPPORTED_TEST_SCRIPT_EXTENSIONS.has(extension)) {
        return {
            valid: false,
            reason: `acceptanceCriteria must point to a single executable script file (${Array.from(SUPPORTED_TEST_SCRIPT_EXTENSIONS).join(', ')})`,
        };
    }

    if (parsed.selector && extension !== '.py') {
        return {
            valid: false,
            reason: 'only Python pytest node ids like tests/test_x.py::test_y are supported when acceptanceCriteria includes :: selectors',
        };
    }

    if (parsed.selector && !parsed.selector.trim()) {
        return {
            valid: false,
            reason: 'pytest node id selectors cannot be empty',
        };
    }

    return { valid: true };
}

function parseAcceptanceCriteria(value) {
    const [scriptRelativePath, ...selectorParts] = value.split('::');
    return {
        scriptRelativePath: normalizeRelativePath(scriptRelativePath),
        selector: selectorParts.length > 0 ? selectorParts.join('::').trim() : undefined,
    };
}

function buildPytestNodeId(criteria) {
    return criteria.selector
        ? `${criteria.scriptRelativePath}::${criteria.selector}`
        : criteria.scriptRelativePath;
}

function buildExecutionCommandPreview(criteria) {
    if (criteria.selector) {
        return formatCommand('python', ['-m', 'pytest', buildPytestNodeId(criteria)]);
    }

    const scriptPath = criteria.scriptRelativePath;
    const extension = path.extname(scriptPath).toLowerCase();
    switch (extension) {
        case '.js':
        case '.cjs':
        case '.mjs':
            return formatCommand(process.execPath, [scriptPath]);
        case '.py':
            return formatCommand('python', [scriptPath]);
        case '.ps1':
            return formatCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
        case '.cmd':
        case '.bat':
            return formatCommand(scriptPath, []);
        default:
            return formatCommand(scriptPath, []);
    }
}

function formatCommand(command, args) {
    return [quoteCommandPart(command), ...args.map(quoteCommandPart)].join(' ');
}

function quoteCommandPart(value) {
    return /\s/.test(value) ? `"${value}"` : value;
}

function collectExplicitTestcases(graph) {
    const testcases = [];
    for (const element of graph.elements || []) {
        const elementId = String(element.id || '');
        for (const testcase of element.testcases || []) {
            testcases.push({
                elementId,
                testcaseName: String(testcase.name || ''),
                testDescription: String(testcase.description || ''),
                acceptanceCriteria: String(testcase.acceptanceCriteria || '').trim(),
            });
        }
    }
    return testcases;
}

function normalizeRelativePath(value) {
    return String(value).replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function readPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(String(value || ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function logTestcaseStart(index, total, testcase) {
    const label = formatTestcaseLabel(index, total, testcase.testcaseName);
    console.log(`[START] ${label}`);
    console.log(`        script: ${testcase.acceptanceCriteria || '(missing acceptanceCriteria)'}`);
}

function logTestcaseFinish(index, total, result) {
    const label = formatTestcaseLabel(index, total, result.testcaseName);
    const exitCode = result.exitCode === null ? 'n/a' : String(result.exitCode);
    console.log(`[END]   ${label}`);
    console.log(`        result: ${result.status}; exitCode=${exitCode}; durationMs=${result.durationMs}`);
    console.log(`        command: ${result.executionCommand || '(n/a)'}`);
    if (result.stderr) {
        console.log(`        stderr: ${truncateSingleLine(result.stderr)}`);
    } else if (result.stdout) {
        console.log(`        stdout: ${truncateSingleLine(result.stdout)}`);
    }
    console.log(`[PROGRESS] ${JSON.stringify(buildProgressPayload(index, total, result))}`);
}

function buildProgressPayload(index, total, result) {
    return {
        index,
        total,
        testcaseName: result.testcaseName,
        testDescription: result.testDescription,
        elementId: result.elementId,
        acceptanceCriteria: result.acceptanceCriteria,
        resolvedScriptPath: result.resolvedScriptPath,
        executionCommand: result.executionCommand,
        status: result.status,
        passed: result.passed,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
    };
}

function formatTestcaseLabel(index, total, testcaseName) {
    return `[${index + 1}/${total}] ${testcaseName || '(unnamed testcase)'}`;
}

function truncateSingleLine(value) {
    const singleLine = String(value).replace(/\s+/g, ' ').trim();
    return singleLine.length > 240 ? `${singleLine.slice(0, 237)}...` : singleLine;
}

function printSummary(summary) {
    console.log(`Argo architecture tests from: ${summary.architecturePath}`);
    console.log(`Failure records: ${summary.failureRecordsPath}`);
    console.log(`Total: ${summary.totalTestCases}; Passed: ${summary.passedCount}; Failed or missing: ${summary.failedCount}; Missing acceptanceCriteria: ${summary.missingCriteriaCount}`);
    for (const result of summary.results) {
        const exitCode = result.exitCode === null ? 'n/a' : String(result.exitCode);
        console.log(`- ${result.testcaseName || '(unnamed testcase)'}: ${result.status} | ${result.resolvedScriptPath || '(missing)'} | ${result.executionCommand || '(n/a)'} | exitCode: ${exitCode}`);
    }
    console.log(JSON.stringify(summary, null, 2));
}

async function writeArchitectureGraph(graphPath, graph) {
    await fs.promises.writeFile(graphPath, JSON.stringify(graph, null, 2) + '\n', 'utf8');
}

// --- Delivery Status Refresh (hard guardrail: computed by test runner, not by agents) ---

/**
 * Dependency direction for delivery:
 * For element X, its upstream dependencies = elements X needs to be delivered first.
 * Mirrors resolveSemanticEdges from systemarchitecture-mcp-server.js.
 *
 *   - Access, Assignment, Specialization: source depends on target
 *   - Serving, Realization, Flow, Triggering, Influence: target depends on source
 *   - Composition, Aggregation: both directions are dependencies
 */
const DEPENDENCY_TYPES_SOURCE_DEPENDS_ON_TARGET = new Set(['Access', 'Assignment', 'Specialization']);
const DEPENDENCY_TYPES_TARGET_DEPENDS_ON_SOURCE = new Set(['Serving', 'Realization', 'Flow', 'Triggering', 'Influence']);
const DEPENDENCY_TYPES_BIDIRECTIONAL = new Set(['Composition', 'Aggregation']);

/**
 * Resolve upstream dependencies for a single element.
 * Returns the set of element IDs that this element depends on.
 */
function resolveUpstreamDependencies(elementId, relationships) {
    const dependencies = new Set();
    for (const rel of relationships || []) {
        const sourceId = String(rel.source_id || rel.source || '');
        const targetId = String(rel.target_id || rel.target || '');
        const relType = String(rel.type || '');

        if (elementId === sourceId && elementId === targetId) continue;

        if (DEPENDENCY_TYPES_BIDIRECTIONAL.has(relType)) {
            if (elementId === sourceId) dependencies.add(targetId);
            if (elementId === targetId) dependencies.add(sourceId);
            continue;
        }

        if (DEPENDENCY_TYPES_SOURCE_DEPENDS_ON_TARGET.has(relType) && elementId === sourceId) {
            dependencies.add(targetId);
            continue;
        }

        if (DEPENDENCY_TYPES_TARGET_DEPENDS_ON_SOURCE.has(relType) && elementId === targetId) {
            dependencies.add(sourceId);
        }
    }
    return dependencies;
}

/**
 * Refresh delivery status for all elements based on test results and dependency topology.
 * An element is "delivered" when:
 *   1. It has at least one testcase AND all its testcases passed
 *   2. All its upstream dependencies are also "delivered"
 *
 * Processes iteratively until fixed point to handle transitive dependency chains.
 * Returns the list of elements whose delivery status changed.
 */
function refreshDeliveryStatus(graph, testResults) {
    if (!graph || !graph.elements) return [];

    // Build test-results map: elementId → { allPassed, hasTestcases }
    const testResultByElement = new Map();
    for (const result of testResults) {
        const eid = String(result.elementId || '');
        if (!testResultByElement.has(eid)) {
            testResultByElement.set(eid, { allPassed: true, hasTestcases: false });
        }
        const entry = testResultByElement.get(eid);
        entry.hasTestcases = true;
        if (!result.passed) {
            entry.allPassed = false;
        }
    }

    // Build upstream dependency map for all elements
    const upstreamDeps = new Map();
    for (const element of graph.elements) {
        const eid = String(element.id || '');
        upstreamDeps.set(eid, resolveUpstreamDependencies(eid, graph.relationships));
    }

    // Current delivery status from graph (stored in attributes array per schema)
    const deliveryStatus = new Map();
    for (const element of graph.elements) {
        const eid = String(element.id || '');
        const attr = (element.attributes || []).find(a => a.name === 'deliveryStatus');
        deliveryStatus.set(eid, attr ? attr.value : '');
    }

    // Iterate to fixed point
    const changes = [];
    let changed = true;
    while (changed) {
        changed = false;
        for (const element of graph.elements) {
            const eid = String(element.id || '');
            if (deliveryStatus.get(eid) === 'delivered') continue;

            const testInfo = testResultByElement.get(eid);
            // Only mark elements that have testcases
            if (!testInfo || !testInfo.hasTestcases) continue;
            if (!testInfo.allPassed) continue;

            // Check all upstream deps are delivered
            const deps = upstreamDeps.get(eid) || new Set();
            let allDepsDelivered = true;
            for (const depId of deps) {
                if (deliveryStatus.get(depId) !== 'delivered') {
                    allDepsDelivered = false;
                    break;
                }
            }
            if (!allDepsDelivered) continue;

            // Mark as delivered — store in attributes array (schema-compliant, per .argo/schema/)
            if (!element.attributes) element.attributes = [];
            const existing = element.attributes.find(a => a.name === 'deliveryStatus');
            if (existing) {
                existing.value = 'delivered';
            } else {
                element.attributes.push({ name: 'deliveryStatus', value: 'delivered' });
            }
            deliveryStatus.set(eid, 'delivered');
            changes.push({ id: eid, name: element.name, deliveryStatus: 'delivered' });
            changed = true;
        }
    }

    return changes;
}

main();
