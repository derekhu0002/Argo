import fs from 'node:fs';
import path from 'node:path';
import { tool } from '@opencode-ai/plugin';

const HANDOFF_STAGES = ['intent-to-implementation', 'implementation-to-coding'];
const SYSTEM_ARCHITECTURE_SCRIPT_CANDIDATES = [
    '.opencode/validator/script/validateSystemArchitecture.js',
    'plugins/.opencode/validator/script/validateSystemArchitecture.js',
    'plugins/opencode/validator/script/validateSystemArchitecture.js',
    'scripts/validateSystemArchitecture.js',
];
const STAGE_HANDOFF_SCRIPT_CANDIDATES = [
    '.opencode/validator/script/validateStageHandoff.js',
    'plugins/.opencode/validator/script/validateStageHandoff.js',
    'plugins/opencode/validator/script/validateStageHandoff.js',
    'scripts/validateStageHandoff.js',
];

function resolveWorkspaceRoot(context) {
    return process.env.ARGO_REPO_ROOT || context.worktree || context.directory || process.cwd();
}

function resolveScriptPath(workspaceRoot, candidates) {
    for (const relativePath of candidates) {
        const absolutePath = path.join(workspaceRoot, relativePath);
        if (fs.existsSync(absolutePath)) {
            return { absolutePath, relativePath };
        }
    }

    throw new Error(`Unable to locate validator script. Checked: ${candidates.join(', ')}`);
}

async function runValidatorScript(
    workspaceRoot,
    candidates,
    args,
) {
    if (typeof Bun === 'undefined' || typeof Bun.spawn !== 'function') {
        throw new Error('This tool requires the Bun runtime because opencode loads custom tools with Bun.');
    }

    const { absolutePath, relativePath } = resolveScriptPath(workspaceRoot, candidates);
    const command = ['node', absolutePath, ...args];
    const processHandle = Bun.spawn({
        cmd: command,
        cwd: workspaceRoot,
        env: {
            ...process.env,
            ARGO_REPO_ROOT: workspaceRoot,
        },
        stdout: 'pipe',
        stderr: 'pipe',
    });

    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(processHandle.stdout).text(),
        new Response(processHandle.stderr).text(),
        processHandle.exited,
    ]);

    return {
        workspaceRoot,
        scriptPath: relativePath,
        command,
        exitCode,
        status: exitCode === 0 ? 'passed' : 'failed',
        stdout: stdout.trim(),
        stderr: stderr.trim(),
    };
}

function normalizeStage(stage) {
    if (!stage) {
        return undefined;
    }

    if (!HANDOFF_STAGES.includes(stage)) {
        throw new Error(`Unsupported handoff stage '${stage}'. Expected one of: ${HANDOFF_STAGES.join(', ')}`);
    }

    return stage;
}

export const validateSystemArchitecture = tool({
    description: 'Run the Argo SystemArchitecture validator from the local opencode validator bundle.',
    args: {},
    async execute(_args, context) {
        return runValidatorScript(
            resolveWorkspaceRoot(context),
            SYSTEM_ARCHITECTURE_SCRIPT_CANDIDATES,
            [],
        );
    },
});

export const validateStageHandoff = tool({
    description: 'Run the Argo stage handoff validator from the local opencode validator bundle.',
    args: {
        stage: tool.schema.string().optional().describe(`Optional handoff stage to validate. Supported values: ${HANDOFF_STAGES.join(', ')}. Omit to validate all supported stages.`),
    },
    async execute(args, context) {
        const stage = normalizeStage(args.stage);
        return runValidatorScript(
            resolveWorkspaceRoot(context),
            STAGE_HANDOFF_SCRIPT_CANDIDATES,
            stage ? [stage] : [],
        );
    },
});