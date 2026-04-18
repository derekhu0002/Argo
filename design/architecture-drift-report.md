# Architecture Drift Report

Generated at: 2026-04-18T01:30:15.914Z
Overall status: minor-drift
Drift score: 20%

## Summary

The implementation aligns with the intent in most areas, but there are minor deviations in traceability and dependency alignment.

## Deviations

| Intent Component | Code Elements | Category | Severity | Description | Impact | Recommendation |
|------------------|---------------|----------|----------|-------------|--------|----------------|
| UML Management | SemanticUmlEngine, DefaultSemanticUmlEngine | unexpected-dependency | medium | The UML Management intent suggests a focus on managing UML artifacts, but the implementation includes semantic analysis components that may exceed the scope. | This could lead to unnecessary complexity and misalignment with the intended functionality. | Refactor the implementation to separate semantic analysis from UML management or clarify the intent to include semantic analysis. |
| Source Code Analysis | src_engine_lspCollector | traceability-gap | low | The traceability matrix does not fully explain how source code analysis integrates with other components like UML Management. | This gap may hinder understanding of the overall architecture and its dependencies. | Enhance the traceability matrix to include integration details between source code analysis and UML-related components. |
| Architecture Drift Analysis | StitchJudge | layer-violation | medium | The StitchJudge class appears to perform both analysis and enforcement, potentially violating separation of concerns. | This could reduce maintainability and clarity of the architecture drift analysis process. | Split StitchJudge into distinct components for analysis and enforcement to align with architectural principles. |

## Recommended Actions

- Refactor UML Management to clarify or separate semantic analysis functionality.
- Update the traceability matrix to better document integration points for source code analysis.
- Refactor StitchJudge to separate analysis and enforcement responsibilities.
