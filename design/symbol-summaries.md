# Symbol Summaries

| Symbol | Stereotype | Business Effect |
|--------|-----------|-----------------|
| src/utils/workspaceFs | <<Utility>> | Manages file system operations for architecture and UML artifacts. |
| ValidationCommand | <<ValueObject>> | — |
| PlantUmlPreparationResult | <<ValueObject>> | — |
| ArchimateElementMapping | <<ValueObject>> | — |
| ValidationSettings | <<ValueObject>> | — |
| src/utils/plantUml | <<Utility>> | Processes and validates PlantUML diagrams. |
| src/utils/governance | <<Service>> | Synchronizes governance reports between intent and implementation UML. |
| src/utils/git | <<Adapter>> | Interacts with Git to retrieve commit and file change information. |
| src/utils/agentHandoff | <<Utility>> | Builds prompts for agent handoff workflows. |
| src/participant | <<Service>> | Handles chat requests and responses for the participant system. |
| PromptSection | <<ValueObject>> | — |
| src/lm/prompts | <<Utility>> | Generates prompts for various user and system interactions. |
| src/lm/chatModelHelper | <<Service>> | Manages interactions with the language model chat system. |
| src/extension | <<Controller>> | Handles activation and deactivation of the VS Code extension. |
| CodeSymbolNode | <<ValueObject>> | — |
| BusinessSummary | <<ValueObject>> | — |
| UmlNote | <<ValueObject>> | — |
| SemanticUmlResult | <<ValueObject>> | — |
| StitchViolation | <<ValueObject>> | — |
| StitchJudgement | <<ValueObject>> | — |
| TraceabilityEntry | <<ValueObject>> | — |
| TraceabilityMatrix | <<ValueObject>> | — |
| ArchitectureDeviation | <<ValueObject>> | — |
| ArchitectureDriftReport | <<Repository>> | — |
| SemanticUmlEngineOptions | <<ValueObject>> | — |
| StitchJudge | <<DomainService>> | Analyzes architecture drift and performs anti-corruption checks. |
| SemanticUmlEngine | <<Specification>> | Abstract engine for semantic analysis and UML generation. |
| RawContainer | <<ValueObject>> | — |
| src/engine/lspCollector | <<Adapter>> | Collects and processes source code symbols and topology. |
| MapPromptSymbol | <<ValueObject>> | — |
| BatchMapResponseItem | <<ValueObject>> | — |
| TrivialSummaryHint | <<ValueObject>> | — |
| DefaultSemanticUmlEngine | <<Service>> | Implements semantic analysis and UML generation with specific strategies. |
| src/commands/link | <<EventHandler>> | Handles linking operations in the chat system. |
| src/commands/init | <<EventHandler>> | Handles initialization operations in the chat system. |
| src/commands/evolve | <<Controller>> | Handles an evolve command with no external dependencies. |
| src/commands/discover | <<Controller>> | Processes a discover command and cleans PlantUML strings. |
| src/commands/baseline | <<Controller>> | Handles a baseline command and resolves target URIs while analyzing call graphs. |
