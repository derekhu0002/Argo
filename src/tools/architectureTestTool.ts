import { execFile } from 'child_process';
import * as path from 'path';
import { TextDecoder, TextEncoder } from 'util';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

export const ARGO_TEST_TOOL_NAME = 'argo-test';
export const DEFAULT_ARCHITECTURE_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
export const FAILURE_RECORDS_PATH = 'design/KG/test-failure-records.json';

type TestStatus = 'passed' | 'failed' | 'missing-criteria' | 'invalid-criteria' | 'missing-file';

interface RawArchitectureGraph {
    elements?: RawArchitectureElement[];
}

interface RawArchitectureElement {
    id?: unknown;
    testcases?: RawArchitectureTestcase[];
}

interface RawArchitectureTestcase {
    name?: unknown;
    description?: unknown;
    acceptanceCriteria?: unknown;
}

export interface ArchitectureTestToolInput {
    architecturePath?: string;
}

export interface FailedTestRecord {
    testcasename: string;
    testdescription: string;
    acceptanceCriteria: string;
    relatedIntentElementId: string;
    status: Exclude<TestStatus, 'passed'>;
    resolvedScriptPath: string;
    executionCommand: string;
    exitCode: number | null;
    failureError: string;
    stdout: string;
    stderr: string;
}

export interface ArchitectureTestExecutionResult {
    testcaseName: string;
    testDescription: string;
    acceptanceCriteria: string;
    elementId: string;
    resolvedScriptPath: string;
    executionCommand: string;
    status: TestStatus;
    passed: boolean;
    exitCode: number | null;
    durationMs: number;
    stdout: string;
    stderr: string;
}

export interface ArchitectureTestRunSummary {
    architecturePath: string;
    failureRecordsPath: string;
    totalTestCases: number;
    passedCount: number;
    failedCount: number;
    missingCriteriaCount: number;
    results: ArchitectureTestExecutionResult[];
    failureRecords: FailedTestRecord[];
}

export interface ArchitectureTestProgressUpdate {
    currentIndex: number;
    totalTestCases: number;
    testcaseName: string;
    resolvedScriptPath: string;
    executionCommand: string;
    status: 'running' | TestStatus;
}

interface CommandExecutionResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
}

interface AcceptanceCriteriaValidationResult {
    valid: boolean;
    reason?: string;
}

interface ParsedAcceptanceCriteria {
    scriptRelativePath: string;
    selector?: string;
}

const SUPPORTED_TEST_SCRIPT_EXTENSIONS = new Set([
    '.js',
    '.cjs',
    '.mjs',
    '.py',
    '.ps1',
    '.cmd',
    '.bat',
]);

const DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS = [
    /[\r\n]/,
    /[|&;<>]/,
    /^['"].*['"]$/,
    /^(?:npm|pnpm|yarn|npx|node|python|py|powershell|pwsh|cmd|bash|sh)\b/i,
];

export function registerArchitectureTestTool(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.lm.registerTool(ARGO_TEST_TOOL_NAME, new ArchitectureTestTool()));
}

export class ArchitectureTestTool implements vscode.LanguageModelTool<ArchitectureTestToolInput> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ArchitectureTestToolInput>,
        _token: vscode.CancellationToken,
    ): Promise<vscode.PreparedToolInvocation> {
        const architecturePath = normalizeRelativePath(options.input.architecturePath || DEFAULT_ARCHITECTURE_GRAPH_PATH);
        return {
            invocationMessage: `Running architecture tests from ${architecturePath}`,
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ArchitectureTestToolInput>,
        token: vscode.CancellationToken,
    ): Promise<vscode.LanguageModelToolResult> {
        const summary = await runArchitectureTests(options.input.architecturePath, token);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(JSON.stringify(summary)),
        ]);
    }
}

export async function runArchitectureTests(
    architecturePath: string | undefined,
    token: vscode.CancellationToken,
    onProgress?: (update: ArchitectureTestProgressUpdate) => void | Promise<void>,
): Promise<ArchitectureTestRunSummary> {
    const root = workspaceRoot();
    const resolvedArchitecturePath = normalizeRelativePath(architecturePath || DEFAULT_ARCHITECTURE_GRAPH_PATH);
    const graphUri = toWorkspaceUri(root, resolvedArchitecturePath);
    const graph = await readArchitectureGraph(graphUri);
    const totalTestCases = countTestCases(graph);

    const results: ArchitectureTestExecutionResult[] = [];
    const failureRecords: FailedTestRecord[] = [];
    let currentIndex = 0;

    for (const element of graph.elements ?? []) {
        const elementId = String(element.id ?? '');
        for (const testcase of element.testcases ?? []) {
            throwIfCancelled(token);
            currentIndex += 1;
            const testcaseName = String(testcase.name ?? '');
            const testDescription = String(testcase.description ?? '');
            const acceptanceCriteria = String(testcase.acceptanceCriteria ?? '').trim();
            const resolvedScriptPath = acceptanceCriteria
                ? normalizeRelativePath(acceptanceCriteria)
                : '';

            if (!acceptanceCriteria) {
                const result: ArchitectureTestExecutionResult = {
                    testcaseName,
                    testDescription,
                    acceptanceCriteria,
                    elementId,
                    resolvedScriptPath: '',
                    executionCommand: '',
                    status: 'missing-criteria',
                    passed: false,
                    exitCode: null,
                    durationMs: 0,
                    stdout: '',
                    stderr: 'acceptanceCriteria is empty',
                };
                results.push(result);
                await onProgress?.({
                    currentIndex,
                    totalTestCases,
                    testcaseName,
                    resolvedScriptPath: '',
                    executionCommand: '',
                    status: result.status,
                });
                failureRecords.push(toFailedTestRecord(result));
                continue;
            }

            const validation = validateAcceptanceCriteria(resolvedScriptPath);
            if (!validation.valid) {
                const result: ArchitectureTestExecutionResult = {
                    testcaseName,
                    testDescription,
                    acceptanceCriteria,
                    elementId,
                    resolvedScriptPath,
                    executionCommand: '',
                    status: 'invalid-criteria',
                    passed: false,
                    exitCode: null,
                    durationMs: 0,
                    stdout: '',
                    stderr: validation.reason ?? 'acceptanceCriteria must be a direct script file path',
                };
                results.push(result);
                await onProgress?.({
                    currentIndex,
                    totalTestCases,
                    testcaseName,
                    resolvedScriptPath,
                    executionCommand: '',
                    status: result.status,
                });
                failureRecords.push(toFailedTestRecord(result));
                continue;
            }

            const parsedAcceptanceCriteria = parseAcceptanceCriteria(resolvedScriptPath);
            const executionCommand = buildExecutionCommandPreview(parsedAcceptanceCriteria);

            await onProgress?.({
                currentIndex,
                totalTestCases,
                testcaseName,
                resolvedScriptPath,
                executionCommand,
                status: 'running',
            });

            const scriptUri = toWorkspaceUri(root, parsedAcceptanceCriteria.scriptRelativePath);
            const scriptExists = await fileExists(scriptUri);
            if (!scriptExists) {
                const result: ArchitectureTestExecutionResult = {
                    testcaseName,
                    testDescription,
                    acceptanceCriteria,
                    elementId,
                    resolvedScriptPath,
                    executionCommand,
                    status: 'missing-file',
                    passed: false,
                    exitCode: null,
                    durationMs: 0,
                    stdout: '',
                    stderr: `test script not found: ${resolvedScriptPath}`,
                };
                results.push(result);
                await onProgress?.({
                    currentIndex,
                    totalTestCases,
                    testcaseName,
                    resolvedScriptPath,
                    executionCommand,
                    status: result.status,
                });
                failureRecords.push(toFailedTestRecord(result));
                continue;
            }

            const start = Date.now();
            const execution = await executeAcceptanceScript(parsedAcceptanceCriteria, root.fsPath, scriptUri.fsPath);
            const passed = execution.exitCode === 0;
            const result: ArchitectureTestExecutionResult = {
                testcaseName,
                testDescription,
                acceptanceCriteria,
                elementId,
                resolvedScriptPath,
                executionCommand,
                status: passed ? 'passed' : 'failed',
                passed,
                exitCode: execution.exitCode,
                durationMs: Date.now() - start,
                stdout: execution.stdout,
                stderr: execution.stderr,
            };
            results.push(result);
            await onProgress?.({
                currentIndex,
                totalTestCases,
                testcaseName,
                resolvedScriptPath,
                executionCommand,
                status: result.status,
            });
            if (!passed) {
                failureRecords.push(toFailedTestRecord(result));
            }
        }
    }

    await writeFailureRecords(root, failureRecords);

    const passedCount = results.filter(result => result.passed).length;
    const missingCriteriaCount = results.filter(result => result.status === 'missing-criteria').length;

    return {
        architecturePath: resolvedArchitecturePath,
        failureRecordsPath: FAILURE_RECORDS_PATH,
        totalTestCases,
        passedCount,
        failedCount: failureRecords.length,
        missingCriteriaCount,
        results,
        failureRecords,
    };
}

async function readArchitectureGraph(graphUri: vscode.Uri): Promise<RawArchitectureGraph> {
    try {
        const bytes = await vscode.workspace.fs.readFile(graphUri);
        const parsed = JSON.parse(new TextDecoder('utf-8').decode(bytes)) as RawArchitectureGraph;
        return parsed;
    } catch (error) {
        throw new Error(`Failed to read architecture graph: ${graphUri.fsPath}. ${String(error)}`);
    }
}

async function writeFailureRecords(root: vscode.Uri, records: FailedTestRecord[]): Promise<void> {
    const targetUri = toWorkspaceUri(root, FAILURE_RECORDS_PATH);
    const targetDir = vscode.Uri.joinPath(root, 'design', 'KG');
    await vscode.workspace.fs.createDirectory(targetDir);
    const content = JSON.stringify(records, null, 2) + '\n';
    await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(content));
}

function toFailedTestRecord(result: ArchitectureTestExecutionResult): FailedTestRecord {
    return {
        testcasename: result.testcaseName,
        testdescription: result.testDescription,
        acceptanceCriteria: result.acceptanceCriteria,
        relatedIntentElementId: result.elementId,
        status: result.status as Exclude<TestStatus, 'passed'>,
        resolvedScriptPath: result.resolvedScriptPath,
        executionCommand: result.executionCommand,
        exitCode: result.exitCode,
        failureError: buildFailureError(result),
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function buildFailureError(result: ArchitectureTestExecutionResult): string {
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

async function executeAcceptanceScript(
    criteria: ParsedAcceptanceCriteria,
    cwd: string,
    scriptPath: string,
): Promise<CommandExecutionResult> {
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
            return runCommand('python', [scriptPath], cwd);
        case '.ps1':
            return runCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], cwd);
        case '.cmd':
        case '.bat':
            return runCommand(scriptPath, [], cwd);
        default:
            return runCommand(scriptPath, [], cwd);
    }
}

async function runPythonPytestNodeId(
    criteria: ParsedAcceptanceCriteria,
    cwd: string,
): Promise<CommandExecutionResult> {
    return runCommand('python', ['-m', 'pytest', buildPytestNodeId(criteria)], cwd);
}

async function runCommand(command: string, args: string[], cwd: string): Promise<CommandExecutionResult> {
    try {
        const { stdout, stderr } = await execFileAsync(command, args, {
            cwd,
            windowsHide: true,
            maxBuffer: 1024 * 1024 * 10,
        });
        return {
            exitCode: 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
        };
    } catch (error) {
        const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number | string };
        return {
            exitCode: typeof failure.code === 'number' ? failure.code : 1,
            stdout: String(failure.stdout ?? '').trim(),
            stderr: String(failure.stderr ?? failure.message ?? error).trim(),
        };
    }
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}

function workspaceRoot(): vscode.Uri {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!folder) {
        throw new Error('No workspace folder is open. Please open a folder first.');
    }
    return folder;
}

function toWorkspaceUri(root: vscode.Uri, relativePath: string): vscode.Uri {
    return vscode.Uri.joinPath(root, ...relativePath.split('/'));
}

function normalizeRelativePath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function validateAcceptanceCriteria(value: string): AcceptanceCriteriaValidationResult {
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

function parseAcceptanceCriteria(value: string): ParsedAcceptanceCriteria {
    const [scriptRelativePath, ...selectorParts] = value.split('::');
    const normalizedScriptPath = normalizeRelativePath(scriptRelativePath);
    const selector = selectorParts.length > 0 ? selectorParts.join('::').trim() : undefined;
    return {
        scriptRelativePath: normalizedScriptPath,
        selector,
    };
}

function buildPytestNodeId(criteria: ParsedAcceptanceCriteria): string {
    return criteria.selector
        ? `${criteria.scriptRelativePath}::${criteria.selector}`
        : criteria.scriptRelativePath;
}

function buildExecutionCommandPreview(criteria: ParsedAcceptanceCriteria): string {
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

function formatCommand(command: string, args: string[]): string {
    return [quoteCommandPart(command), ...args.map(quoteCommandPart)].join(' ');
}

function quoteCommandPart(value: string): string {
    return /\s/.test(value) ? `"${value}"` : value;
}

function countTestCases(graph: RawArchitectureGraph): number {
    return (graph.elements ?? []).reduce((total, element) => total + (element.testcases?.length ?? 0), 0);
}

function throwIfCancelled(token: vscode.CancellationToken): void {
    if (token.isCancellationRequested) {
        throw new vscode.CancellationError();
    }
}