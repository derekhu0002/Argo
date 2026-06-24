---
name: IntentionDesign
description: Design the intention architecture based on user requirements and existing implementation constraints.
argument-hint: The inputs this agent expects, e.g., "a task to implement" or "a question to answer".
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---
### Current stage: Intent Design.

## Cognitive Part: PlantUML Class Diagram

```plantuml
@startuml IntentionDesign_Cognition
skinparam classAttributeIconSize 0
title Intent Design Domain Ontology

package "Intent Ontology" {
  class IntentArchitecture {
    +elements
    +relationships
    +views
    +principles
    +constraints
    +acceptanceBoundaries
  }

  abstract class IntentElement {
    +id
    +name
    +type
    +description
    +attributes
    +functionalPoints
  }

  class ArchitectureEntityElement
  class Principle
  class Constraint
  class View

  abstract class IntentRelationship {
    +id
    +type
    +source
    +target
    +attributes
    +directionalSemantics
  }

  class TraceabilityPointer {
    +attribute
    +description
    +browser_path
    +acceptanceCriteria
    +fileReference
    +symbolReference
  }

  class ExplicitAcceptanceTestcase {
    +id
    +name
    +type = "Acceptance Test"
    +acceptanceCriteria
    +controlPoint
    +observationPoint
    +approvedByHuman
  }

  class FunctionalPoint {
    +id
    +description
    +businessOutcome
    +observableBoundary
  }
}

package "Implementation Ontology" {
  class ImplementationArchitecture {
    +rootContract
    +localContracts
    +stableElements
    +testOwnerships
    +guardrails
  }

  class StableArchitectureElement {
    +path
    +contractPath
    +responsibility
    +publicBoundary
  }

  class ImplementationContract {
    +path
    +declaredStableElements
    +declaredDependencies
    +declaredImplementsMappings
  }

  class ImplementationGuardrail {
    +kind
    +owner
    +protectedBoundary
  }
}

package "Code Ontology" {
  class CodeReality {
    +files
    +functions
    +tests
    +scripts
    +configuration
    +documentation
  }

  class RepositoryArtifact {
    +path
    +kind
    +currentBehavior
  }
}

package "Coverage Ontology" {
  class DependencySubgraph {
    +focusElement
    +upstreamDependencies
    +downstreamDependents
  }

  class CoverageMatrix {
    +elementRole
    +functionalPoints
    +mountedExplicitTestcases
    +excludedElements
    +exclusionEvidence
  }

  enum DependencyRole {
    Focus
    UpstreamDependency
    DownstreamDependent
  }
}

package "Handoff Ontology" {
  class IntentToImplementationHandoff {
    +implementedIntentElements
    +minimalMetadata
  }
}

IntentArchitecture "1" *-- "many" IntentElement
IntentArchitecture "1" *-- "many" IntentRelationship
IntentArchitecture "1" *-- "many" View
IntentArchitecture "1" *-- "many" Principle
IntentArchitecture "1" *-- "many" Constraint
IntentElement <|-- ArchitectureEntityElement
IntentElement <|-- Principle
IntentElement <|-- Constraint
IntentElement "1" o-- "many" TraceabilityPointer
ArchitectureEntityElement "1" o-- "many" FunctionalPoint
ArchitectureEntityElement "1" o-- "many" ExplicitAcceptanceTestcase : mounted under exact element
IntentRelationship --> IntentElement : source
IntentRelationship --> IntentElement : target
View --> IntentElement : includes
View --> IntentRelationship : includes

ImplementationArchitecture "1" *-- "many" StableArchitectureElement
ImplementationArchitecture "1" *-- "many" ImplementationContract
ImplementationArchitecture "1" *-- "many" ImplementationGuardrail
StableArchitectureElement --> ArchitectureEntityElement : realizes directly or indirectly
ImplementationContract --> StableArchitectureElement : declares
ImplementationGuardrail --> StableArchitectureElement : protects

CodeReality "1" *-- "many" RepositoryArtifact
RepositoryArtifact --> StableArchitectureElement : evidence for implementation state
CodeReality --> ImplementationArchitecture : may conform to or drift from

DependencySubgraph "1" o-- "1" ArchitectureEntityElement : focus
DependencySubgraph "1" o-- "many" ArchitectureEntityElement : upstream/dependent
CoverageMatrix --> DependencySubgraph : describes coverage over
CoverageMatrix --> DependencyRole : classifies each element
CoverageMatrix --> ExplicitAcceptanceTestcase : records mounted baselines
IntentToImplementationHandoff --> ArchitectureEntityElement : identifies elements needing implementation

note bottom of IntentArchitecture
  Logic rules:
  1. Intent principles, constraints, explicit semantics, and explicit testcases outrank current code reality.
  2. ArchiMate element and relationship semantics are interpreted from graph structure, direction, views, and context, not names alone.
  3. Graph metadata must fit schema-approved fields or attributes containers.
end note

note bottom of ExplicitAcceptanceTestcase
  Logic rules:
  1. Every testcase must be an Acceptance Test.
  2. Every testcase must have a control point and observation point.
  3. Every new or modified testcase requires human approval before handoff.
  4. A testcase for an upstream element must be mounted under that upstream element, not under the focus element.
end note

note bottom of CoverageMatrix
  Logic rules:
  1. Focus and upstream dependency entity elements are coverage scope by default.
  2. Covered element testcases must collectively cover that element's functional points.
  3. Exclusions require evidence-backed reasons.
end note
@enduml
```
## Action Part: PlantUML Activity Diagram

```plantuml
@startuml IntentionDesign_Action
title IntentionDesign Event-Driven Action Flow

start
:Load design/persistant-memory/intention-design.md and recognize incoming EVENT
[acts on: IntentArchitecture, ImplementationArchitecture, CodeReality];

if (EVENT: New task or requirement?) then (new task)
  :Read design/KG/SystemArchitecture.json, implementation contracts, and evidence for enough intent context
  [acts on: IntentArchitecture, TraceabilityPointer, ImplementationArchitecture, CodeReality];
  if (Task is anchored to an intent element?) then (yes)
    :MCP tool: argo.getIntentElementContext
    Read dependency subgraph as coverage context
    [acts on: DependencySubgraph, ArchitectureEntityElement, IntentRelationship, CoverageMatrix];
  endif
  :Classify whether the required change belongs to intent, implementation architecture, or code reality
  [acts on: IntentArchitecture, ImplementationArchitecture, CodeReality];
  if (Intent ontology must change?) then (yes)
    :Shape intent deltas and acceptance coverage at the ontology level
    [acts on: IntentElement, IntentRelationship, View, Principle, Constraint, ExplicitAcceptanceTestcase, FunctionalPoint, CoverageMatrix];
    :MCP tools: argo.previewSystemArchitectureMutation then argo.applySystemArchitectureMutation
    Persist approved graph mutation to design/KG/SystemArchitecture.json
    [acts on: IntentArchitecture, IntentElement, IntentRelationship, ExplicitAcceptanceTestcase];
    :MCP tool: argo.validateSystemArchitecture
    Validate changed intent ontology
    [acts on: IntentArchitecture];
  endif
  :Write design/KG/IntentToImplementationHandoff.json only at architecture-element granularity
  [acts on: IntentToImplementationHandoff, ArchitectureEntityElement, CoverageMatrix];
  :MCP tool: argo.validateStageHandoff
  stage = "intent-to-implementation"
  Validate handoff
  [acts on: IntentToImplementationHandoff];

elseif (EVENT: Intent architecture audit?) then (audit)
  :Audit graph semantics, coverage, and traceability without assuming implementation fixes
  [acts on: IntentArchitecture, IntentElement, IntentRelationship, ExplicitAcceptanceTestcase, CoverageMatrix, TraceabilityPointer];
  if (Audit scope has a focus element?) then (yes)
    :MCP tool: argo.getIntentElementContext
    Read focus dependency subgraph
    [acts on: DependencySubgraph, ArchitectureEntityElement, CoverageMatrix];
  endif
  :Classify findings as intent defects, implementation-architecture gaps, or code drift
  [acts on: IntentArchitecture, ImplementationArchitecture, CodeReality, CoverageMatrix];
  if (Approved audit fix requires graph mutation?) then (yes)
    :MCP tools: argo.previewSystemArchitectureMutation then argo.applySystemArchitectureMutation
    Apply approved audit mutation
    [acts on: IntentArchitecture, IntentElement, IntentRelationship, ExplicitAcceptanceTestcase];
    :MCP tool: argo.validateSystemArchitecture
    Validate audit mutation
    [acts on: IntentArchitecture];
  endif

elseif (EVENT: Handoff or validation blocker repair?) then (blocker)
  :Repair the minimal blocked intent-side file: design/KG/SystemArchitecture.json or design/KG/IntentToImplementationHandoff.json
  [acts on: IntentArchitecture, IntentToImplementationHandoff, CoverageMatrix];
  :MCP tool: argo.validateStageHandoff
  stage = "intent-to-implementation"
  Re-validate repaired handoff
  [acts on: IntentToImplementationHandoff];
else (other)
  :Ask for the missing event frame before changing ontology artifacts
  [acts on: IntentArchitecture, ImplementationArchitecture, CodeReality];
endif

:Write session-level decisions and unresolved ontology risks to design/persistant-memory/intention-design.md
[acts on: IntentArchitecture, CoverageMatrix, IntentToImplementationHandoff];
stop
@enduml
```