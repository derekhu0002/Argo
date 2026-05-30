---
name: arch-viewer
description: "Open the SystemArchitecture.json knowledge graph in a schema-driven web viewer. Use when: viewing architecture, browsing elements, exploring relationships, inspecting views, reading KG, open arch viewer, architecture browser, show knowledge graph."
argument-hint: "(optional) port number, default 7432"
---

# Architecture Knowledge Graph Viewer

Opens `design/KG/SystemArchitecture.json` in a local schema-driven web viewer.
The viewer UI is generated entirely from `.github/argoschema/SystemArchitecture.schema.json` —
it adapts to the schema structure, not to the specific data content.

## Features

- React-style layered tree UI with glass cards, nested branches, and on-demand expansion
- Schema-driven rendering: field labels, types, required markers, enums, and array/object structure come from the schema
- Live search that auto-expands matching branches without hardcoding SystemArchitecture semantics
- Inspector panel for the currently selected node, plus validation feedback from schema rules
- All assets stay inside this skill folder: server script + HTML + JS + CSS

## Procedure

1. Run the local server from the **workspace root**:
   ```
   node .github/skills/arch-viewer/scripts/serve.js
   ```
   - The browser opens automatically to `http://localhost:7432`
   - To use a different port: `ARCH_VIEWER_PORT=8080 node .github/skills/arch-viewer/scripts/serve.js`

2. Wait for the server to print `Architecture Viewer  →  http://localhost:PORT`, then tell the user the URL.

3. Leave the server running. Press Ctrl+C in the terminal to stop it when done.

## Files

- Server: [scripts/serve.js](./scripts/serve.js)
- Viewer shell: [assets/index.html](./assets/index.html)
- Viewer logic: [assets/app.js](./assets/app.js)
- Viewer styles: [assets/styles.css](./assets/styles.css)

## Requirements

- Node.js (no npm install needed — uses only built-in modules)
- `design/KG/SystemArchitecture.json` must exist (data file)
- `.github/argoschema/SystemArchitecture.schema.json` must exist (schema file)
