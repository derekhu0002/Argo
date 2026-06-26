---
name: architecture-diff-plantuml
description: Generates PlantUML architecture analysis from SystemArchitecture.json git diffs. Use when the user asks to visualize changed architecture elements/relationships, generate dependency trees, analyze graph diff granularity, or output architecture PlantUML under .argo/temp/architecture_analysis.
disable-model-invocation: true
---

# Architecture Diff PlantUML

## Purpose

Use MCP tool `generateArchitectureDiffPlantuml` to generate a timestamped PlantUML Markdown report for current `SystemArchitecture.json` git diff changes.
