import { tool, type ToolContext, type ToolResult } from '@opencode-ai/plugin';

const systemArchitectureMcp = require('../../scripts/systemarchitecture-mcp-server.js') as {
    callTool(name: string, args?: Record<string, unknown>): Promise<{
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
    }>;
};

function resolveWorkspaceRoot(context: Pick<ToolContext, 'worktree' | 'directory'>): string {
    return process.env.ARGO_REPO_ROOT || context.worktree || context.directory || process.cwd();
}

async function callSystemArchitectureTool(
    context: Pick<ToolContext, 'worktree' | 'directory'>,
    name: string,
    args: Record<string, unknown> = {},
): Promise<ToolResult> {
    const previousRepoRoot = process.env.ARGO_REPO_ROOT;
    process.env.ARGO_REPO_ROOT = resolveWorkspaceRoot(context);

    try {
        const result = await systemArchitectureMcp.callTool(name, args);
        const text = result.content[0]?.text || '{}';
        const metadata = JSON.parse(text) as Record<string, unknown>;
        return {
            title: name,
            output: text,
            metadata,
        };
    } finally {
        if (previousRepoRoot === undefined) {
            delete process.env.ARGO_REPO_ROOT;
        } else {
            process.env.ARGO_REPO_ROOT = previousRepoRoot;
        }
    }
}

function parseMutationsJson(value: string): unknown[] {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
        throw new Error('mutationsJson must parse to an array of mutation objects');
    }
    return parsed;
}

export const getSystemArchitecture = tool({
    description: 'Read the current SystemArchitecture graph without modifying it.',
    args: {
        architecturePath: tool.schema.string().optional().describe('Optional workspace-relative graph path. Defaults to design/KG/SystemArchitecture.json.'),
    },
    async execute(args, context) {
        return callSystemArchitectureTool(context, 'getSystemArchitecture', args);
    },
});

export const validateSystemArchitecture = tool({
    description: 'Validate SystemArchitecture through schema, graph, and ArchiMate mutation-gateway rules.',
    args: {
        architecturePath: tool.schema.string().optional().describe('Optional workspace-relative graph path. Defaults to design/KG/SystemArchitecture.json.'),
    },
    async execute(args, context) {
        return callSystemArchitectureTool(context, 'validateSystemArchitecture', args);
    },
});

export const previewSystemArchitectureMutation = tool({
    description: 'Dry-run SystemArchitecture mutations and return validation errors and summary without writing the graph.',
    args: {
        architecturePath: tool.schema.string().optional().describe('Optional workspace-relative graph path. Defaults to design/KG/SystemArchitecture.json.'),
        mutationsJson: tool.schema.string().describe('JSON array of SystemArchitecture mutation objects.'),
    },
    async execute(args, context) {
        return callSystemArchitectureTool(context, 'previewSystemArchitectureMutation', {
            architecturePath: args.architecturePath,
            mutations: parseMutationsJson(args.mutationsJson),
        });
    },
});

export const applySystemArchitectureMutation = tool({
    description: 'Apply SystemArchitecture mutations only after schema, graph, and ArchiMate checks pass.',
    args: {
        architecturePath: tool.schema.string().optional().describe('Optional workspace-relative graph path. Defaults to design/KG/SystemArchitecture.json.'),
        mutationsJson: tool.schema.string().describe('JSON array of SystemArchitecture mutation objects.'),
    },
    async execute(args, context) {
        return callSystemArchitectureTool(context, 'applySystemArchitectureMutation', {
            architecturePath: args.architecturePath,
            mutations: parseMutationsJson(args.mutationsJson),
        });
    },
});
