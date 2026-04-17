import * as vscode from 'vscode';
import ignore, { type Ignore } from 'ignore';
import * as path from 'path';
import { CodeSymbolNode } from './types';

// File extensions we consider as analysable source code.
const SOURCE_GLOBS = '**/*.{ts,js,tsx,jsx,py,java,cs,go,rb,rs,kt,cpp,c,h,hpp}';

/**
 * Collect all source-file URIs in the workspace (or a given subset).
 */
export async function resolveSourceUris(
    targetUris: vscode.Uri[],
): Promise<vscode.Uri[]> {
    if (targetUris.length > 0) {
        const expanded = await expandTargetUris(targetUris);
        return filterGitIgnoredUris(expanded);
    }
    // No explicit targets → scan entire workspace.
    const files = await vscode.workspace.findFiles(SOURCE_GLOBS, '**/node_modules/**', 500);
    return filterGitIgnoredUris(files);
}

async function expandTargetUris(targetUris: vscode.Uri[]): Promise<vscode.Uri[]> {
    const collected = new Map<string, vscode.Uri>();

    for (const targetUri of targetUris) {
        try {
            const stat = await vscode.workspace.fs.stat(targetUri);
            if ((stat.type & vscode.FileType.Directory) !== 0) {
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(targetUri.fsPath, SOURCE_GLOBS),
                    '**/node_modules/**',
                    500,
                );
                for (const file of files) {
                    collected.set(file.toString(), file);
                }
                continue;
            }
        } catch {
            // Fall through and keep the original URI when stat fails.
        }

        collected.set(targetUri.toString(), targetUri);
    }

    return Array.from(collected.values());
}

async function filterGitIgnoredUris(uris: vscode.Uri[]): Promise<vscode.Uri[]> {
    const matcherCache = new Map<string, Promise<Ignore>>();
    const filtered: vscode.Uri[] = [];

    for (const uri of uris) {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) {
            filtered.push(uri);
            continue;
        }

        let matcherPromise = matcherCache.get(folder.uri.toString());
        if (!matcherPromise) {
            matcherPromise = loadGitIgnoreMatcher(folder.uri);
            matcherCache.set(folder.uri.toString(), matcherPromise);
        }

        const matcher = await matcherPromise;
        const relativePath = path.relative(folder.uri.fsPath, uri.fsPath).split(path.sep).join('/');
        if (!relativePath || relativePath.startsWith('..')) {
            filtered.push(uri);
            continue;
        }

        if (!matcher.ignores(relativePath)) {
            filtered.push(uri);
        }
    }

    return filtered;
}

async function loadGitIgnoreMatcher(workspaceRoot: vscode.Uri): Promise<Ignore> {
    const matcher = ignore();
    const gitIgnoreUri = vscode.Uri.joinPath(workspaceRoot, '.gitignore');

    try {
        const content = await vscode.workspace.fs.readFile(gitIgnoreUri);
        matcher.add(Buffer.from(content).toString('utf8'));
    } catch {
        // No .gitignore is fine; fall back to an empty matcher.
    }

    return matcher;
}

/**
 * Use `vscode.executeDocumentSymbolProvider` to retrieve hierarchical
 * symbols from a single file URI.
 */
async function getDocumentSymbols(
    uri: vscode.Uri,
): Promise<vscode.DocumentSymbol[]> {
    const result = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        uri,
    );
    return result ?? [];
}

/**
 * Use `vscode.prepareCallHierarchy` + `vscode.provideOutgoingCalls`
 * to resolve outgoing calls for a given position.
 */
async function getOutgoingCalls(
    uri: vscode.Uri,
    position: vscode.Position,
): Promise<string[]> {
    try {
        const items = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>(
            'vscode.prepareCallHierarchy',
            uri,
            position,
        );
        if (!items || items.length === 0) return [];

        const outgoing = await vscode.commands.executeCommand<vscode.CallHierarchyOutgoingCall[]>(
            'vscode.provideOutgoingCalls',
            items[0],
        );
        return (outgoing ?? []).map(c => c.to.name);
    } catch {
        // Call hierarchy not supported for this language / position — that's fine.
        return [];
    }
}

/**
 * Use `vscode.provideIncomingCalls` to resolve incoming callers.
 */
async function getIncomingCalls(
    uri: vscode.Uri,
    position: vscode.Position,
): Promise<string[]> {
    try {
        const items = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>(
            'vscode.prepareCallHierarchy',
            uri,
            position,
        );
        if (!items || items.length === 0) return [];

        const incoming = await vscode.commands.executeCommand<vscode.CallHierarchyIncomingCall[]>(
            'vscode.provideIncomingCalls',
            items[0],
        );
        return (incoming ?? []).map(c => c.from.name);
    } catch {
        return [];
    }
}

/**
 * Interesting symbol kinds that we want to include in the topology.
 * Filters out variables, constants, fields etc. that are too granular.
 */
const INTERESTING_KINDS = new Set<vscode.SymbolKind>([
    vscode.SymbolKind.Class,
    vscode.SymbolKind.Interface,
    vscode.SymbolKind.Function,
    vscode.SymbolKind.Method,
    vscode.SymbolKind.Constructor,
    vscode.SymbolKind.Module,
    vscode.SymbolKind.Enum,
    vscode.SymbolKind.Struct,
]);

/**
 * Flatten a hierarchy of DocumentSymbols into a list, keeping only
 * "interesting" kinds. Methods/constructors carry their parent class
 * name as a prefix.
 */
function flattenSymbols(
    symbols: vscode.DocumentSymbol[],
    parentPrefix: string = '',
): Array<{ name: string; kind: vscode.SymbolKind; range: vscode.Range }> {
    const result: Array<{ name: string; kind: vscode.SymbolKind; range: vscode.Range }> = [];
    for (const sym of symbols) {
        const qualifiedName = parentPrefix ? `${parentPrefix}.${sym.name}` : sym.name;
        if (INTERESTING_KINDS.has(sym.kind)) {
            result.push({ name: qualifiedName, kind: sym.kind, range: sym.range });
        }
        // Recurse into children (e.g. methods inside a class).
        if (sym.children?.length) {
            result.push(
                ...flattenSymbols(sym.children, qualifiedName),
            );
        }
    }
    return result;
}

/**
 * Read the source text for a given range from a TextDocument.
 */
function extractSourceText(doc: vscode.TextDocument, range: vscode.Range): string {
    return doc.getText(range);
}

/**
 * Build a full CodeSymbolNode[] topology for the given URIs.
 *
 * For each file:
 *   1. Get document symbols via LSP.
 *   2. Flatten to interesting kinds.
 *   3. Read source text.
 *   4. Resolve outgoing / incoming call edges.
 */
export async function collectTopologyFromUris(
    uris: vscode.Uri[],
    token: vscode.CancellationToken,
): Promise<CodeSymbolNode[]> {
    const nodes: CodeSymbolNode[] = [];

    for (const uri of uris) {
        if (token.isCancellationRequested) break;

        let doc: vscode.TextDocument;
        try {
            doc = await vscode.workspace.openTextDocument(uri);
        } catch {
            // Binary file or cannot open — skip.
            continue;
        }

        const rawSymbols = await getDocumentSymbols(uri);
        const flat = flattenSymbols(rawSymbols);

        for (const sym of flat) {
            if (token.isCancellationRequested) break;

            const sourceText = extractSourceText(doc, sym.range);
            const startPos = sym.range.start;

            const [callees, callers] = await Promise.all([
                getOutgoingCalls(uri, startPos),
                getIncomingCalls(uri, startPos),
            ]);

            nodes.push({
                name: sym.name,
                kind: sym.kind,
                uri,
                range: sym.range,
                callees,
                callers,
                sourceText,
            });
        }
    }

    return nodes;
}
