---
name: architecture-talk-deck
description: "Generates a project talk deck and speaker script from an ArchiMate intent architecture subgraph through design mechanisms to delivery evidence. Use when the user asks for a PPT, presentation, briefing deck, talk script, or walkthrough scoped by architecture view, element, subgraph, or project trace."
argument-hint: architecture-subgraph-scope
disable-model-invocation: true
---

# Architecture Talk Deck

Use when the user wants a PPT, presentation, briefing deck, talk script, or architecture walkthrough from an ArchiMate view, element, subgraph, or project trace.

## Domain Ontology

```plantuml
@startuml ArchitectureTalkDeck_Cognition
skinparam classAttributeIconSize 0
title Architecture Talk Deck Domain Ontology

package "Architecture Scope Ontology" {
  class ScopeRequest {
    +rawArgument
    +focusKind = "view|element|relationship|natural-language|multi-focus"
    +focusIdOrName
    +audience
    +projectType = "software|non-software|mixed|unknown"
  }

  class ArchiMateSubgraph {
    +focus
    +elements
    +relationships
    +views
    +boundaryRule = "inside requested scope unless user asks upstream/downstream"
  }

  abstract class ArchitectureElement {
    +id
    +name
    +type
    +attributes
    +semanticRole
  }

  abstract class ArchitectureRelationship {
    +id
    +type
    +source
    +target
    +directionalSemantics
  }

  class KeySubgraph {
    +includedElements
    +includedRelationships
    +inboundDependencies
    +outboundDependencies
    +riskIfMisunderstood
  }

  class KeyArchitectureElement {
    +elementId
    +role = "hub|bridge|gate|risk|user-focus"
    +responsibility
    +inboundDependencies
    +outboundDependencies
  }
}

package "Argument Ontology" {
  class ArchitectureThesis {
    +claim
    +systemicProblem
    +architectureArrangement
  }

  class GoverningThought {
    +answer
    +designMechanism
    +evidenceGuarantee
  }

  class SCQAFrame {
    +situation
    +complication
    +question
    +answer
  }

  class MECEArgumentGroup {
    +name = "architecture intent|design mechanism|delivery evidence"
    +claim
    +evidencePoints
    +speakerNotes
  }

  class DependencyStoryline {
    +mainChain
    +supportingBranches
    +orderingRationale
  }
}

package "Traceability Ontology" {
  class DesignMechanism {
    +contractOrProcess
    +boundary
    +owner
    +interfaceOrHandoff
  }

  class DeliveryEvidence {
    +artifact
    +observable
    +status = "mapped|gap|unverified"
    +source
  }

  class TraceabilityMatrix {
    +intentElement
    +designMechanism
    +deliveryEvidence
    +status
  }
}

package "Policy Ontology" {
  class ArchitectureFirstPolicy {
    +treatIntentArchitectureAsGenericArchiMate
    +doNotUseArgoStagesAsMainStoryUnlessRequested
    +deriveArchitectureThesisBeforeEvidence
  }

  class PyramidPrinciplePolicy {
    +governingThoughtFirst
    +SCQAOpeningRequired
    +MECEArgumentGroupsRequired
    +judgmentTitlesOnly
  }

  class DependencyExpansionPolicy {
    +overviewFirst
    +storylineFromRelationshipDirection
    +zoomInKeySubgraphs
    +deepDiveKeyElements
    +closeWithEvidenceMatrix
  }

  class ProjectTypePolicy {
    +classifyBeforeEvidenceMapping
    +softwareMayUseCodeAndTests
    +nonSoftwareUsesArtifactsProcessesMetricsReviews
    +neverAssumeCodeExists
  }

  class EvidencePolicy {
    +factsNeedSources
    +missingEvidenceMarkedExplicitly
    +separateFactInferenceRecommendation
    +doNotInvent
  }

  class VisualDesignPolicy {
    +style = "executive architecture briefing"
    +oneConclusionPerSlide
    +maxThreeMainBlocks
    +diagramFirst
    +lowToMediumDensity
  }

  class AssetPolicy {
    +useOwnedUserLicensedOrOriginalAssetsOnly
    +doNotCopyThirdPartyTemplatesOrImages
    +noCompetitorDeckReconstruction
    +ordinaryDeckUsesMermaidPlantUMLTablesShapes
  }

  class MutationPolicy {
    +readOnlyPresentationTask
    +mustNotModifyArchitectureGraph
    +mustNotModifyHandoffsContractsDeliverablesCodeTests
  }
}

package "Deck Ontology" {
  class DeckPlan {
    +sections = "SCQA|dependency expansion|intent|mechanism|evidence|closure"
    +slideCount
    +dependencyExpansionPages
  }

  class Slide {
    +judgmentTitle
    +visualSpec
    +evidenceSource
    +speakerNotes
  }

  class VisualDesignSpec {
    +style = "executive architecture briefing"
    +layout
    +diagramType
    +assetPolicy
  }

  class OutputArtifact {
    +deckMd = "docs/YYYY-MM-DD-[scope]-讲稿/deck.md"
    +traceabilityMd
    +scopeJson
    +optionalPptx
  }

  class QualityGate {
    +scopeResolved
    +dependencyStorylineExists
    +architectureThesisExists
    +governingThoughtExists
    +MECEPass
    +evidenceMappedOrGapMarked
    +visualPolicyPass
    +assetPolicyPass
  }
}

ScopeRequest --> ArchiMateSubgraph : resolves
ArchiMateSubgraph o-- ArchitectureElement
ArchiMateSubgraph o-- ArchitectureRelationship
ArchiMateSubgraph --> KeySubgraph : partitions
ArchiMateSubgraph --> KeyArchitectureElement : selects
ArchitectureRelationship --> DependencyStoryline : orders
DependencyStoryline --> ArchitectureThesis : supports
ArchitectureThesis --> GoverningThought : condenses
GoverningThought --> SCQAFrame : answers
GoverningThought --> MECEArgumentGroup : decomposes
KeySubgraph --> Slide : zoom-in page
KeyArchitectureElement --> Slide : deep-dive page
MECEArgumentGroup --> DeckPlan : structures
DesignMechanism --> TraceabilityMatrix
DeliveryEvidence --> TraceabilityMatrix
TraceabilityMatrix --> Slide : evidence map
ArchitectureFirstPolicy --> ArchitectureThesis : constrains
PyramidPrinciplePolicy --> DeckPlan : constrains
DependencyExpansionPolicy --> DependencyStoryline : constrains
ProjectTypePolicy --> DeliveryEvidence : constrains
EvidencePolicy --> TraceabilityMatrix : constrains
VisualDesignPolicy --> VisualDesignSpec : constrains
AssetPolicy --> VisualDesignSpec : constrains
MutationPolicy --> OutputArtifact : read-only boundary
VisualDesignSpec --> Slide : constrains
DeckPlan --> OutputArtifact : materializes
QualityGate --> OutputArtifact : validates
@enduml
```

## Behavior

```plantuml
@startuml ArchitectureTalkDeck_Behavior
title Architecture Talk Deck Behavior
start
:Receive architecture-talk request;
:Instantiate ScopeRequest from user argument;
:Resolve focus by view_id, view_name, elementId, elementName, relationship, multi-focus, or natural language;

if (Scope ambiguous?) then (yes)
  :Ask user to choose candidate view/element/relationship/subgraph;
  stop
else (no)
endif

:Load ArchiMateSubgraph from SystemArchitecture;
:Apply MutationPolicy(read-only);
:Classify project type and available fact sources;

if (Non-software or mixed project?) then (yes)
  :Use project artifacts, processes, metrics, reviews, acceptance materials as DeliveryEvidence;
else (software)
  :Allow code, tests, runtime outputs, docs, artifacts as DeliveryEvidence;
endif

:Build DependencyStoryline from relationship direction;
:Select main chain and 1-2 necessary supporting branches;
:Select KeySubgraphs by view, parent element, relationship cluster, boundary, or risk;
:Select KeyArchitectureElements by hub, bridge, gate, risk, or user focus;

if (No clear dependency storyline?) then (yes)
  :Report missing relationship evidence and candidate storylines;
  stop
else (no)
endif

:Derive ArchitectureThesis from ArchiMate element types, relationship types, directions, and view structure;
:Derive GoverningThought as the top answer;
:Build SCQAFrame;
:Decompose GoverningThought into MECEArgumentGroups;

if (MECE groups overlap or no governing thought?) then (yes)
  :Restructure groups or ask user to confirm candidate thesis;
  stop
else (no)
endif

:Map intent elements to DesignMechanisms;
:Map DesignMechanisms to DeliveryEvidence;
:Mark missing evidence as explicit gaps;
:Separate Fact, Inference, and Recommendation;

:Create overview slide with scoped dependency graph;
:Create DependencyStoryline navigation slide;

while (KeySubgraph remains) is (yes)
  :Create Subgraph Zoom-In slide with inbound/outbound dependencies, boundary, risk;
endwhile (no)

while (KeyArchitectureElement remains) is (yes)
  :Create Element Deep-Dive slide with responsibility, inbound/outbound dependencies, mechanism, evidence;
endwhile (no)

:Create pyramid argument slides with judgment titles;
:Create traceability/evidence closure slides;
:Apply VisualDesignPolicy and AssetPolicy;

if (External image or icon needed?) then (yes)
  if (Owned, user-provided, licensed, or original-generated?) then (yes)
    :Use asset and record source;
  else (no)
    :Replace with Mermaid, PlantUML, table, or abstract shapes;
  endif
else (no)
endif

:Write OutputArtifact(deck.md, traceability.md, scope.json);

if (User requested pptx?) then (yes)
  :Export from deck.md without changing argument structure;
else (no)
endif

:Run QualityGate(scope, dependency, pyramid, evidence, visual, asset, read-only);

if (QualityGate failed?) then (yes)
  :Fix deck artifacts or report blocker/gap explicitly;
else (pass)
  :Return output paths, ArchitectureThesis, GoverningThought, DependencyStoryline, key subgraph/element pages, visual/asset notes, evidence gaps;
endif

stop
@enduml
```
