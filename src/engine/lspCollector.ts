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

// ── Container-level symbol kinds (top-level analysis units) ────────────────

const CONTAINER_KINDS = new Set<vscode.SymbolKind>([
    vscode.SymbolKind.Class,
    vscode.SymbolKind.Interface,
    vscode.SymbolKind.Module,
    vscode.SymbolKind.Enum,
    vscode.SymbolKind.Struct,
]);

const CALLABLE_KINDS = new Set<vscode.SymbolKind>([
    vscode.SymbolKind.Method,
    vscode.SymbolKind.Constructor,
    vscode.SymbolKind.Function,
]);

// ── Skeleton helpers ───────────────────────────────────────────────────────

/**
 * Extract the signature of a method / function, stripping the body.
 * Finds the outermost opening `{` (whose matching `}` is at the end)
 * and returns everything before it.
 */
function extractSignature(methodText: string): string {
    const trimmed = methodText.trimEnd();
    if (!trimmed.endsWith('}')) {
        return trimmed.endsWith(';') ? trimmed : trimmed + ';';
    }
    let depth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
        if (trimmed[i] === '}') depth++;
        else if (trimmed[i] === '{') {
            depth--;
            if (depth === 0) {
                return trimmed.slice(0, i).trimEnd() + ';';
            }
        }
    }
    return trimmed + ';';
}

/**
 * Build a lightweight skeleton for a container symbol (class, struct, module).
 * Keeps property declarations and method signatures; removes method bodies.
 */
function buildContainerSkeleton(
    doc: vscode.TextDocument,
    sym: vscode.DocumentSymbol,
): string {
    // Interfaces and enums are already compact — return full text.
    if (sym.kind === vscode.SymbolKind.Interface || sym.kind === vscode.SymbolKind.Enum) {
        return doc.getText(sym.range);
    }

    const fullText = doc.getText(sym.range);
    const braceIdx = fullText.indexOf('{');
    if (braceIdx < 0) {
        return fullText;
    }

    const lines: string[] = [fullText.slice(0, braceIdx + 1).trimEnd()];

    for (const child of sym.children ?? []) {
        const childText = doc.getText(child.range);
        if (
            child.kind === vscode.SymbolKind.Property ||
            child.kind === vscode.SymbolKind.Field ||
            child.kind === vscode.SymbolKind.EnumMember
        ) {
            lines.push('  ' + childText.trim());
        } else if (CALLABLE_KINDS.has(child.kind)) {
            lines.push('  ' + extractSignature(childText));
        } else if (CONTAINER_KINDS.has(child.kind)) {
            // Nested container — include its skeleton indented.
            const nested = buildContainerSkeleton(doc, child);
            for (const nestedLine of nested.split('\n')) {
                lines.push('  ' + nestedLine);
            }
        }
    }

    lines.push('}');
    return lines.join('\n');
}

/**
 * Build a virtual module skeleton from standalone (top-level) functions.
 */
function buildVirtualModuleSkeleton(
    doc: vscode.TextDocument,
    moduleName: string,
    functions: vscode.DocumentSymbol[],
): string {
    const lines: string[] = [`// Module: ${moduleName}`];
    for (const fn of functions) {
        const fnText = doc.getText(fn.range);
        lines.push(extractSignature(fnText));
    }
    return lines.join('\n');
}

/**
 * Derive a module name from a file URI (workspace-relative, no extension).
 */
function fileToModuleName(uri: vscode.Uri): string {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) {
        return path.basename(uri.fsPath, path.extname(uri.fsPath));
    }
    const rel = path.relative(folder.uri.fsPath, uri.fsPath);
    return rel.replace(/\.[^.]+$/, '').split(path.sep).join('/');
}

/**
 * Collect start positions of callable children (methods, constructors, functions).
 */
function collectCallablePositions(sym: vscode.DocumentSymbol): vscode.Position[] {
    return (sym.children ?? [])
        .filter(c => CALLABLE_KINDS.has(c.kind))
        .map(c => c.range.start);
}

/**
 * Collect member names from a container's children.
 */
function collectMemberNames(sym: vscode.DocumentSymbol): string[] {
    return (sym.children ?? [])
        .filter(c =>
            CALLABLE_KINDS.has(c.kind) ||
            c.kind === vscode.SymbolKind.Property ||
            c.kind === vscode.SymbolKind.Field,
        )
        .map(c => c.name);
}

// ── Main container-level topology collector ────────────────────────────────

/** Intermediate structure used during the two-phase collection. */
interface RawContainer {
    name: string;
    kind: vscode.SymbolKind;
    uri: vscode.Uri;
    range: vscode.Range;
    skeleton: string;
    memberNames: string[];
    callablePositions: vscode.Position[];
}

/**
 * Build a CodeSymbolNode[] topology at container level
 * (class, interface, module, enum, struct).
 *
 * Standalone top-level functions are grouped into virtual file-level modules.
 * Call edges from individual methods are aggregated & elevated to the
 * container that owns them.
 */
export async function collectTopologyFromUris(
    uris: vscode.Uri[],
    token: vscode.CancellationToken,
): Promise<CodeSymbolNode[]> {
    // ── Phase 1: Collect all containers ──────────────────────────────

    const rawContainers: RawContainer[] = [];

    for (const uri of uris) {
        if (token.isCancellationRequested) break;

        let doc: vscode.TextDocument;
        try {
            doc = await vscode.workspace.openTextDocument(uri);
        } catch {
            continue;
        }

        const rawSymbols = await getDocumentSymbols(uri);
        const standaloneFunctions: vscode.DocumentSymbol[] = [];

        for (const sym of rawSymbols) {
            if (CONTAINER_KINDS.has(sym.kind)) {
                rawContainers.push({
                    name: sym.name,
                    kind: sym.kind,
                    uri,
                    range: sym.range,
                    skeleton: buildContainerSkeleton(doc, sym),
                    memberNames: collectMemberNames(sym),
                    callablePositions: collectCallablePositions(sym),
                });
            } else if (sym.kind === vscode.SymbolKind.Function) {
                standaloneFunctions.push(sym);
            }
        }

        // Group standalone functions into a virtual file-level module.
        if (standaloneFunctions.length > 0) {
            const moduleName = fileToModuleName(uri);
            rawContainers.push({
                name: moduleName,
                kind: vscode.SymbolKind.Module,
                uri,
                range: new vscode.Range(0, 0, doc.lineCount - 1, 0),
                skeleton: buildVirtualModuleSkeleton(doc, moduleName, standaloneFunctions),
                memberNames: standaloneFunctions.map(f => f.name),
                callablePositions: standaloneFunctions.map(f => f.range.start),
            });
        }
    }

    // ── Phase 2: Build member→container lookup for call-edge elevation ──

    const memberToContainers = new Map<string, Set<string>>();
    for (const container of rawContainers) {
        for (const member of container.memberNames) {
            let set = memberToContainers.get(member);
            if (!set) {
                set = new Set();
                memberToContainers.set(member, set);
            }
            set.add(container.name);
        }
    }

    const allContainerNames = new Set(rawContainers.map(c => c.name));

    /** Map a raw callee/caller name to container name(s). */
    function elevateToContainers(rawNames: string[]): string[] {
        const elevated = new Set<string>();
        for (const name of rawNames) {
            if (allContainerNames.has(name)) {
                elevated.add(name);
                continue;
            }
            const containers = memberToContainers.get(name);
            if (containers) {
                for (const c of containers) elevated.add(c);
            } else {
                // External / unresolved dependency — keep raw name.
                elevated.add(name);
            }
        }
        return [...elevated];
    }

    // ── Phase 3: Resolve call edges and aggregate to container level ──

    const nodes: CodeSymbolNode[] = [];

    for (const container of rawContainers) {
        if (token.isCancellationRequested) break;

        const allCallees = new Set<string>();
        const allCallers = new Set<string>();

        for (const pos of container.callablePositions) {
            if (token.isCancellationRequested) break;

            const [callees, callers] = await Promise.all([
                getOutgoingCalls(container.uri, pos),
                getIncomingCalls(container.uri, pos),
            ]);

            for (const c of callees) allCallees.add(c);
            for (const c of callers) allCallers.add(c);
        }

        // Elevate raw method names to container names, remove self-references.
        const elevatedCallees = elevateToContainers([...allCallees]).filter(c => c !== container.name);
        const elevatedCallers = elevateToContainers([...allCallers]).filter(c => c !== container.name);

        nodes.push({
            name: container.name,
            kind: container.kind,
            uri: container.uri,
            range: container.range,
            skeleton: container.skeleton,
            callees: elevatedCallees,
            callers: elevatedCallers,
            memberNames: container.memberNames,
        });
    }

    return nodes;
}
