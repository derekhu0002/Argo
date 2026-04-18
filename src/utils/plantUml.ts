import { execFile } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

type ValidationMode = 'auto' | 'cli' | 'java-jar' | 'disabled';

interface ValidationCommand {
    command: string;
    args: string[];
    displayName: string;
}

interface PlantUmlPreparationResult {
    prepared: string;
    corrections: string[];
}

interface ArchimateElementMapping {
    names: string[];
    targetMacro: string;
}

const ARCHIMATE_ELEMENT_MAPPINGS: ArchimateElementMapping[] = [
    { names: ['BusinessProcess', 'ArchiMate_BusinessProcess'], targetMacro: 'Business_Process' },
    { names: ['ApplicationComponent', 'ArchiMate_ApplicationComponent'], targetMacro: 'Application_Component' },
    { names: ['TechnologyNode', 'ArchiMate_TechnologyNode'], targetMacro: 'Technology_Node' },
    { names: ['ApplicationService', 'ArchiMate_ApplicationService'], targetMacro: 'Application_Service' },
    { names: ['BusinessActor', 'ArchiMate_BusinessActor'], targetMacro: 'Business_Actor' },
    { names: ['BusinessRole', 'ArchiMate_BusinessRole'], targetMacro: 'Business_Role' },
];

export async function preparePlantUmlForSave(source: string, targetUri: vscode.Uri): Promise<string> {
    const normalized = preparePlantUmlForSaveDetailed(source);
    await validatePlantUmlByRendering(normalized.prepared, targetUri);
    return normalized.prepared;
}

export function preparePlantUmlForSaveDetailed(source: string): PlantUmlPreparationResult {
    const normalized = normalizePlantUml(source);
    validatePlantUml(normalized.prepared);
    return normalized;
}

function normalizePlantUml(source: string): PlantUmlPreparationResult {
    const corrections: string[] = [];
    const cleaned = source.replace(/```plantuml?\s*/g, '').replace(/```/g, '').trim();
    const rewritten = rewriteArchimateShorthand(cleaned, corrections);
    const lines = rewritten.split(/\r?\n/).map(line => line.trimEnd());

    const startIndex = lines.findIndex(line => line.trim() === '@startuml');
    const endIndex = lines.map(line => line.trim()).lastIndexOf('@enduml');
    if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
        return { prepared: rewritten, corrections };
    }

    const body = lines.slice(startIndex + 1, endIndex);
    const usesArchimateMacros = body.some(line => /\b(Business_Process|Application_Component|Application_Service|Technology_Node|Business_Actor|Business_Role)\b/.test(line));
    const hasArchimateInclude = body.some(line => /!include\s+<archimate\/Archimate>/i.test(line));

    if (usesArchimateMacros && !hasArchimateInclude) {
        body.unshift('!include <archimate/Archimate>');
        corrections.push('插入 `!include <archimate/Archimate>` 以启用 ArchiMate 标准库。');
    }

    const rebuilt = [
        ...lines.slice(0, startIndex + 1),
        ...body,
        ...lines.slice(endIndex),
    ];

    return { prepared: rebuilt.join('\n').trim() + '\n', corrections };
}

function validatePlantUml(source: string): void {
    const trimmed = source.trim();
    if (!trimmed) {
        throw new Error('PlantUML 文本为空，无法保存。');
    }

    const startMatches = trimmed.match(/(^|\n)@startuml(?=\n|$)/g) ?? [];
    const endMatches = trimmed.match(/(^|\n)@enduml(?=\n|$)/g) ?? [];
    if (startMatches.length !== 1 || endMatches.length !== 1) {
        throw new Error('PlantUML 文档必须且只能包含一个 @startuml 和一个 @enduml。');
    }

    const startIndex = trimmed.indexOf('@startuml');
    const endIndex = trimmed.lastIndexOf('@enduml');
    if (startIndex > endIndex) {
        throw new Error('PlantUML 文档结构错误：@enduml 出现在 @startuml 之前。');
    }

    const body = trimmed.slice(startIndex, endIndex + '@enduml'.length);
    if (/\b(Business_Process|Application_Component|Application_Service|Technology_Node|Business_Actor|Business_Role)\b/.test(body) && !/!include\s+<archimate\/Archimate>/i.test(body)) {
        throw new Error('检测到 ArchiMate 宏，但缺少 !include <archimate/Archimate>。');
    }
}

async function validatePlantUmlByRendering(source: string, targetUri: vscode.Uri): Promise<void> {
    const settings = getValidationSettings();
    if (settings.mode === 'disabled') {
        return;
    }

    const candidates = buildValidationCandidates(settings);
    if (candidates.length === 0) {
        throw new Error(
            '未找到可用的 PlantUML 本地编译链路。' +
            buildValidationSetupGuidance(),
        );
    }

    const tempFile = buildTempFilePath(targetUri.fsPath);
    const generatedArtifacts = new Set<string>([
        tempFile,
        tempFile.replace(/\.puml$/i, '.svg'),
    ]);

    await fs.writeFile(tempFile, source, 'utf8');
    try {
        let lastError: unknown;
        for (const candidate of candidates) {
            try {
                await execFileAsync(candidate.command, [...candidate.args, tempFile], {
                    cwd: path.dirname(targetUri.fsPath),
                    windowsHide: true,
                    maxBuffer: 1024 * 1024 * 10,
                });
                await collectGeneratedArtifacts(tempFile, generatedArtifacts);
                return;
            } catch (err) {
                lastError = err;
            }
        }

        throw new Error(formatValidationFailure(lastError, candidates, source));
    } finally {
        await cleanupArtifacts(generatedArtifacts);
    }
}

interface ValidationSettings {
    mode: ValidationMode;
    cliCommand: string;
    cliArgs: string[];
    javaCommand: string;
    javaArgs: string[];
    jarPath: string;
    jarArgs: string[];
}

function getValidationSettings(): ValidationSettings {
    const argoConfig = vscode.workspace.getConfiguration('argo');
    const plantUmlConfig = vscode.workspace.getConfiguration('plantuml');

    return {
        mode: argoConfig.get<ValidationMode>('plantuml.validationMode', 'auto'),
        cliCommand: argoConfig.get<string>('plantuml.command', 'plantuml').trim() || 'plantuml',
        cliArgs: argoConfig.get<string[]>('plantuml.commandArgs', []),
        javaCommand: argoConfig.get<string>('plantuml.javaCommand', '').trim()
            || plantUmlConfig.get<string>('java', '').trim()
            || 'java',
        javaArgs: argoConfig.get<string[]>('plantuml.javaArgs', []),
        jarPath: argoConfig.get<string>('plantuml.jarPath', '').trim()
            || plantUmlConfig.get<string>('jar', '').trim(),
        jarArgs: argoConfig.get<string[]>('plantuml.jarArgs', []),
    };
}

function buildValidationCandidates(settings: ValidationSettings): ValidationCommand[] {
    const renderArgs = ['-charset', 'UTF-8', '-tsvg'];
    const candidates: ValidationCommand[] = [];

    if (settings.mode === 'auto' || settings.mode === 'cli') {
        candidates.push({
            command: settings.cliCommand,
            args: [...settings.cliArgs, ...renderArgs],
            displayName: settings.cliCommand,
        });
    }

    if (settings.mode === 'auto' || settings.mode === 'java-jar') {
        if (settings.jarPath) {
            candidates.push({
                command: settings.javaCommand,
                args: [...settings.javaArgs, '-jar', settings.jarPath, ...settings.jarArgs, ...renderArgs],
                displayName: `${settings.javaCommand} -jar ${settings.jarPath}`,
            });
        } else if (settings.mode === 'java-jar') {
            throw new Error(
                '已启用 `java-jar` 校验模式，但未配置 `argo.plantuml.jarPath`。' +
                buildValidationSetupGuidance(),
            );
        }
    }

    return candidates;
}

function buildTempFilePath(targetPath: string): string {
    const extension = path.extname(targetPath) || '.puml';
    const base = targetPath.slice(0, -extension.length) || targetPath;
    return `${base}.argo-validate-${Date.now()}${extension}`;
}

async function collectGeneratedArtifacts(tempFile: string, artifacts: Set<string>): Promise<void> {
    const directory = path.dirname(tempFile);
    const baseName = path.basename(tempFile, path.extname(tempFile));
    const entries = await fs.readdir(directory);
    for (const entry of entries) {
        if (entry.startsWith(baseName) && entry !== path.basename(tempFile)) {
            artifacts.add(path.join(directory, entry));
        }
    }
}

async function cleanupArtifacts(artifacts: Set<string>): Promise<void> {
    await Promise.all(Array.from(artifacts).map(async artifact => {
        try {
            await fs.rm(artifact, { force: true, recursive: false });
        } catch {
            // Best-effort cleanup only.
        }
    }));
}

function formatValidationFailure(lastError: unknown, candidates: ValidationCommand[], source: string): string {
    const attempts = candidates.map(candidate => candidate.displayName).join(' -> ');
    const detail = extractErrorDetail(lastError);

    if (isToolchainFailure(lastError, detail)) {
        return `PlantUML 编译校验失败。已尝试：${attempts}。详细信息：${detail}` + buildValidationSetupGuidance();
    }

    const lineNumber = parsePlantUmlErrorLine(detail);
    if (lineNumber !== undefined) {
        const lineText = getSourceLine(source, lineNumber);
        return `PlantUML 语法/渲染校验失败。已尝试：${attempts}。错误行：第 ${lineNumber} 行。` +
            (lineText ? `对应内容：${lineText}。` : '') +
            `详细信息：${detail}`;
    }

    return `PlantUML 语法/渲染校验失败。已尝试：${attempts}。详细信息：${detail}`;
}

function extractErrorDetail(lastError: unknown): string {
    if (typeof lastError === 'object' && lastError && 'stdout' in lastError && 'stderr' in lastError) {
        const stdout = String((lastError as { stdout?: unknown }).stdout ?? '').trim();
        const stderr = String((lastError as { stderr?: unknown }).stderr ?? '').trim();
        return stderr || stdout || String(lastError);
    }
    return String(lastError);
}

function isToolchainFailure(lastError: unknown, detail: string): boolean {
    const code = typeof lastError === 'object' && lastError && 'code' in lastError
        ? String((lastError as { code?: unknown }).code ?? '')
        : '';
    return code === 'ENOENT'
        || /spawn\s+.+\s+ENOENT/i.test(detail)
        || /未找到可用的 PlantUML 本地编译链路/.test(detail)
        || /未配置 `argo\.plantuml\.jarPath`/.test(detail);
}

function parsePlantUmlErrorLine(detail: string): number | undefined {
    const match = detail.match(/Error line\s+(\d+)\s+in file:/i);
    if (!match) {
        return undefined;
    }
    const lineNumber = Number(match[1]);
    return Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : undefined;
}

function getSourceLine(source: string, lineNumber: number): string {
    const lines = source.split(/\r?\n/);
    return (lines[lineNumber - 1] ?? '').trim();
}

function buildValidationSetupGuidance(): string {
    return ' 请确认本机可用 `plantuml` 命令，或在设置中配置 ' +
        '`argo.plantuml.command`、`argo.plantuml.jarPath`、`argo.plantuml.javaCommand`。' +
        '如需临时跳过完整编译校验，可将 `argo.plantuml.validationMode` 设为 `disabled`。';
}

function rewriteArchimateShorthand(source: string, corrections: string[]): string {
    const lines = source.split(/\r?\n/);
    return lines.map(line => rewriteArchimateLine(line, corrections)).join('\n');
}

function rewriteArchimateLine(line: string, corrections: string[]): string {
    for (const mapping of ARCHIMATE_ELEMENT_MAPPINGS) {
        for (const name of mapping.names) {
            const displayAliasMatch = line.match(new RegExp(`^(\\s*)${escapeRegExp(name)}\\s+"([^"]+)"\\s+as\\s+([A-Za-z0-9_.$-]+)\\s*$`));
            if (displayAliasMatch) {
                const [, indent, label, alias] = displayAliasMatch;
                const rewritten = `${indent}${mapping.targetMacro}(${alias}, "${label}")`;
                corrections.push(`将 \`${line.trim()}\` 规范化为 \`${rewritten.trim()}\`。`);
                return rewritten;
            }

            const macroAliasMatch = line.match(new RegExp(`^(\\s*)${escapeRegExp(name)}\\(\\s*"([^"]+)"\\s*\\)\\s+as\\s+([A-Za-z0-9_.$-]+)\\s*$`));
            if (macroAliasMatch) {
                const [, indent, label, alias] = macroAliasMatch;
                const rewritten = `${indent}${mapping.targetMacro}(${alias}, "${label}")`;
                corrections.push(`将 \`${line.trim()}\` 规范化为 \`${rewritten.trim()}\`。`);
                return rewritten;
            }

            const wrongMacroMatch = line.match(new RegExp(`^(\\s*)${escapeRegExp(name)}\\(\\s*([A-Za-z0-9_.$-]+)\\s*,\\s*"([^"]+)"\\s*\\)\\s*$`));
            if (wrongMacroMatch) {
                const [, indent, alias, label] = wrongMacroMatch;
                const rewritten = `${indent}${mapping.targetMacro}(${alias}, "${label}")`;
                if (rewritten.trim() !== line.trim()) {
                    corrections.push(`将 \`${line.trim()}\` 规范化为 \`${rewritten.trim()}\`。`);
                }
                return rewritten;
            }
        }
    }

    return line;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}