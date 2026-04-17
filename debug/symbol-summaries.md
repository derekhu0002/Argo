# Symbol Summaries

| Symbol | Stereotype | Business Effect |
|--------|-----------|-----------------|
| test_site/server | <<Utility>> | Starts a local HTTP server for testing purposes. |
| AnalyzeRequest | <<ValueObject>> | — |
| AnalyzeResult | <<ValueObject>> | — |
| MessageFeedbackRequest | <<ValueObject>> | — |
| MessageFeedbackResult | <<ValueObject>> | — |
| AnalysisProvider | <<ValueObject>> | — |
| backend/src/timeout | <<Utility>> | Provides a utility to execute promises with a timeout. |
| MockAnalysisProvider | <<Adapter>> | Mocks an analysis provider for testing purposes. |
| backend/src/providers/mockAnalysisProvider | <<Utility>> | Implements a sleep function with optional signal handling. |
| backend/src/providers/index | <<Factory>> | Creates an instance of an analysis provider. |
| backend/src/index | <<Utility>> | Entry point for the backend module. |
| AppError | <<ValueObject>> | Defines a custom error type with additional metadata. |
| ErrorBody | <<ValueObject>> | — |
| AuthError | <<ValueObject>> | — |
| PermissionError | <<ValueObject>> | — |
| ValidationError | <<ValueObject>> | — |
| TimeoutError | <<ValueObject>> | — |
| AnalysisError | <<ValueObject>> | — |
| backend/src/config | <<Utility>> | Parses and validates configuration for backend origins. |
| backend/src/app | <<Factory>> | Creates the backend application with a given provider and environment. |
| ImmediateProvider | <<Adapter>> | Provides immediate analysis results for testing. |
| backend/src/app.test | <<Utility>> | Contains test cases for the backend application. |
| backend/dist/index | <<Utility>> | Aggregates and exports backend utilities and functions. |
| extension/src/sidepanel/App | <<Controller>> | Defines the side panel application and its components. |
| ChromeStubOptions | <<ValueObject>> | — |
| extension/src/sidepanel/App.test | <<Utility>> | Contains test cases for the side panel application. |
| DrawerBarItem | <<ValueObject>> | — |
| MainAgentOption | <<ValueObject>> | — |
| extension/src/sidepanel/useSidepanelController | <<Controller>> | Manages the state and behavior of the side panel. |
| extension/src/sidepanel/useScrollFollowController | <<Controller>> | Manages scroll behavior for a side panel, including auto-scrolling and message navigation. |
| extension/src/sidepanel/useRunHistory | <<Utility>> | Provides access to historical run data. |
| FakeEventSource | <<Utility>> | Simulates an EventSource for testing purposes. |
| extension/src/shared/api.test | <<Test>> | Tests API interactions, including run initiation and feedback submission. |
| UsernameExtractionInput | <<ValueObject>> | — |
| extension/src/shared/username | <<Utility>> | Extracts and normalizes username context from various sources. |
| extension/src/shared/username.test | <<Test>> | Tests username extraction and normalization logic. |
| CanonicalCapturedFields | <<ValueObject>> | — |
| FieldRuleDefinition | <<ValueObject>> | — |
| PageRule | <<ValueObject>> | — |
| MatchedRuleSummary | <<ValueObject>> | — |
| ActiveTabContext | <<ValueObject>> | — |
| UsernameContext | <<ValueObject>> | — |
| StreamConnectionState | <<ValueObject>> | — |
| AssistantState | <<ValueObject>> | — |
| StartRunResponse | <<ValueObject>> | — |
| ExtensionApiFailureResponse | <<ValueObject>> | — |
| AnswerSuccessResponse | <<ValueObject>> | — |
| FeedbackSuccessResponse | <<ValueObject>> | — |
| MessageFeedbackUiState | <<ValueObject>> | — |
| ContentScriptReadyResponse | <<ValueObject>> | — |
| extension/src/shared/scripting | <<Utility>> | Provides scripting utilities for content script readiness and error handling. |
| RulesStorageLike | <<ValueObject>> | — |
| extension/src/shared/rules | <<Service>> | Manages rules for page field capture and matching. |
| extension/src/shared/rules.test | <<Test>> | Tests rule management functionality. |
| TranscriptTraceCorrelation | <<ValueObject>> | — |
| TranscriptTraceRecord | <<ValueObject>> | — |
| TranscriptObservabilityEnvelope | <<ValueObject>> | — |
| RunEventCanonicalMetadata | <<ValueObject>> | — |
| RunEventTransportMetadata | <<ValueObject>> | — |
| RunEventFrontier | <<ValueObject>> | — |
| RunEventDiagnostic | <<ValueObject>> | — |
| RunEventState | <<ValueObject>> | — |
| RunStateSyncMetadata | <<ValueObject>> | — |
| QuestionOption | <<ValueObject>> | Represents an option for a question in a structured format. |
| QuestionPayload | <<ValueObject>> | — |
| NormalizedRunEvent | <<Entity>> | Represents a normalized event in a run, including metadata and associated data. |
| RunStreamLifecycle | <<ValueObject>> | — |
| RunStartRequest | <<ValueObject>> | — |
| QuestionAnswerRequest | <<ValueObject>> | — |
| MessageFeedbackRequest | <<ValueObject>> | — |
| MessageFeedbackResponse | <<ValueObject>> | — |
| RunRecord | <<ValueObject>> | — |
| AnswerRecord | <<ValueObject>> | — |
| RunHistoryDetail | <<ValueObject>> | — |
| extension/src/shared/protocol | <<Utility>> | Handles event processing and normalization for run protocols. |
| PageAccessResult | <<ValueObject>> | — |
| extension/src/shared/pageAccess | <<Utility>> | Evaluates and manages page access permissions. |
| OpenCodeReferenceInput | <<ValueObject>> | — |
| extension/src/shared/pageAccess.test | <<Test>> | Tests page access evaluation logic. |
| ChatStreamViewProps | <<ValueObject>> | — |
| extension/src/sidepanel/reasoningTimelineView | <<Controller>> | Renders and manages the reasoning timeline view for user interactions. |
| HistoryStore | <<ValueObject>> | — |
| extension/src/shared/history | <<Repository>> | Manages history storage and retrieval using IndexedDB. |
| extension/src/sidepanel/reasoningTimelineView.test | <<Test>> | Tests the reasoning timeline view rendering and behavior. |
| extension/src/shared/history.test | <<Utility>> | Contains test scaffolding for history-related functionality. |
| TimelineEventEntry | <<ValueObject>> | — |
| TimelineCardModel | <<Entity>> | — |
| ConversationTurnModel | <<Entity>> | — |
| ReasoningSectionModel | <<Entity>> | — |
| FragmentBadgeModel | <<Entity>> | — |
| ChatStreamItemModel | <<Entity>> | — |
| TranscriptPartModel | <<Entity>> | — |
| TranscriptMessageModel | <<Entity>> | — |
| TranscriptTailPatchModel | <<Entity>> | — |
| TranscriptSummaryModel | <<Entity>> | — |
| TranscriptReadModel | <<Entity>> | — |
| ProjectionAnomalyRecord | <<ValueObject>> | — |
| LiveTranscriptProjectionState | <<ValueObject>> | — |
| LiveTranscriptProjectionDebug | <<ValueObject>> | — |
| BuildChatStreamItemsOptions | <<ValueObject>> | — |
| BuildTranscriptSegmentReadModelOptions | <<Entity>> | — |
| StableTranscriptProjectionOptions | <<ValueObject>> | — |
| AssistantResponseAggregation | <<ValueObject>> | — |
| CockpitStatusModel | <<Entity>> | — |
| extension/src/sidepanel/reasoningTimeline | <<Service>> | Processes and aggregates reasoning timeline data for assistant responses. |
| DomainError | <<ValueObject>> | — |
| ExtensionError | <<ValueObject>> | — |
| extension/src/shared/errors | <<Utility>> | Handles domain error creation and normalization. |
| extension/src/sidepanel/reasoningTimeline.test | <<Utility>> | Contains test scaffolding for reasoning timeline functionality. |
| extension/src/shared/contentScriptHarness.test | <<Utility>> | Contains test scaffolding for content script harness functionality. |
| extension/src/sidepanel/reasoningTimeline.chromeSandbox.test | <<Utility>> | Contains test scaffolding for reasoning timeline in Chrome sandbox. |
| ExtensionConfig | <<ValueObject>> | — |
| extension/src/shared/configuration | <<Service>> | Manages extension configuration and validation. |
| extension/src/sidepanel/reasoningTimeline.chromeSandbox.entry | <<Adapter>> | Provides a Chrome sandbox transcript fixture. |
| extension/src/shared/configuration.test | <<Utility>> | Contains test scaffolding for configuration functionality. |
| extension/src/sidepanel/questionState | <<Service>> | Manages question state and pending question resolution. |
| extension/src/sidepanel/questionState.test | <<Utility>> | Contains test scaffolding for question state functionality. |
| extension/src/shared/api | <<Gateway>> | Handles API interactions for runs, events, and feedback. |
| SessionNavigationItem | <<ValueObject>> | — |
| RunEventAcceptanceResult | <<ValueObject>> | — |
| extension/src/sidepanel/model | <<Service>> | Manages assistant state and run event processing. |
| extension/src/sidepanel/model.test | <<Utility>> | Contains test scaffolding for assistant state and model functionality. |
| RunDiagnosticsSource | <<ValueObject>> | — |
| RunDiagnosticsSnapshot | <<ValueObject>> | — |
| extension/src/sidepanel/diagnostics | <<Service>> | Generates diagnostics and summaries for assistant runs. |
| extension/src/sidepanel/diagnostics.test | <<Utility>> | Defines test utilities for diagnostics and sidepanel state. |
| _FakeResponse | <<ValueObject>> | — |
| python_adapter/tests/test_probe_opencode | <<Test>> | Tests the behavior of the probe_opencode module for health and agent checks. |
| FakeStreamContext | <<Utility>> | Provides an asynchronous context manager for HTTP responses. |
| FakeAsyncClient | <<Utility>> | Simulates an asynchronous HTTP client for testing purposes. |
| python_adapter/tests/test_opencode_adapter | <<Test>> | Tests the OpencodeAdapter's integration with session and event flows. |
| python_adapter/tests/test_config | <<Test>> | Tests configuration settings for the Python adapter. |
| python_adapter/tests/test_app | <<Test>> | Tests the application flow for starting runs and handling events. |
| extension/src/sidepanel/components/stage/MainStage | <<Controller>> | Renders the main stage of the sidepanel with various interactive elements. |
| python_adapter/scripts/probe_opencode | <<Utility>> | Probes the Opencode service for health and agent availability. |
| extension/src/sidepanel/components/shell/StatusRail | <<Controller>> | Displays the status rail in the sidepanel shell. |
| extension/src/sidepanel/components/shell/ShellHeader | <<Controller>> | Renders the header of the sidepanel shell with session controls. |
| extension/src/sidepanel/components/shared/icons | <<Utility>> | Provides reusable icon components for the sidepanel. |
| extension/src/sidepanel/components/panels/SessionsPanel | <<Controller>> | Manages and displays session-related information in the sidepanel. |
| extension/src/sidepanel/components/panels/RulesPanel | <<Controller>> | Manages and displays rules for the sidepanel. |
| extension/src/sidepanel/components/panels/ContextPanel | <<Controller>> | Displays context-related information and handles permission requests. |
| RunNotFoundError | <<ValueObject>> | Represents a specific error when a run is not found. |
| OpencodeAdapter | <<Adapter>> | Manages interactions with the Opencode system, including run validation and remote agent discovery. |
| NormalizedRunEventTool | <<ValueObject>> | Encapsulates metadata about a tool used in a normalized run event. |
| RunContext | <<ValueObject>> | Holds contextual information about a run, such as source and user details. |
| RunStartRequest | <<ValueObject>> | — |
| QuestionAnswerRequest | <<ValueObject>> | — |
| MessageFeedbackRequest | <<ValueObject>> | — |
| QuestionOption | <<ValueObject>> | Represents an option for a question in a structured format. |
| QuestionPayload | <<ValueObject>> | — |
| NormalizedRunEventSemantic | <<ValueObject>> | Defines semantic details for a normalized run event. |
| NormalizedRunEvent | <<Entity>> | Represents a normalized event in a run, including metadata and associated data. |
| RunStartResult | <<ValueObject>> | Encapsulates the result of starting a run, including agent and session details. |
| python_adapter/app/main | <<Controller>> | Implements API endpoints and error handling for the Python adapter. |
| JsonlInvocationLogger | <<Utility>> | Logs invocation payloads to a JSONL file. |
| Settings | <<ValueObject>> | Holds configuration settings for the Python adapter. |
| python_adapter/app/config | <<Utility>> | Provides utility functions for configuration parsing. |
| extension/src/sidepanel/components/composer/Composer | <<Adapter>> | Implements the Composer UI component for the side panel. |
| extension/src/content/index | <<Controller>> | Implements content scripts for field capture and UI interactions. |
| extension/src/background/index | <<Service>> | Manages background tasks and state synchronization for the extension. |
| extension/src/background/index.test | <<Utility>> | Contains test definitions with no business logic. |
| extension/dist/content | <<Adapter>> | Handles DOM manipulation and event-based communication. |
| extension/dist/background | <<Service>> | Manages background tasks and event-driven workflows. |
| O | <<ValueObject>> | Represents a custom error with structured formatting. |
| b | <<Utility>> | Provides utility methods for object and array merging. |
| C | <<ValueObject>> | Generates and caches path representations. |
| y | <<Specification>> | Defines a base class for data validation and transformation. |
| A | <<Specification>> | Extends validation logic with additional data checks. |
| V | <<Specification>> | Implements numeric validation with range checks. |
| q | <<Specification>> | Implements numeric validation with additional constraints. |
| de | <<Specification>> | Provides specialized parsing logic for data validation. |
| J | <<Specification>> | Implements date validation with range constraints. |
| Je | <<Specification>> | Provides specialized parsing logic for data validation. |
| Ye | <<Specification>> | Provides specialized parsing logic for data validation. |
| Xe | <<Specification>> | Provides specialized parsing logic for data validation. |
| Qe | <<Utility>> | Parses input data and interacts with background extension. |
| Ee | <<Utility>> | Parses input data and interacts with background extension. |
| M | <<Utility>> | Parses input data and interacts with state management. |
| et | <<Utility>> | Parses input data and interacts with state management and background extension. |
| I | <<Utility>> | Performs data validation and aggregation operations. |
| k | <<Utility>> | Provides utilities for schema manipulation and validation. |
| le | <<Utility>> | Parses input data and provides options for configuration. |
| fe | <<Utility>> | Parses input data and performs asynchronous operations. |
| z | <<Utility>> | Handles collections and performs filtering and mapping operations. |
| he | <<Utility>> | Manages key-value schema definitions and provides creation utilities. |
| tt | <<Utility>> | Handles key-value schema definitions and interacts with rules storage. |
| ne | <<Utility>> | Performs data validation and size-related operations. |
| nt | <<Utility>> | Provides schema access and parsing utilities. |
| Se | <<Utility>> | Provides access to value definitions and parsing utilities. |
| Y | <<Utility>> | Handles enumeration definitions and provides filtering and extraction utilities. |
| st | <<ValueObject>> | Parses and provides enumeration values. |
| me | <<ValueObject>> | Parses and unwraps data. |
| B | <<ValueObject>> | Handles schema effects and type transformations. |
| P | <<ValueObject>> | Parses and unwraps optional data. |
| X | <<ValueObject>> | Parses and unwraps nullable data. |
| Te | <<ValueObject>> | Parses and removes default values. |
| Re | <<ValueObject>> | Parses and removes catch values. |
| rt | <<ValueObject>> | Parses NaN values. |
| tn | <<ValueObject>> | Parses and unwraps lazy values. |
| Ce | <<Factory>> | Creates and parses objects. |
| Ae | <<ValueObject>> | Parses and handles readonly data. |
| Nn | <<ValueObject>> | — |
| extension/dist/assets/state-A94O9ADp | <<Utility>> | Manages state and provides utility functions for data processing. |
| Yi | <<ValueObject>> | — |
| Zt | <<ValueObject>> | — |
| Vf | <<ValueObject>> | — |
| zt | <<ValueObject>> | — |
| Nx | <<Entity>> | Manages a cursor-based collection with mutation operations. |
| vv | <<Utility>> | Handles file path manipulations and logging. |
| ad | <<Service>> | Processes and runs data transformations and diagnostics. |
| extension/dist/assets/sidepanel | <<Controller>>, <<Utility>> | Manages UI interactions and state for the side panel in the browser extension. |
