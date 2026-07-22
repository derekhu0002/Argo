---
name: converting-docx-to-markdown
description: Use when converting Microsoft Word DOCX files to Markdown, especially when images, tables, tracked changes, headers, footers, Unicode paths, or content-completeness verification matter.
---

# Converting DOCX to Markdown

## Overview

Use the bundled PowerShell script to produce a Markdown file plus a sibling `.assets` directory. The conversion must inventory every source media item, resolve every Markdown image reference, preserve omitted Word parts, and retain the original DOCX.

Plain Markdown cannot represent every DOCX layout feature exactly. Never describe arbitrary DOCX conversion as byte-for-byte or visually lossless; report preserved unsupported parts from `conversion-report.json`.

## Workflow

1. Confirm the source is a readable `.docx` and determine the exact `.md` destination.
2. Check whether the destination Markdown or sibling `.assets` directory exists.
3. Run the script from the repository root:

```powershell
& ".argo/skills/converting-docx-to-markdown/scripts/convert-docx-to-markdown.ps1" `
  -InputPath "D:/docs/spec.docx" `
  -OutputPath "D:/docs/spec.md"
```

The script uses Pandoc from `PATH`, a supplied `-PandocPath`, or a checksum-verified portable download cached under `%LOCALAPPDATA%/ArgoTools/pandoc`.

4. Read `<name>.assets/conversion-report.json`.
5. Report success only when:
   - `sourceMediaCount` equals `exportedMediaCount`;
   - `mediaHashMismatches` is empty;
   - `missingImageReferences` is empty;
   - the Markdown and assets exist;
   - Pandoc completed successfully;
   - any `unsupportedPackageParts`, `pandocMessages`, and `preservationLimitations` are disclosed.

## Output Contract

```text
spec.md
spec.assets/
  media/
  source/spec.docx
  conversion-report.json
```

- Images referenced by the converted body use relative paths.
- Source media omitted by Pandoc, such as picture bullets, is extracted and appended to the Markdown.
- Non-empty Word headers, footers, and comments are appended in a preservation section.
- The original DOCX is retained because Markdown cannot encode all OOXML semantics.

## Options

| Option | Use |
|---|---|
| `-PandocPath <path>` | Use a specific `pandoc.exe` |
| `-Force` | Replace an existing Markdown/assets pair after staging succeeds |

Without `-Force`, an existing destination is an error. Never add `-Force` unless replacement is explicitly intended.

## Verification

Run the fixture test after editing the skill or script:

```powershell
& ".argo/skills/converting-docx-to-markdown/tests/test-convert-docx-to-markdown.ps1"
```

The test covers Unicode paths, body text, footer preservation, referenced and unreferenced media, report generation, link validation, and collision refusal.

## Common Mistakes

- Using Pandoc directly without comparing `word/media/*` to exported assets.
- Claiming “no loss” because Pandoc exited with code 0.
- Overwriting an existing `.md` while leaving stale assets.
- Embedding absolute image paths that fail on another machine.
- Ignoring headers, footers, comments, picture bullets, charts, or embedded objects.
