import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import type { BusinessSummary, TraceabilityMatrix } from '../engine/types';

// ── Convention-over-Configuration paths ────────────────────────────
const DESIGN_DIR = 'design';
const INTENT_FILE = `${DESIGN_DIR}/architecture-intent.puml`;
const IMPL_FILE = `${DESIGN_DIR}/implementation-uml.puml`;
const SYMBOL_SUMMARIES_FILE = `${DESIGN_DIR}/symbol-summaries.md`;
const TRACEABILITY_MATRIX_FILE = `${DESIGN_DIR}/traceability-matrix.md`;

/** Resolve the workspace root (first folder). Throws if no workspace is open. */
function workspaceRoot(): vscode.Uri {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        throw new Error('No workspace folder is open. Please open a folder first.');
    }
    return folders[0].uri;
}

/** Absolute URI of the intent architecture file. */
export function intentUri(): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot(), INTENT_FILE);
}

/** Absolute URI of the implementation UML file. */
export function implUri(): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot(), IMPL_FILE);
}

/** Absolute URI of the symbol summaries file. */
export function symbolSummariesUri(): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot(), SYMBOL_SUMMARIES_FILE);
}

/** Absolute URI of the traceability matrix file. */
export function traceabilityMatrixUri(): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot(), TRACEABILITY_MATRIX_FILE);
}

/**
 * Read `design/architecture-intent.puml` and return its text content.
 * Throws a user-friendly error when the file does not exist.
 */
export async function readIntentArchitecture(): Promise<string> {
    const uri = intentUri();
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        return new TextDecoder('utf-8').decode(bytes);
    } catch {
        throw new Error(
            `找不到意图架构文件: ${INTENT_FILE}\n` +
            '请在工作区根目录创建 design/architecture-intent.puml 后重试。',
        );
    }
}

/**
 * Write PlantUML text to `design/implementation-uml.puml`.
 * Creates the `design/` directory if it doesn't exist.
 */
export async function writeImplementationUml(plantUml: string): Promise<vscode.Uri> {
    const root = workspaceRoot();
    // Ensure the design directory exists
    const designDir = vscode.Uri.joinPath(root, DESIGN_DIR);
    await vscode.workspace.fs.createDirectory(designDir);

    const uri = vscode.Uri.joinPath(root, IMPL_FILE);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(plantUml));
    return uri;
}

/**
 * Write symbol summaries to `design/symbol-summaries.md`.
 * Creates the `design/` directory if it doesn't exist.
 */
export async function writeSymbolSummaries(summaries: BusinessSummary[]): Promise<vscode.Uri> {
    const root = workspaceRoot();
    const designDir = vscode.Uri.joinPath(root, DESIGN_DIR);
    await vscode.workspace.fs.createDirectory(designDir);

    const lines: string[] = [
        '# Symbol Summaries',
        '',
        '| Symbol | Stereotype | Business Effect |',
        '|--------|-----------|-----------------|',
    ];

    for (const summary of summaries) {
        const symbolName = escapeMarkdownCell(summary.symbolName);
        const stereotypes = escapeMarkdownCell(summary.stereotypes.join(', ') || '—');
        const effectSummary = escapeMarkdownCell(summary.effectSummary || '—');
        lines.push(`| ${symbolName} | ${stereotypes} | ${effectSummary} |`);
    }

    lines.push('');

    const uri = vscode.Uri.joinPath(root, SYMBOL_SUMMARIES_FILE);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(lines.join('\n')));
    return uri;
}

/**
 * Write the traceability matrix to `design/traceability-matrix.md`.
 * Creates the `design/` directory if it doesn't exist.
 */
export async function writeTraceabilityMatrix(matrix: TraceabilityMatrix): Promise<vscode.Uri> {
    const root = workspaceRoot();
    const designDir = vscode.Uri.joinPath(root, DESIGN_DIR);
    await vscode.workspace.fs.createDirectory(designDir);

    const lines: string[] = [
        '# Traceability Matrix',
        '',
        `Generated at: ${matrix.generatedAt.toISOString()}`,
        '',
        '| ArchiMate Component | Code Elements | Confidence | Rationale |',
        '|---------------------|---------------|------------|-----------|',
    ];

    for (const entry of matrix.entries) {
        const intentComponent = escapeMarkdownCell(entry.intentComponent);
        const codeElements = escapeMarkdownCell(entry.codeElements.join(', ') || '—');
        const confidence = `${Math.round(entry.confidence * 100)}%`;
        const rationale = escapeMarkdownCell(entry.rationale || '—');
        lines.push(`| ${intentComponent} | ${codeElements} | ${confidence} | ${rationale} |`);
    }

    lines.push('');

    const uri = vscode.Uri.joinPath(root, TRACEABILITY_MATRIX_FILE);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(lines.join('\n')));
    return uri;
}

function escapeMarkdownCell(value: string): string {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br/>');
}
