import fs from 'node:fs';
import path from 'node:path';
import { tool } from '@opencode-ai/plugin';

const HANDOFF_STAGES = ['intent-to-implementation', 'implementation-to-coding'] as const;

type ToolContext = {
    directory?: string;
    worktree?: string;
};

function resolveWorkspaceRoot(context: ToolContext): string {
    return context.worktree || context.directory || process.cwd();
}

function resolveScriptPath(workspaceRoot: string, candidates: string[]): { absolutePath: string; relativePath: string } {
    for (const relativePath of candidates) {
        const absolutePath = path.join(workspaceRoot, relativePath);
        if (fs.existsSync(absolutePath)) {
            return { absolutePath, relativePath };
        }
    }

    throw new Error(`Unable to locate validator script. Checked: ${candidates.join(', ')}`);
}

async function runValidatorScript(
    workspaceRoot: string,
    candidates: string[],
    args: string[],
): Promise<{
    workspaceRoot: string;
    scriptPath: string;
    command: string[];
    exitCode: number;
    status: 'passed' | 'failed';
    stdout: string;
    stderr: string;
}> {
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

export const validateSystemArchitecture = tool({
    description: 'Run the Argo SystemArchitecture validator from the local opencode validator bundle.',
    args: {},
    async execute(_args, context) {
        return runValidatorScript(
            resolveWorkspaceRoot(context),
            [
                '.opencode/validator/script/validateSystemArchitecture.js',
            ],
            [],
        );
    },
});

export const validateStageHandoff = tool({
    description: 'Run the Argo stage handoff validator from the local opencode validator bundle.',
    args: {
        stage: tool.schema.enum(HANDOFF_STAGES).optional().describe('Optional handoff stage to validate. Omit to validate all supported stages.'),
    },
    async execute(args, context) {
        return runValidatorScript(
            resolveWorkspaceRoot(context),
            [
                '.opencode/validator/script/validateStageHandoff.js',
            ],
            args.stage ? [args.stage] : [],
        );
    },
});