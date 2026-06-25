# ARGO and Cursor Bundle

Generated from `.argo, .cursor`.

## File Index

- `.argo/schema/ImplementationToCodingHandoff.schema.json`
- `.argo/schema/ImplementationToIntentTraceProposal.schema.json`
- `.argo/schema/IntentToImplementationHandoff.schema.json`
- `.argo/schema/SystemArchitecture.schema.json`
- `.argo/scripts/archimate32-rules.js`
- `.argo/scripts/argo-mcp-server.js`
- `.argo/scripts/runArchitectureTests.js`
- `.argo/scripts/systemarchitecture-mcp-server.js`
- `.argo/scripts/validateStageHandoff.js`
- `.argo/scripts/validateSystemArchitecture.js`
- `.argo/scripts/validateTraceProposal.js`
- `.argo/scripts/validator-mcp-server.js`
- `.cursor/.obsidian/app.json`
- `.cursor/.obsidian/appearance.json`
- `.cursor/.obsidian/community-plugins.json`
- `.cursor/.obsidian/core-plugins.json`
- `.cursor/.obsidian/plugins/obsidian-plantuml/main.js`
- `.cursor/.obsidian/plugins/obsidian-plantuml/manifest.json`
- `.cursor/.obsidian/plugins/obsidian-plantuml/styles.css`
- `.cursor/.obsidian/workspace.json`
- `.cursor/agents/ArchimateLanguagistAudit.md`
- `.cursor/agents/CodingAndReparing.md`
- `.cursor/agents/ImplementationDesign.md`
- `.cursor/agents/IntentionDesign.md`
- `.cursor/agents/teacher.md`
- `.cursor/mcp.json`
- `.cursor/README.md`
- `.cursor/skills/brief/SKILL.md`
- `.cursor/skills/business-partner/SKILL.md`
- `.cursor/skills/coding-delivery-acceptance/SKILL.md`
- `.cursor/skills/coding-gap-report/SKILL.md`
- `.cursor/skills/delivery-archive/SKILL.md`
- `.cursor/skills/distill-agent-rules/SKILL.md`
- `.cursor/skills/grill-me/SKILL.md`
- `.cursor/skills/impl-gap-report/SKILL.md`
- `.cursor/skills/implementation-delivery-acceptance/SKILL.md`
- `.cursor/skills/improve-codebase-architecture/DEEPENING.md`
- `.cursor/skills/improve-codebase-architecture/LANGUAGE.md`
- `.cursor/skills/improve-codebase-architecture/PROCESS.md`
- `.cursor/skills/improve-codebase-architecture/REPOSITORY-MAPPING.md`
- `.cursor/skills/improve-codebase-architecture/SKILL.md`
- `.cursor/skills/market-research/SKILL.md`
- `.cursor/skills/orchestrating/SKILL.md`
- `.cursor/skills/task-tidy/SKILL.md`

## File Contents

### `.argo/schema/ImplementationToCodingHandoff.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "./.argo/schema/ImplementationToCodingHandoff.schema.json",
  "title": "Implementation To Coding Handoff Schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "stage",
    "generatedAt",
    "sourceIntentGraphPath",
    "implementationContracts",
    "explicitEntrypoints",
    "criticalNonExplicitTests",
    "expectedFailureRecordsPath",
    "codingTargets",
    "taskExecutionPlan",
    "frozenFiles"
  ],
  "properties": {
    "stage": {
      "type": "string",
      "const": "implementation-to-coding"
    },
    "generatedAt": {
      "type": "string"
    },
    "sourceIntentGraphPath": {
      "type": "string"
    },
    "summary": {
      "type": "string"
    },
    "implementationContracts": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string"
      }
    },
    "explicitEntrypoints": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/explicitEntrypoint"
      }
    },
    "criticalNonExplicitTests": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/nonExplicitTest"
      }
    },
    "supportingNonExplicitTests": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/nonExplicitTest"
      }
    },
    "expectedFailureRecordsPath": {
      "type": "string"
    },
    "codingTargets": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/codingTarget"
      }
    },
    "taskExecutionPlan": {
      "$ref": "#/$defs/taskExecutionPlan"
    },
    "frozenFiles": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string"
      }
    },
    "openGaps": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "$defs": {
    "explicitEntrypoint": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "testcaseName",
        "entryPath",
        "controlPoint",
        "observationPoint",
        "initialExecutionStatus",
        "initialExecutionCommand"
      ],
      "properties": {
        "testcaseName": {
          "type": "string"
        },
        "entryPath": {
          "type": "string"
        },
        "controlPoint": {
          "type": "string"
        },
        "observationPoint": {
          "type": "string"
        },
        "initialExecutionStatus": {
          "type": "string",
          "enum": [
            "passed",
            "failed"
          ]
        },
        "initialExecutionCommand": {
          "type": "string"
        },
        "failureReason": {
          "type": "string"
        }
      }
    },
    "nonExplicitTest": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "path",
        "controlPoint",
        "observationPoint"
      ],
      "properties": {
        "name": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "kind": {
          "type": "string"
        },
        "controlPoint": {
          "type": "string"
        },
        "observationPoint": {
          "type": "string"
        },
        "expectedStatus": {
          "type": "string",
          "enum": [
            "passed",
            "failed"
          ]
        }
      }
    },
    "codingTarget": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "failureSignal",
        "nextAction"
      ],
      "properties": {
        "testcaseName": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "failureSignal": {
          "type": "string"
        },
        "nextAction": {
          "type": "string"
        }
      }
    },
    "taskExecutionPlan": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "executionStrategy",
        "tasks"
      ],
      "properties": {
        "executionStrategy": {
          "type": "string"
        },
        "tasks": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/codingTask"
          }
        }
      }
    },
    "codingTask": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "taskId",
        "title",
        "objective",
        "steps",
        "completionSignal"
      ],
      "properties": {
        "taskId": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "objective": {
          "type": "string"
        },
        "dependsOn": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "relatedTestcases": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "targetPaths": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "steps": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string"
          }
        },
        "completionSignal": {
          "type": "string"
        }
      }
    }
  }
}
```

### `.argo/schema/ImplementationToIntentTraceProposal.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "./.argo/schema/ImplementationToIntentTraceProposal.schema.json",
  "title": "Implementation To Intent Trace Proposal Schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "proposalType",
    "generatedAt",
    "sourceAgent",
    "targetAgent",
    "lifecycle",
    "sourceIntentGraphPath",
    "implementationContracts",
    "anchorProposals"
  ],
  "properties": {
    "proposalType": {
      "type": "string",
      "const": "implementation-to-intent-trace"
    },
    "generatedAt": {
      "type": "string"
    },
    "sourceAgent": {
      "type": "string",
      "const": "ImplementationDesign"
    },
    "targetAgent": {
      "type": "string",
      "const": "IntentionDesign"
    },
    "lifecycle": {
      "type": "string",
      "const": "temporary-trace-proposal"
    },
    "sourceIntentGraphPath": {
      "type": "string"
    },
    "implementationContracts": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string"
      }
    },
    "anchorProposals": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/anchorProposal"
      }
    },
    "openQuestions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/openQuestion"
      }
    },
    "notes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "$defs": {
    "anchorProposal": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "intentElementId",
        "implementationElementName",
        "implementationElementKind",
        "implementsType",
        "tracePurpose",
        "contractPaths",
        "contextEntryPoints",
        "excludedDetails"
      ],
      "properties": {
        "intentElementId": {
          "type": "string"
        },
        "intentElementName": {
          "type": "string"
        },
        "implementationElementName": {
          "type": "string"
        },
        "implementationElementKind": {
          "type": "string",
          "enum": [
            "stable-directory",
            "contract-file",
            "explicit-test-entry",
            "critical-guardrail",
            "runtime-component",
            "schema-contract",
            "mcp-tool",
            "command"
          ]
        },
        "implementsType": {
          "type": "string",
          "enum": [
            "direct",
            "indirect"
          ]
        },
        "tracePurpose": {
          "type": "string"
        },
        "contractPaths": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string"
          }
        },
        "contextEntryPoints": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string"
          }
        },
        "excludedDetails": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string"
          }
        },
        "suggestedIntentAttributes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/intentAttribute"
          }
        }
      }
    },
    "intentAttribute": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "name",
        "description"
      ],
      "properties": {
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        }
      }
    },
    "openQuestion": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "question",
        "recommendedAnswer",
        "reason"
      ],
      "properties": {
        "question": {
          "type": "string"
        },
        "recommendedAnswer": {
          "type": "string"
        },
        "reason": {
          "type": "string"
        }
      }
    }
  }
}
```

### `.argo/schema/IntentToImplementationHandoff.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "./.argo/schema/IntentToImplementationHandoff.schema.json",
  "title": "Intent To Implementation Handoff Schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "stage",
    "generatedAt",
    "sourceIntentGraphPath",
    "intentElementIds"
  ],
  "properties": {
    "stage": {
      "type": "string",
      "const": "intent-to-implementation"
    },
    "generatedAt": {
      "type": "string"
    },
    "sourceIntentGraphPath": {
      "type": "string"
    },
    "summary": {
      "type": "string"
    },
    "intentElementIds": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string"
      }
    },
    "relationshipIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "openQuestions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/openQuestion"
      }
    },
    "notes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "$defs": {
    "openQuestion": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "question",
        "recommendedAnswer",
        "reason"
      ],
      "properties": {
        "question": {
          "type": "string"
        },
        "recommendedAnswer": {
          "type": "string"
        },
        "reason": {
          "type": "string"
        }
      }
    }
  }
}
```

### `.argo/schema/SystemArchitecture.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "./.argo/schema/SystemArchitecture.schema.json",
  "title": "SystemArchitecture Knowledge Graph Schema",
  "description": "Schema for design/KG/SystemArchitecture.json. The repository keeps its existing knowledge-graph shape, while ArchiMate 3.2 terminology is enforced for element and relationship concepts.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "name",
    "description",
    "elements",
    "relationships",
    "views"
  ],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string",
      "minLength": 1
    },
    "attributes": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/attribute"
      }
    },
    "elements": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/element"
      }
    },
    "relationships": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/relationship"
      }
    },
    "views": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/view"
      }
    }
  },
  "$defs": {
    "identifier": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]*$"
    },
    "nonEmptyString": {
      "type": "string",
      "minLength": 1
    },
    "archimateElementType": {
      "type": "string",
      "enum": [
        "Resource",
        "Capability",
        "Value Stream",
        "Course of Action",
        "Business Actor",
        "Business Role",
        "Business Collaboration",
        "Business Interface",
        "Business Process",
        "Business Function",
        "Business Interaction",
        "Business Event",
        "Business Service",
        "Business Object",
        "Contract",
        "Representation",
        "Product",
        "Application Component",
        "Application Collaboration",
        "Application Interface",
        "Application Process",
        "Application Function",
        "Application Interaction",
        "Application Event",
        "Application Service",
        "Data Object",
        "Node",
        "Device",
        "System Software",
        "Technology Collaboration",
        "Technology Interface",
        "Path",
        "Communication Network",
        "Technology Process",
        "Technology Function",
        "Technology Interaction",
        "Technology Event",
        "Technology Service",
        "Artifact",
        "Equipment",
        "Facility",
        "Distribution Network",
        "Material",
        "Stakeholder",
        "Driver",
        "Assessment",
        "Goal",
        "Outcome",
        "Principle",
        "Requirement",
        "Constraint",
        "Meaning",
        "Value",
        "Work Package",
        "Deliverable",
        "Implementation Event",
        "Plateau",
        "Gap",
        "Grouping",
        "Location",
        "And Junction",
        "Or Junction"
      ]
    },
    "archimateRelationshipType": {
      "type": "string",
      "enum": [
        "Association",
        "Composition",
        "Aggregation",
        "Assignment",
        "Realization",
        "Serving",
        "Access",
        "Influence",
        "Triggering",
        "Flow",
        "Specialization"
      ]
    },
    "attribute": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "name"
      ],
      "description": "Generic EA-style attribute container. Use this for architecture annotations such as verification_focus, external_scope, acceptance_outcomes, and design_risks instead of introducing dedicated top-level fields.",
      "properties": {
        "name": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "description": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "content": {
          "type": "string"
        }
      }
    },
    "subdiagramView": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "view_id",
        "view_name"
      ],
      "properties": {
        "view_id": {
          "$ref": "#/$defs/identifier"
        },
        "view_name": {
          "$ref": "#/$defs/nonEmptyString"
        }
      }
    },
    "testcase": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "name",
        "description",
        "type",
        "Input",
        "acceptanceCriteria"
      ],
      "properties": {
        "name": {
          "$ref": "#/$defs/nonEmptyString",
          "description": "Stable testcase identifier. Use the testcase name itself as the long-lived identity; do not add a separate testcase id field."
        },
        "description": {
          "$ref": "#/$defs/nonEmptyString",
          "description": "Place the intent being verified here. Each testcase should normally be mounted under exactly one element rather than using extra verifies_elements or verifies_intents fields."
        },
        "type": {
          "type": "string",
          "enum": [
            "Acceptance Test"
          ]
        },
        "Input": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "acceptanceCriteria": {
          "$ref": "#/$defs/nonEmptyString",
          "description": "By the end of implementation design, this must be the concrete workspace-relative executable testcase entrypoint for the testcase, optionally including a pytest node id selector such as tests/test_x.py::test_y, rather than descriptive prose."
        },
        "TestResults": {
          "$ref": "#/$defs/nonEmptyString"
        }
      }
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "name",
        "type"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/identifier"
        },
        "name": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "parent": {
          "$ref": "#/$defs/identifier"
        },
        "type": {
          "$ref": "#/$defs/archimateElementType"
        },
        "alias": {
          "type": "string"
        },
        "classifier": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "attributes": {
          "type": "array",
          "description": "Use attributes to store additional architecture intent metadata, including verification_focus, external_scope, acceptance_outcomes, and design_risks.",
          "items": {
            "$ref": "#/$defs/attribute"
          }
        },
        "subdiagram_views": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/subdiagramView"
          }
        },
        "testcases": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/testcase"
          }
        }
      }
    },
    "relationshipAttribute": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "name"
      ],
      "properties": {
        "name": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "description": {
          "$ref": "#/$defs/nonEmptyString"
        }
      }
    },
    "relationship": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "statement",
        "name",
        "type",
        "source_id",
        "target_id",
        "source_name",
        "target_name"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/identifier"
        },
        "statement": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "name": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "type": {
          "$ref": "#/$defs/archimateRelationshipType"
        },
        "description": {
          "type": "string"
        },
        "document": {
          "type": "string"
        },
        "attributes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/relationshipAttribute"
          }
        },
        "source_id": {
          "$ref": "#/$defs/identifier"
        },
        "target_id": {
          "$ref": "#/$defs/identifier"
        },
        "source_name": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "target_name": {
          "$ref": "#/$defs/nonEmptyString"
        }
      }
    },
    "view": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "view_id",
        "view_name"
      ],
      "properties": {
        "view_id": {
          "$ref": "#/$defs/identifier"
        },
        "view_name": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "parent_element_id": {
          "$ref": "#/$defs/identifier"
        },
        "parent_element_name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "included_elements": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/identifier"
          }
        },
        "included_relationships": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/identifier"
          }
        }
      }
    }
  }
}
```

### `.argo/scripts/archimate32-rules.js`

```javascript
// Generated from Linked.Archi ArchiMate 3.2 SHACL shapes.
// Source: https://meta.linked.archi/archimate3/shapes

const ELEMENT_TYPE_METADATA_ENTRIES = [
  [
    "Resource",
    {
      "layer": "Strategy",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Capability",
    {
      "layer": "Strategy",
      "aspect": "Behavior"
    }
  ],
  [
    "Value Stream",
    {
      "layer": "Strategy",
      "aspect": "Behavior"
    }
  ],
  [
    "Course of Action",
    {
      "layer": "Strategy",
      "aspect": "Behavior"
    }
  ],
  [
    "Business Actor",
    {
      "layer": "Business",
      "aspect": "Active Structure"
    }
  ],
  [
    "Business Role",
    {
      "layer": "Business",
      "aspect": "Active Structure"
    }
  ],
  [
    "Business Collaboration",
    {
      "layer": "Business",
      "aspect": "Active Structure"
    }
  ],
  [
    "Business Interface",
    {
      "layer": "Business",
      "aspect": "Active Structure"
    }
  ],
  [
    "Business Process",
    {
      "layer": "Business",
      "aspect": "Behavior"
    }
  ],
  [
    "Business Function",
    {
      "layer": "Business",
      "aspect": "Behavior"
    }
  ],
  [
    "Business Interaction",
    {
      "layer": "Business",
      "aspect": "Behavior"
    }
  ],
  [
    "Business Event",
    {
      "layer": "Business",
      "aspect": "Behavior"
    }
  ],
  [
    "Business Service",
    {
      "layer": "Business",
      "aspect": "Behavior"
    }
  ],
  [
    "Business Object",
    {
      "layer": "Business",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Contract",
    {
      "layer": "Business",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Representation",
    {
      "layer": "Business",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Product",
    {
      "layer": "Business",
      "aspect": "Composite"
    }
  ],
  [
    "Application Component",
    {
      "layer": "Application",
      "aspect": "Active Structure"
    }
  ],
  [
    "Application Collaboration",
    {
      "layer": "Application",
      "aspect": "Active Structure"
    }
  ],
  [
    "Application Interface",
    {
      "layer": "Application",
      "aspect": "Active Structure"
    }
  ],
  [
    "Application Process",
    {
      "layer": "Application",
      "aspect": "Behavior"
    }
  ],
  [
    "Application Function",
    {
      "layer": "Application",
      "aspect": "Behavior"
    }
  ],
  [
    "Application Interaction",
    {
      "layer": "Application",
      "aspect": "Behavior"
    }
  ],
  [
    "Application Event",
    {
      "layer": "Application",
      "aspect": "Behavior"
    }
  ],
  [
    "Application Service",
    {
      "layer": "Application",
      "aspect": "Behavior"
    }
  ],
  [
    "Data Object",
    {
      "layer": "Application",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Node",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "Device",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "System Software",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "Technology Collaboration",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "Technology Interface",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "Path",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "Communication Network",
    {
      "layer": "Technology",
      "aspect": "Active Structure"
    }
  ],
  [
    "Technology Process",
    {
      "layer": "Technology",
      "aspect": "Behavior"
    }
  ],
  [
    "Technology Function",
    {
      "layer": "Technology",
      "aspect": "Behavior"
    }
  ],
  [
    "Technology Interaction",
    {
      "layer": "Technology",
      "aspect": "Behavior"
    }
  ],
  [
    "Technology Event",
    {
      "layer": "Technology",
      "aspect": "Behavior"
    }
  ],
  [
    "Technology Service",
    {
      "layer": "Technology",
      "aspect": "Behavior"
    }
  ],
  [
    "Artifact",
    {
      "layer": "Technology",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Equipment",
    {
      "layer": "Physical",
      "aspect": "Active Structure"
    }
  ],
  [
    "Facility",
    {
      "layer": "Physical",
      "aspect": "Active Structure"
    }
  ],
  [
    "Distribution Network",
    {
      "layer": "Physical",
      "aspect": "Active Structure"
    }
  ],
  [
    "Material",
    {
      "layer": "Physical",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Stakeholder",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Driver",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Assessment",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Goal",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Outcome",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Principle",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Requirement",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Constraint",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Meaning",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Value",
    {
      "layer": "Motivation",
      "aspect": "Motivation"
    }
  ],
  [
    "Work Package",
    {
      "layer": "Implementation & Migration",
      "aspect": "Behavior"
    }
  ],
  [
    "Deliverable",
    {
      "layer": "Implementation & Migration",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Implementation Event",
    {
      "layer": "Implementation & Migration",
      "aspect": "Behavior"
    }
  ],
  [
    "Plateau",
    {
      "layer": "Implementation & Migration",
      "aspect": "Composite"
    }
  ],
  [
    "Gap",
    {
      "layer": "Implementation & Migration",
      "aspect": "Passive Structure"
    }
  ],
  [
    "Grouping",
    {
      "layer": "Other",
      "aspect": "Composite"
    }
  ],
  [
    "Location",
    {
      "layer": "Other",
      "aspect": "Composite"
    }
  ],
  [
    "And Junction",
    {
      "layer": "Other",
      "aspect": "Relationship Connector"
    }
  ],
  [
    "Or Junction",
    {
      "layer": "Other",
      "aspect": "Relationship Connector"
    }
  ]
];

const RELATIONSHIP_CATEGORY_ENTRIES = [
  [
    "Composition",
    "Structural"
  ],
  [
    "Aggregation",
    "Structural"
  ],
  [
    "Assignment",
    "Structural"
  ],
  [
    "Realization",
    "Structural"
  ],
  [
    "Serving",
    "Dependency"
  ],
  [
    "Access",
    "Dependency"
  ],
  [
    "Influence",
    "Dependency"
  ],
  [
    "Triggering",
    "Dynamic"
  ],
  [
    "Flow",
    "Dynamic"
  ],
  [
    "Association",
    "Other"
  ],
  [
    "Specialization",
    "Other"
  ]
];

const ARCHIMATE_CLASS_BY_ELEMENT_TYPE = {
  "Resource": "Resource",
  "Capability": "Capability",
  "Value Stream": "ValueStream",
  "Course of Action": "CourseofAction",
  "Business Actor": "BusinessActor",
  "Business Role": "BusinessRole",
  "Business Collaboration": "BusinessCollaboration",
  "Business Interface": "BusinessInterface",
  "Business Process": "BusinessProcess",
  "Business Function": "BusinessFunction",
  "Business Interaction": "BusinessInteraction",
  "Business Event": "BusinessEvent",
  "Business Service": "BusinessService",
  "Business Object": "BusinessObject",
  "Contract": "Contract",
  "Representation": "Representation",
  "Product": "Product",
  "Application Component": "ApplicationComponent",
  "Application Collaboration": "ApplicationCollaboration",
  "Application Interface": "ApplicationInterface",
  "Application Process": "ApplicationProcess",
  "Application Function": "ApplicationFunction",
  "Application Interaction": "ApplicationInteraction",
  "Application Event": "ApplicationEvent",
  "Application Service": "ApplicationService",
  "Data Object": "DataObject",
  "Node": "Node",
  "Device": "Device",
  "System Software": "SystemSoftware",
  "Technology Collaboration": "TechnologyCollaboration",
  "Technology Interface": "TechnologyInterface",
  "Path": "Path",
  "Communication Network": "CommunicationNetwork",
  "Technology Process": "TechnologyProcess",
  "Technology Function": "TechnologyFunction",
  "Technology Interaction": "TechnologyInteraction",
  "Technology Event": "TechnologyEvent",
  "Technology Service": "TechnologyService",
  "Artifact": "Artifact",
  "Equipment": "Equipment",
  "Facility": "Facility",
  "Distribution Network": "DistributionNetwork",
  "Material": "Material",
  "Stakeholder": "Stakeholder",
  "Driver": "Driver",
  "Assessment": "Assessment",
  "Goal": "Goal",
  "Outcome": "Outcome",
  "Principle": "Principle",
  "Requirement": "Requirement",
  "Constraint": "Constraint",
  "Meaning": "Meaning",
  "Value": "Value",
  "Work Package": "WorkPackage",
  "Deliverable": "Deliverable",
  "Implementation Event": "ImplementationEvent",
  "Plateau": "Plateau",
  "Gap": "Gap",
  "Grouping": "Grouping",
  "Location": "Location",
  "And Junction": "Junction_And",
  "Or Junction": "Junction_Or"
};

const ELEMENT_TYPE_BY_ARCHIMATE_CLASS = {
  "Resource": "Resource",
  "Capability": "Capability",
  "ValueStream": "Value Stream",
  "CourseofAction": "Course of Action",
  "BusinessActor": "Business Actor",
  "BusinessRole": "Business Role",
  "BusinessCollaboration": "Business Collaboration",
  "BusinessInterface": "Business Interface",
  "BusinessProcess": "Business Process",
  "BusinessFunction": "Business Function",
  "BusinessInteraction": "Business Interaction",
  "BusinessEvent": "Business Event",
  "BusinessService": "Business Service",
  "BusinessObject": "Business Object",
  "Contract": "Contract",
  "Representation": "Representation",
  "Product": "Product",
  "ApplicationComponent": "Application Component",
  "ApplicationCollaboration": "Application Collaboration",
  "ApplicationInterface": "Application Interface",
  "ApplicationProcess": "Application Process",
  "ApplicationFunction": "Application Function",
  "ApplicationInteraction": "Application Interaction",
  "ApplicationEvent": "Application Event",
  "ApplicationService": "Application Service",
  "DataObject": "Data Object",
  "Node": "Node",
  "Device": "Device",
  "SystemSoftware": "System Software",
  "TechnologyCollaboration": "Technology Collaboration",
  "TechnologyInterface": "Technology Interface",
  "Path": "Path",
  "CommunicationNetwork": "Communication Network",
  "TechnologyProcess": "Technology Process",
  "TechnologyFunction": "Technology Function",
  "TechnologyInteraction": "Technology Interaction",
  "TechnologyEvent": "Technology Event",
  "TechnologyService": "Technology Service",
  "Artifact": "Artifact",
  "Equipment": "Equipment",
  "Facility": "Facility",
  "DistributionNetwork": "Distribution Network",
  "Material": "Material",
  "Stakeholder": "Stakeholder",
  "Driver": "Driver",
  "Assessment": "Assessment",
  "Goal": "Goal",
  "Outcome": "Outcome",
  "Principle": "Principle",
  "Requirement": "Requirement",
  "Constraint": "Constraint",
  "Meaning": "Meaning",
  "Value": "Value",
  "WorkPackage": "Work Package",
  "Deliverable": "Deliverable",
  "ImplementationEvent": "Implementation Event",
  "Plateau": "Plateau",
  "Gap": "Gap",
  "Grouping": "Grouping",
  "Location": "Location",
  "Junction_And": "And Junction",
  "Junction_Or": "Or Junction"
};

const RELATIONSHIP_TARGET_MATRIX = {
  "Access": {
    "ApplicationCollaboration": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationComponent": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationEvent": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationFunction": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationInteraction": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationInterface": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationProcess": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ApplicationService": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessActor": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessCollaboration": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessEvent": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessFunction": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessInteraction": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessInterface": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessProcess": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessRole": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "BusinessService": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "CommunicationNetwork": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Device": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "DistributionNetwork": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Equipment": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Facility": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Grouping": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Deliverable",
      "Grouping",
      "Material",
      "Representation"
    ],
    "ImplementationEvent": [
      "Deliverable",
      "Grouping"
    ],
    "Location": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Node": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Path": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "Plateau": [
      "Deliverable",
      "Grouping"
    ],
    "Product": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "SystemSoftware": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyCollaboration": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyEvent": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyFunction": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyInteraction": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyInterface": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyProcess": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "TechnologyService": [
      "Artifact",
      "BusinessObject",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Representation"
    ],
    "WorkPackage": [
      "Deliverable",
      "Grouping"
    ]
  },
  "Aggregation": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationComponent": [
      "ApplicationComponent",
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationEvent": [
      "ApplicationEvent",
      "Grouping"
    ],
    "ApplicationFunction": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationInteraction": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationInterface": [
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationProcess": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationService": [
      "ApplicationService",
      "Grouping"
    ],
    "Artifact": [
      "Artifact",
      "Grouping"
    ],
    "Assessment": [
      "Assessment",
      "Grouping"
    ],
    "BusinessActor": [
      "BusinessActor",
      "BusinessInterface",
      "Grouping"
    ],
    "BusinessCollaboration": [
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessInterface",
      "BusinessRole",
      "Grouping"
    ],
    "BusinessEvent": [
      "BusinessEvent",
      "Grouping"
    ],
    "BusinessFunction": [
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessInteraction": [
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessInterface": [
      "BusinessInterface",
      "Grouping"
    ],
    "BusinessObject": [
      "BusinessObject",
      "Contract",
      "Grouping"
    ],
    "BusinessProcess": [
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessRole": [
      "BusinessInterface",
      "BusinessRole",
      "Grouping"
    ],
    "BusinessService": [
      "BusinessService",
      "Grouping"
    ],
    "Capability": [
      "Capability",
      "Grouping"
    ],
    "CommunicationNetwork": [
      "CommunicationNetwork",
      "Device",
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Constraint": [
      "Constraint",
      "Grouping",
      "Requirement"
    ],
    "Contract": [
      "BusinessObject",
      "Contract",
      "Grouping"
    ],
    "CourseOfAction": [
      "CourseOfAction",
      "Grouping"
    ],
    "DataObject": [
      "DataObject",
      "Grouping"
    ],
    "Deliverable": [
      "Deliverable",
      "Grouping"
    ],
    "Device": [
      "Device",
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "DistributionNetwork": [
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Driver": [
      "Driver",
      "Grouping"
    ],
    "Equipment": [
      "Device",
      "Equipment",
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Facility": [
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Gap": [
      "Gap",
      "Grouping"
    ],
    "Goal": [
      "Goal",
      "Grouping"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ImplementationEvent": [
      "Grouping",
      "ImplementationEvent"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Material": [
      "Grouping",
      "Material"
    ],
    "Meaning": [
      "Grouping",
      "Meaning"
    ],
    "Node": [
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Outcome": [
      "Grouping",
      "Outcome"
    ],
    "Path": [
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "Path",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyInterface"
    ],
    "Plateau": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Location",
      "Material",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Principle": [
      "Grouping",
      "Principle"
    ],
    "Product": [
      "ApplicationService",
      "Artifact",
      "BusinessObject",
      "BusinessService",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Product",
      "Representation",
      "TechnologyService"
    ],
    "Representation": [
      "Grouping",
      "Representation"
    ],
    "Requirement": [
      "Constraint",
      "Grouping",
      "Requirement"
    ],
    "Resource": [
      "Grouping",
      "Resource"
    ],
    "Stakeholder": [
      "Grouping",
      "Stakeholder"
    ],
    "SystemSoftware": [
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "TechnologyCollaboration": [
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyInterface"
    ],
    "TechnologyEvent": [
      "Grouping",
      "TechnologyEvent"
    ],
    "TechnologyFunction": [
      "Grouping",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyProcess"
    ],
    "TechnologyInteraction": [
      "Grouping",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyProcess"
    ],
    "TechnologyInterface": [
      "Grouping",
      "TechnologyInterface"
    ],
    "TechnologyProcess": [
      "Grouping",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyProcess"
    ],
    "TechnologyService": [
      "Grouping",
      "TechnologyService"
    ],
    "Value": [
      "Grouping",
      "Value"
    ],
    "ValueStream": [
      "Grouping",
      "ValueStream"
    ],
    "WorkPackage": [
      "Grouping",
      "WorkPackage"
    ]
  },
  "Assignment": {
    "ApplicationCollaboration": [
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "Grouping"
    ],
    "ApplicationComponent": [
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "Grouping"
    ],
    "ApplicationInterface": [
      "ApplicationService",
      "Grouping"
    ],
    "BusinessActor": [
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Grouping",
      "ImplementationEvent",
      "Stakeholder",
      "WorkPackage"
    ],
    "BusinessCollaboration": [
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Grouping",
      "ImplementationEvent",
      "Stakeholder",
      "WorkPackage"
    ],
    "BusinessInterface": [
      "BusinessService",
      "Grouping"
    ],
    "BusinessRole": [
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Grouping",
      "ImplementationEvent",
      "Stakeholder",
      "WorkPackage"
    ],
    "CommunicationNetwork": [
      "Artifact",
      "Grouping",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Device": [
      "Artifact",
      "Grouping",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "DistributionNetwork": [
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "WorkPackage"
    ],
    "Equipment": [
      "Artifact",
      "Grouping",
      "Material",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Facility": [
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "WorkPackage"
    ],
    "Grouping": [
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream",
      "WorkPackage"
    ],
    "Location": [
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "WorkPackage"
    ],
    "Node": [
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "WorkPackage"
    ],
    "Path": [
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "WorkPackage"
    ],
    "Plateau": [
      "Grouping",
      "Stakeholder"
    ],
    "Resource": [
      "Capability",
      "Grouping",
      "ValueStream"
    ],
    "SystemSoftware": [
      "Artifact",
      "Grouping",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyCollaboration": [
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Material",
      "Node",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "WorkPackage"
    ],
    "TechnologyInterface": [
      "Grouping",
      "TechnologyService"
    ]
  },
  "Association": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationComponent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ApplicationService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Artifact": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Assessment": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessActor": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessObject": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessRole": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "BusinessService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Capability": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "CommunicationNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Constraint": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Contract": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "CourseOfAction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "DataObject": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Deliverable": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Device": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "DistributionNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Driver": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Equipment": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Facility": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Gap": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Goal": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ImplementationEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Material": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Meaning": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Node": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Outcome": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Path": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Plateau": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Principle": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Product": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Representation": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Requirement": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Resource": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Stakeholder": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "SystemSoftware": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "TechnologyService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Value": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ValueStream": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "WorkPackage": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ]
  },
  "Composition": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationComponent": [
      "ApplicationComponent",
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationEvent": [
      "ApplicationEvent",
      "Grouping"
    ],
    "ApplicationFunction": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationInteraction": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationInterface": [
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationProcess": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationService": [
      "ApplicationService",
      "Grouping"
    ],
    "Artifact": [
      "Artifact",
      "Grouping"
    ],
    "Assessment": [
      "Assessment",
      "Grouping"
    ],
    "BusinessActor": [
      "BusinessActor",
      "BusinessInterface",
      "Grouping"
    ],
    "BusinessCollaboration": [
      "BusinessCollaboration",
      "BusinessInterface",
      "Grouping"
    ],
    "BusinessEvent": [
      "BusinessEvent",
      "Grouping"
    ],
    "BusinessFunction": [
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessInteraction": [
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessInterface": [
      "BusinessInterface",
      "Grouping"
    ],
    "BusinessObject": [
      "BusinessObject",
      "Contract",
      "Grouping"
    ],
    "BusinessProcess": [
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessRole": [
      "BusinessInterface",
      "BusinessRole",
      "Grouping"
    ],
    "BusinessService": [
      "BusinessService",
      "Grouping"
    ],
    "Capability": [
      "Capability",
      "Grouping"
    ],
    "CommunicationNetwork": [
      "CommunicationNetwork",
      "Grouping"
    ],
    "Constraint": [
      "Constraint",
      "Grouping",
      "Requirement"
    ],
    "Contract": [
      "BusinessObject",
      "Contract",
      "Grouping"
    ],
    "CourseOfAction": [
      "CourseOfAction",
      "Grouping"
    ],
    "DataObject": [
      "DataObject",
      "Grouping"
    ],
    "Deliverable": [
      "Deliverable",
      "Grouping"
    ],
    "Device": [
      "Device",
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "DistributionNetwork": [
      "DistributionNetwork",
      "Grouping"
    ],
    "Driver": [
      "Driver",
      "Grouping"
    ],
    "Equipment": [
      "Device",
      "Equipment",
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Facility": [
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Gap": [
      "Gap",
      "Grouping"
    ],
    "Goal": [
      "Goal",
      "Grouping"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ImplementationEvent": [
      "Grouping",
      "ImplementationEvent"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "Material": [
      "Grouping",
      "Material"
    ],
    "Meaning": [
      "Grouping",
      "Meaning"
    ],
    "Node": [
      "Device",
      "Equipment",
      "Facility",
      "Grouping",
      "Node",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "Outcome": [
      "Grouping",
      "Outcome"
    ],
    "Path": [
      "Grouping",
      "Path"
    ],
    "Plateau": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Location",
      "Material",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Principle": [
      "Grouping",
      "Principle"
    ],
    "Product": [
      "ApplicationService",
      "Artifact",
      "BusinessObject",
      "BusinessService",
      "Contract",
      "DataObject",
      "Grouping",
      "Material",
      "Product",
      "Representation",
      "TechnologyService"
    ],
    "Representation": [
      "Grouping",
      "Representation"
    ],
    "Requirement": [
      "Constraint",
      "Grouping",
      "Requirement"
    ],
    "Resource": [
      "Grouping",
      "Resource"
    ],
    "Stakeholder": [
      "Grouping",
      "Stakeholder"
    ],
    "SystemSoftware": [
      "Grouping",
      "SystemSoftware",
      "TechnologyInterface"
    ],
    "TechnologyCollaboration": [
      "Grouping",
      "TechnologyCollaboration",
      "TechnologyInterface"
    ],
    "TechnologyEvent": [
      "Grouping",
      "TechnologyEvent"
    ],
    "TechnologyFunction": [
      "Grouping",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyProcess"
    ],
    "TechnologyInteraction": [
      "Grouping",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyProcess"
    ],
    "TechnologyInterface": [
      "Grouping",
      "TechnologyInterface"
    ],
    "TechnologyProcess": [
      "Grouping",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyProcess"
    ],
    "TechnologyService": [
      "Grouping",
      "TechnologyService"
    ],
    "Value": [
      "Grouping",
      "Value"
    ],
    "ValueStream": [
      "Grouping",
      "ValueStream"
    ],
    "WorkPackage": [
      "Grouping",
      "WorkPackage"
    ]
  },
  "Flow": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationComponent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessActor": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessRole": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Capability": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "CommunicationNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "CourseOfAction": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "Device": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "DistributionNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Equipment": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Facility": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "CourseOfAction",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "Resource",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Node": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Path": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Product": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Resource": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "SystemSoftware": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ValueStream": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ]
  },
  "Influence": {
    "ApplicationCollaboration": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationComponent": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationEvent": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationFunction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationInteraction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationInterface": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationProcess": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ApplicationService": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Artifact": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Assessment": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessActor": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessCollaboration": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessEvent": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessFunction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessInteraction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessInterface": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessObject": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessProcess": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessRole": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "BusinessService": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Capability": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "CommunicationNetwork": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Constraint": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Contract": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "CourseOfAction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "DataObject": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Deliverable": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Device": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "DistributionNetwork": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Driver": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Equipment": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Facility": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Goal": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Grouping": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ImplementationEvent": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Location": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Material": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Meaning": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Node": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Outcome": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Path": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Plateau": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Principle": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Product": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Representation": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Requirement": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Resource": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Stakeholder": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "SystemSoftware": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyCollaboration": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyEvent": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyFunction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyInteraction": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyInterface": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyProcess": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "TechnologyService": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "Value": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "ValueStream": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ],
    "WorkPackage": [
      "Assessment",
      "Constraint",
      "Driver",
      "Goal",
      "Grouping",
      "Meaning",
      "Outcome",
      "Principle",
      "Requirement",
      "Stakeholder",
      "Value"
    ]
  },
  "Realization": {
    "ApplicationCollaboration": [
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "ApplicationComponent": [
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "ApplicationEvent": [
      "BusinessEvent",
      "Constraint",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "ApplicationFunction": [
      "ApplicationService",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "ApplicationInteraction": [
      "ApplicationService",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "ApplicationInterface": [
      "BusinessInterface",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "ApplicationProcess": [
      "ApplicationService",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "ApplicationService": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "Artifact": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "BusinessActor": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "BusinessCollaboration": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "BusinessEvent": [
      "Constraint",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "BusinessFunction": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "BusinessInteraction": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "BusinessInterface": [
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "BusinessObject": [
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "BusinessProcess": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "BusinessRole": [
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "BusinessService": [
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "Capability": [
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "CommunicationNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Node",
      "Outcome",
      "Path",
      "Principle",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Constraint": [
      "Goal",
      "Grouping",
      "Outcome",
      "Principle"
    ],
    "Contract": [
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "CourseOfAction": [
      "Constraint",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "DataObject": [
      "BusinessObject",
      "Capability",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "Deliverable": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Location",
      "Material",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Device": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "DistributionNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Node",
      "Outcome",
      "Path",
      "Principle",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Equipment": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Facility": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Location",
      "Material",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Node",
      "Outcome",
      "Path",
      "Principle",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Material": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Material",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Node": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Outcome": [
      "Goal",
      "Grouping"
    ],
    "Path": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Plateau": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Location",
      "Material",
      "Node",
      "Outcome",
      "Path",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Principle": [
      "Goal",
      "Grouping",
      "Outcome"
    ],
    "Product": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "Representation": [
      "BusinessObject",
      "Capability",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "Requirement": [
      "Goal",
      "Grouping",
      "Outcome",
      "Principle"
    ],
    "Resource": [
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "SystemSoftware": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "TechnologyCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Device",
      "Equipment",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "SystemSoftware",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ],
    "TechnologyEvent": [
      "ApplicationEvent",
      "BusinessEvent",
      "Constraint",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "TechnologyFunction": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "TechnologyService",
      "ValueStream"
    ],
    "TechnologyInteraction": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "TechnologyService",
      "ValueStream"
    ],
    "TechnologyInterface": [
      "ApplicationInterface",
      "ApplicationService",
      "BusinessInterface",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "Resource",
      "ValueStream"
    ],
    "TechnologyProcess": [
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessProcess",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "TechnologyService",
      "ValueStream"
    ],
    "TechnologyService": [
      "ApplicationService",
      "BusinessService",
      "Capability",
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement",
      "ValueStream"
    ],
    "ValueStream": [
      "Constraint",
      "CourseOfAction",
      "Goal",
      "Grouping",
      "Outcome",
      "Principle",
      "Requirement"
    ],
    "WorkPackage": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Goal",
      "Grouping",
      "Location",
      "Material",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream"
    ]
  },
  "Serving": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationComponent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessActor": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessRole": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Capability": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "CommunicationNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "CourseOfAction": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "Device": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "DistributionNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Equipment": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Facility": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "CourseOfAction",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Node",
      "Path",
      "Plateau",
      "Product",
      "Resource",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream",
      "WorkPackage"
    ],
    "ImplementationEvent": [
      "Grouping",
      "ImplementationEvent",
      "Plateau",
      "WorkPackage"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Node": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Path": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Plateau": [
      "Grouping",
      "ImplementationEvent",
      "Plateau",
      "WorkPackage"
    ],
    "Product": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Resource": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "SystemSoftware": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ValueStream": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "WorkPackage": [
      "Grouping",
      "ImplementationEvent",
      "Plateau",
      "WorkPackage"
    ]
  },
  "Specialization": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "Grouping"
    ],
    "ApplicationComponent": [
      "ApplicationComponent",
      "Grouping"
    ],
    "ApplicationEvent": [
      "ApplicationEvent",
      "Grouping"
    ],
    "ApplicationFunction": [
      "ApplicationFunction",
      "Grouping"
    ],
    "ApplicationInteraction": [
      "ApplicationInteraction",
      "Grouping"
    ],
    "ApplicationInterface": [
      "ApplicationInterface",
      "Grouping"
    ],
    "ApplicationProcess": [
      "ApplicationProcess",
      "Grouping"
    ],
    "ApplicationService": [
      "ApplicationService",
      "Grouping"
    ],
    "Artifact": [
      "Artifact",
      "Grouping"
    ],
    "Assessment": [
      "Assessment",
      "Grouping"
    ],
    "BusinessActor": [
      "BusinessActor",
      "Grouping"
    ],
    "BusinessCollaboration": [
      "BusinessCollaboration",
      "Grouping"
    ],
    "BusinessEvent": [
      "BusinessEvent",
      "Grouping"
    ],
    "BusinessFunction": [
      "BusinessFunction",
      "Grouping"
    ],
    "BusinessInteraction": [
      "BusinessInteraction",
      "Grouping"
    ],
    "BusinessInterface": [
      "BusinessInterface",
      "Grouping"
    ],
    "BusinessObject": [
      "BusinessObject",
      "Contract",
      "Grouping"
    ],
    "BusinessProcess": [
      "BusinessProcess",
      "Grouping"
    ],
    "BusinessRole": [
      "BusinessRole",
      "Grouping"
    ],
    "BusinessService": [
      "BusinessService",
      "Grouping"
    ],
    "Capability": [
      "Capability",
      "Grouping"
    ],
    "CommunicationNetwork": [
      "CommunicationNetwork",
      "Grouping"
    ],
    "Constraint": [
      "Constraint",
      "Grouping",
      "Requirement"
    ],
    "Contract": [
      "BusinessObject",
      "Contract",
      "Grouping"
    ],
    "CourseOfAction": [
      "CourseOfAction",
      "Grouping"
    ],
    "DataObject": [
      "DataObject",
      "Grouping"
    ],
    "Deliverable": [
      "Deliverable",
      "Grouping"
    ],
    "Device": [
      "Device",
      "Grouping"
    ],
    "DistributionNetwork": [
      "DistributionNetwork",
      "Grouping"
    ],
    "Driver": [
      "Driver",
      "Grouping"
    ],
    "Equipment": [
      "Equipment",
      "Grouping"
    ],
    "Facility": [
      "Facility",
      "Grouping"
    ],
    "Gap": [
      "Gap",
      "Grouping"
    ],
    "Goal": [
      "Goal",
      "Grouping"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "Artifact",
      "Assessment",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessObject",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "Constraint",
      "Contract",
      "CourseOfAction",
      "DataObject",
      "Deliverable",
      "Device",
      "DistributionNetwork",
      "Driver",
      "Equipment",
      "Facility",
      "Gap",
      "Goal",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Material",
      "Meaning",
      "Node",
      "Outcome",
      "Path",
      "Plateau",
      "Principle",
      "Product",
      "Representation",
      "Requirement",
      "Resource",
      "Stakeholder",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "Value",
      "ValueStream",
      "WorkPackage"
    ],
    "ImplementationEvent": [
      "Grouping",
      "ImplementationEvent"
    ],
    "Location": [
      "Grouping",
      "Location"
    ],
    "Material": [
      "Grouping",
      "Material"
    ],
    "Meaning": [
      "Grouping",
      "Meaning"
    ],
    "Node": [
      "Grouping",
      "Node"
    ],
    "Outcome": [
      "Grouping",
      "Outcome"
    ],
    "Path": [
      "Grouping",
      "Path"
    ],
    "Plateau": [
      "Grouping",
      "Plateau"
    ],
    "Principle": [
      "Grouping",
      "Principle"
    ],
    "Product": [
      "Grouping",
      "Product"
    ],
    "Representation": [
      "Grouping",
      "Representation"
    ],
    "Requirement": [
      "Constraint",
      "Grouping",
      "Requirement"
    ],
    "Resource": [
      "Grouping",
      "Resource"
    ],
    "Stakeholder": [
      "Grouping",
      "Stakeholder"
    ],
    "SystemSoftware": [
      "Grouping",
      "SystemSoftware"
    ],
    "TechnologyCollaboration": [
      "Grouping",
      "TechnologyCollaboration"
    ],
    "TechnologyEvent": [
      "Grouping",
      "TechnologyEvent"
    ],
    "TechnologyFunction": [
      "Grouping",
      "TechnologyFunction"
    ],
    "TechnologyInteraction": [
      "Grouping",
      "TechnologyInteraction"
    ],
    "TechnologyInterface": [
      "Grouping",
      "TechnologyInterface"
    ],
    "TechnologyProcess": [
      "Grouping",
      "TechnologyProcess"
    ],
    "TechnologyService": [
      "Grouping",
      "TechnologyService"
    ],
    "Value": [
      "Grouping",
      "Value"
    ],
    "ValueStream": [
      "Grouping",
      "ValueStream"
    ],
    "WorkPackage": [
      "Grouping",
      "WorkPackage"
    ]
  },
  "Triggering": {
    "ApplicationCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationComponent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ApplicationService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessActor": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessRole": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "BusinessService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Capability": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "CommunicationNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "CourseOfAction": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "Device": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "DistributionNetwork": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Equipment": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Facility": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Grouping": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "Capability",
      "CommunicationNetwork",
      "CourseOfAction",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "ImplementationEvent",
      "Location",
      "Node",
      "Path",
      "Plateau",
      "Product",
      "Resource",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService",
      "ValueStream",
      "WorkPackage"
    ],
    "ImplementationEvent": [
      "Grouping",
      "ImplementationEvent",
      "Plateau",
      "WorkPackage"
    ],
    "Location": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Node": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Path": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Plateau": [
      "Grouping",
      "ImplementationEvent",
      "Plateau",
      "WorkPackage"
    ],
    "Product": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "Resource": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "SystemSoftware": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyCollaboration": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyEvent": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyFunction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyInteraction": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyInterface": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyProcess": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "TechnologyService": [
      "ApplicationCollaboration",
      "ApplicationComponent",
      "ApplicationEvent",
      "ApplicationFunction",
      "ApplicationInteraction",
      "ApplicationInterface",
      "ApplicationProcess",
      "ApplicationService",
      "BusinessActor",
      "BusinessCollaboration",
      "BusinessEvent",
      "BusinessFunction",
      "BusinessInteraction",
      "BusinessInterface",
      "BusinessProcess",
      "BusinessRole",
      "BusinessService",
      "CommunicationNetwork",
      "Device",
      "DistributionNetwork",
      "Equipment",
      "Facility",
      "Grouping",
      "Location",
      "Node",
      "Path",
      "Product",
      "SystemSoftware",
      "TechnologyCollaboration",
      "TechnologyEvent",
      "TechnologyFunction",
      "TechnologyInteraction",
      "TechnologyInterface",
      "TechnologyProcess",
      "TechnologyService"
    ],
    "ValueStream": [
      "Capability",
      "CourseOfAction",
      "Grouping",
      "Resource",
      "ValueStream"
    ],
    "WorkPackage": [
      "Grouping",
      "ImplementationEvent",
      "Plateau",
      "WorkPackage"
    ]
  }
};

const elementTypeMetadata = new Map(ELEMENT_TYPE_METADATA_ENTRIES);
const relationshipCategoryByType = new Map(RELATIONSHIP_CATEGORY_ENTRIES);

function isSupportedElementType(type) {
  return elementTypeMetadata.has(type);
}

function isSupportedRelationshipType(type) {
  return relationshipCategoryByType.has(type);
}

function getMetadata(element) {
  return elementTypeMetadata.get(element && element.type) || {};
}

function getArchiMateClass(elementOrType) {
  const type = typeof elementOrType === 'string' ? elementOrType : elementOrType && elementOrType.type;
  return ARCHIMATE_CLASS_BY_ELEMENT_TYPE[type];
}

function validateRelationshipEndpointTypes(relationship, source, target) {
  if (!relationship || !source || !target) {
    return [];
  }
  const relationshipType = relationship.type;
  if (!isSupportedRelationshipType(relationshipType)) {
    return ['relationships \'' + relationship.id + '\' uses unsupported ArchiMate relationship type \'' + relationshipType + '\''];
  }
  const sourceClass = getArchiMateClass(source);
  const targetClass = getArchiMateClass(target);
  if (!sourceClass || !targetClass) {
    return [];
  }
  const allowedTargets = RELATIONSHIP_TARGET_MATRIX[relationshipType] && RELATIONSHIP_TARGET_MATRIX[relationshipType][sourceClass];
  if (!allowedTargets || !allowedTargets.some(allowed => allowed === targetClass || allowed === 'ModelConcept')) {
    return ['relationships \'' + relationship.id + '\' violates ArchiMate 3.2 relationship matrix: ' + source.type + ' \'' + source.name + '\' cannot ' + relationshipType + ' ' + target.type + ' \'' + target.name + '\''];
  }
  return [];
}

function auditRelationshipEndpointTypes(document, relationshipIds) {
  const errors = [];
  const elementById = new Map((document.elements || []).map(element => [element.id, element]));
  const relationshipIdSet = Array.isArray(relationshipIds) && relationshipIds.length > 0 ? new Set(relationshipIds) : undefined;
  for (const relationship of document.relationships || []) {
    if (relationshipIdSet && !relationshipIdSet.has(relationship.id)) {
      continue;
    }
    const source = elementById.get(relationship.source_id);
    const target = elementById.get(relationship.target_id);
    errors.push(...validateRelationshipEndpointTypes(relationship, source, target));
  }
  return errors;
}

module.exports = {
  ELEMENT_TYPE_METADATA_ENTRIES,
  RELATIONSHIP_CATEGORY_ENTRIES,
  ARCHIMATE_CLASS_BY_ELEMENT_TYPE,
  ELEMENT_TYPE_BY_ARCHIMATE_CLASS,
  RELATIONSHIP_TARGET_MATRIX,
  elementTypeMetadata,
  relationshipCategoryByType,
  isSupportedElementType,
  isSupportedRelationshipType,
  getMetadata,
  getArchiMateClass,
  validateRelationshipEndpointTypes,
  auditRelationshipEndpointTypes,
};
```

### `.argo/scripts/argo-mcp-server.js`

```javascript
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const validatorMcp = require('./validator-mcp-server.js');
const systemArchitectureMcp = require('./systemarchitecture-mcp-server.js');

const HANDOFF_FILES_TO_RESET = [
  ['design', 'KG', 'IntentToImplementationHandoff.json'],
  ['design', 'KG', 'ImplementationToCodingHandoff.json'],
];
const EA_TEMPLATE_PATH_CANDIDATES = [
  ['.opencode', 'customtools', 'EA-model-template.feap'],
  ['.opencode', 'EA-model-template.feap'],
  ['eatool', 'EA-model-template.feap'],
  ['EA-model-template.feap'],
  ['Argo.feap'],
];
const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

const VALIDATOR_TOOL_NAMES = new Set([
  'validateSystemArchitecture',
  'validateStageHandoff',
  'validateTraceProposal',
  'runArchitectureTests',
]);
const SYSTEM_ARCHITECTURE_TOOL_NAMES = new Set([
  'getSystemArchitecture',
  'getIntentElementContext',
  'previewSystemArchitectureMutation',
  'applySystemArchitectureMutation',
  'addArchitectureElement',
  'updateArchitectureElement',
  'removeArchitectureElement',
  'addArchitectureRelationship',
  'updateArchitectureRelationship',
  'removeArchitectureRelationship',
  'addArchitectureView',
  'updateArchitectureView',
  'removeArchitectureView',
]);

const TOOLS = [
  {
    name: 'initializeWorkspace',
    description: 'Bootstrap an Argo workspace by copying the EA template target and resetting stage handoff artifacts.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'validateSystemArchitecture',
    description: 'Validate design/KG/SystemArchitecture.json through the repository-native schema and graph validator.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'validateStageHandoff',
    description: 'Validate Argo stage handoff JSON. Use stage intent-to-implementation or implementation-to-coding, or omit to validate all supported stages.',
    inputSchema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          enum: ['intent-to-implementation', 'implementation-to-coding'],
          description: 'Optional handoff stage to validate.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'validateTraceProposal',
    description: 'Validate ImplementationToIntentTraceProposal JSON against .argo/schema/ImplementationToIntentTraceProposal.schema.json and repository path references.',
    inputSchema: {
      type: 'object',
      properties: {
        proposalPath: {
          type: 'string',
          description: 'Optional proposal path relative to workspace root. Default: design/KG/ImplementationToIntentTraceProposal.json',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'runArchitectureTests',
    description: 'Execute explicit architecture testcases from the intent graph and refresh design/KG/test-failure-records.json.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: {
          type: 'string',
          description: 'Optional architecture graph path relative to workspace root. Default: design/KG/SystemArchitecture.json',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'getSystemArchitecture',
    description: 'Start here. read-only tool for inspecting current elements, relationships, views, and ids before planning mutations. Use before preview or focused mutation tools.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'getIntentElementContext',
    description: 'read-only query that returns an intent subgraph context for one element. Uses ArchiMate semantic dependency traversal with dependencyDepth and dependentDepth, preserving native subgraph elements, relationships, and views.',
    inputSchema: intentElementContextInputSchema(),
  },
  {
    name: 'previewSystemArchitectureMutation',
    description: 'Use before apply for complex or risky changes. Performs a dry-run of one or more mutations, runs schema, graph, view, and ArchiMate 3.2 validation, and does not write the graph.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'applySystemArchitectureMutation',
    description: 'Use for multi-step or dependent graph changes that should be validated and written atomically. Prefer focused tools for a single simple add, update, or remove operation.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'addArchitectureElement',
    description: 'Use for one element. Creates a new element or adds an existing element to view_ids. view_ids is required so elements never exist outside views.',
    inputSchema: {
      type: 'object',
      required: ['element', 'view_ids'],
      properties: {
        element: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureElement',
    description: 'Use for one global element metadata patch. Does not change view membership. Element id and type are immutable; remove and re-add to change them.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureElement',
    description: 'Use for one element removal. With view_ids, removes only from those views and cascades related relationships in the same views; without view_ids, removes from all views and the graph.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureRelationship',
    description: 'Use for one relationship. Creates a new relationship or adds an existing relationship to view_ids. relationship.type is the ArchiMate 3.2 relationship type and is validated against endpoint element types.',
    inputSchema: {
      type: 'object',
      required: ['relationship', 'view_ids'],
      properties: {
        relationship: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureRelationship',
    description: 'Use for one global relationship metadata patch, such as name, statement, source_name, or target_name. Relationship id and type are immutable; remove and re-add to change them.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureRelationship',
    description: 'Use for one relationship removal. With view_ids, removes only from those views; without view_ids, removes from all views and deletes it from the graph.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureView',
    description: 'Use for one view. The graph must have exactly one top-level view named SystemArchitecture; all sub-views must attach to an element with parent_element_id.',
    inputSchema: {
      type: 'object',
      required: ['view'],
      properties: {
        view: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureView',
    description: 'Use for one view metadata or membership patch. Keep the one top-level view named SystemArchitecture and attach sub-views to parent elements.',
    inputSchema: {
      type: 'object',
      required: ['view_id', 'patch'],
      properties: {
        view_id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureView',
    description: 'Use for one view removal. After removal, every remaining element and relationship must still belong to at least one view.',
    inputSchema: {
      type: 'object',
      required: ['view_id'],
      properties: {
        view_id: { type: 'string' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
];

function intentElementContextInputSchema() {
  return {
    type: 'object',
    properties: {
      architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      elementId: { type: 'string' },
      elementName: { type: 'string' },
      profile: {
        type: 'string',
        enum: ['implementation-design', 'coding-repair', 'audit', 'generic-agent'],
        description: 'Default: generic-agent. Affects workContext enrichment only; subgraph shape stays native.',
      },
      dependencyDepth: { type: 'number', description: 'Default: 2. Semantic dependencies needed by the focus element.' },
      dependentDepth: { type: 'number', description: 'Default: 1. Semantic dependents that rely on the focus element.' },
      associationDepth: { type: 'number', description: 'Default: 1. Association neighbors are expanded at least one layer.' },
      associationNeighborDependencyDepth: { type: 'number', description: 'Default: 0. Optional dependency expansion from association neighbors.' },
    },
    additionalProperties: false,
  };
}

function mutationInputSchema() {
  return {
    type: 'object',
    required: ['mutations'],
    properties: {
      architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      mutations: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: [
                'addElement',
                'updateElement',
                'removeElement',
                'addRelationship',
                'updateRelationship',
                'removeRelationship',
                'addView',
                'updateView',
                'removeView',
              ],
            },
            element: { type: 'object' },
            relationship: { type: 'object' },
            view: { type: 'object' },
            id: { type: 'string' },
            patch: { type: 'object' },
            view_id: { type: 'string' },
            view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
            element_ids: { type: 'array', items: { type: 'string' } },
            relationship_ids: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  };
}

function resolveWorkspaceRoot() {
  return process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
}

async function callTool(name, args = {}) {
  if (name === 'initializeWorkspace') {
    return toolResult(await initializeWorkspace(resolveWorkspaceRoot()));
  }
  if (VALIDATOR_TOOL_NAMES.has(name)) {
    return validatorMcp.callTool(name, args);
  }
  if (SYSTEM_ARCHITECTURE_TOOL_NAMES.has(name)) {
    return systemArchitectureMcp.callTool(name, args);
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function initializeWorkspace(workspaceRoot) {
  const workspaceName = path.basename(workspaceRoot);
  const createdFiles = [];
  const updatedFiles = [];
  const removedFiles = [];
  const skippedSteps = [];

  const templateSourcePath = resolveTemplateSourcePath(workspaceRoot);
  const targetFeapName = buildTargetFileName(workspaceName);
  const targetFeapPath = path.join(workspaceRoot, targetFeapName);
  if (!fs.existsSync(targetFeapPath)) {
    await fs.promises.copyFile(templateSourcePath, targetFeapPath);
    createdFiles.push(normalizeRelativePath(targetFeapName));
  } else {
    skippedSteps.push(`${normalizeRelativePath(targetFeapName)} already exists`);
  }

  for (const handoffPath of HANDOFF_FILES_TO_RESET) {
    const absolutePath = path.join(workspaceRoot, ...handoffPath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.rm(absolutePath, { force: true });
      removedFiles.push(normalizeRelativePath(path.relative(workspaceRoot, absolutePath)));
    }
  }

  return {
    workspaceRoot,
    targetFeapName,
    createdFiles,
    updatedFiles,
    removedFiles,
    skippedSteps,
    status: 'ok',
  };
}

function resolveTemplateSourcePath(workspaceRoot) {
  for (const candidate of EA_TEMPLATE_PATH_CANDIDATES) {
    const absolutePath = path.join(workspaceRoot, ...candidate);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }
  throw new Error(`Unable to locate EA template. Checked: ${EA_TEMPLATE_PATH_CANDIDATES.map(candidate => candidate.join('/')).join(', ')}`);
}

function buildTargetFileName(workspaceName) {
  const sanitized = sanitizeFileName(workspaceName) || 'workspace';
  const safeBaseName = WINDOWS_RESERVED_NAMES.has(sanitized.toUpperCase())
    ? `${sanitized}_workspace`
    : sanitized;
  return `${safeBaseName}.feap`;
}

function sanitizeFileName(value) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/[.\s]+$/g, '')
    .trim();
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/');
}

function toolResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    isError: payload.status === 'failed',
  };
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'argo',
          version: '1.0.0',
        },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === 'tools/call') {
    try {
      const result = await callTool(params.name, params.arguments || {});
      return { jsonrpc: '2.0', id, result };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: String(error && error.stack ? error.stack : error),
            },
          ],
          isError: true,
        },
      };
    }
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  };
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }
    let request;
    try {
      request = JSON.parse(line);
    } catch {
      continue;
    }
    const response = await handleRequest(request);
    if (response) {
      send(response);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  callTool,
  main,
};
```

### `.argo/scripts/runArchitectureTests.js`

```javascript
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const repoRoot = process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
const PYTHON_EXECUTABLE = resolvePythonExecutable(repoRoot);
const DEFAULT_ARCHITECTURE_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const FAILURE_RECORDS_PATH = 'design/KG/test-failure-records.json';
const DEFAULT_TEST_TIMEOUT_MS = 120000;
const TEST_TIMEOUT_MS = readPositiveInteger(process.env.ARGO_TEST_TIMEOUT_MS, DEFAULT_TEST_TIMEOUT_MS);
const SUPPORTED_TEST_SCRIPT_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.py', '.ps1', '.cmd', '.bat']);
const DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS = [
    /[\r\n]/,
    /[|&;<>]/,
    /^['"].*['"]$/,
    /^(?:npm|pnpm|yarn|npx|node|python|py|powershell|pwsh|cmd|bash|sh)\b/i,
];

async function main() {
    const architecturePath = normalizeRelativePath(process.argv[2] || DEFAULT_ARCHITECTURE_GRAPH_PATH);
    let summary;
    try {
        summary = await runArchitectureTests(repoRoot, architecturePath);
    } catch (error) {
        console.error(`Argo architecture test execution failed: ${String(error && error.stack ? error.stack : error)}`);
        process.exit(1);
    }

    printSummary(summary);
    if (summary.failedCount > 0) {
        process.exit(1);
    }
}

async function runArchitectureTests(workspaceRoot, architecturePath) {
    const resolvedArchitecturePath = normalizeRelativePath(architecturePath || DEFAULT_ARCHITECTURE_GRAPH_PATH);
    const graphPath = path.join(workspaceRoot, ...resolvedArchitecturePath.split('/'));
    const graph = await readArchitectureGraph(graphPath);
    const explicitTestcases = collectExplicitTestcases(graph);
    const results = [];
    const failureRecords = [];

    for (const [index, testcase] of explicitTestcases.entries()) {
        logTestcaseStart(index, explicitTestcases.length, testcase);
        const resolvedScriptPath = testcase.acceptanceCriteria
            ? normalizeRelativePath(testcase.acceptanceCriteria)
            : '';

        if (!testcase.acceptanceCriteria) {
            const result = buildExecutionResult({
                testcase,
                resolvedScriptPath: '',
                executionCommand: '',
                status: 'missing-criteria',
                exitCode: null,
                durationMs: 0,
                stdout: '',
                stderr: 'acceptanceCriteria is empty',
            });
            results.push(result);
            logTestcaseFinish(index, explicitTestcases.length, result);
            failureRecords.push(toFailedTestRecord(result));
            continue;
        }

        const validation = validateAcceptanceCriteria(resolvedScriptPath);
        if (!validation.valid) {
            const result = buildExecutionResult({
                testcase,
                resolvedScriptPath,
                executionCommand: '',
                status: 'invalid-criteria',
                exitCode: null,
                durationMs: 0,
                stdout: '',
                stderr: validation.reason || 'acceptanceCriteria must be a direct script file path',
            });
            results.push(result);
            logTestcaseFinish(index, explicitTestcases.length, result);
            failureRecords.push(toFailedTestRecord(result));
            continue;
        }

        const parsedAcceptanceCriteria = parseAcceptanceCriteria(resolvedScriptPath);
        const executionCommand = buildExecutionCommandPreview(parsedAcceptanceCriteria);
        const scriptPath = path.join(workspaceRoot, ...parsedAcceptanceCriteria.scriptRelativePath.split('/'));
        if (!fs.existsSync(scriptPath)) {
            const result = buildExecutionResult({
                testcase,
                resolvedScriptPath,
                executionCommand,
                status: 'missing-file',
                exitCode: null,
                durationMs: 0,
                stdout: '',
                stderr: `test script not found: ${resolvedScriptPath}`,
            });
            results.push(result);
            logTestcaseFinish(index, explicitTestcases.length, result);
            failureRecords.push(toFailedTestRecord(result));
            continue;
        }

        const start = Date.now();
        const execution = await executeAcceptanceScript(parsedAcceptanceCriteria, workspaceRoot, scriptPath);
        const passed = execution.exitCode === 0;
        const result = buildExecutionResult({
            testcase,
            resolvedScriptPath,
            executionCommand,
            status: passed ? 'passed' : 'failed',
            exitCode: execution.exitCode,
            durationMs: Date.now() - start,
            stdout: execution.stdout,
            stderr: execution.stderr,
        });
        results.push(result);
        logTestcaseFinish(index, explicitTestcases.length, result);
        if (!passed) {
            failureRecords.push(toFailedTestRecord(result));
        }
    }

    await writeFailureRecords(workspaceRoot, failureRecords);

    return {
        architecturePath: resolvedArchitecturePath,
        failureRecordsPath: FAILURE_RECORDS_PATH,
        totalTestCases: explicitTestcases.length,
        passedCount: results.filter(result => result.passed).length,
        failedCount: failureRecords.length,
        missingCriteriaCount: results.filter(result => result.status === 'missing-criteria').length,
        results,
        failureRecords,
    };
}

async function readArchitectureGraph(graphPath) {
    try {
        return JSON.parse(await fs.promises.readFile(graphPath, 'utf8'));
    } catch (error) {
        throw new Error(`Failed to read architecture graph: ${graphPath}. ${String(error)}`);
    }
}

function buildExecutionResult(input) {
    return {
        testcaseName: input.testcase.testcaseName,
        testDescription: input.testcase.testDescription,
        acceptanceCriteria: input.testcase.acceptanceCriteria,
        elementId: input.testcase.elementId,
        resolvedScriptPath: input.resolvedScriptPath,
        executionCommand: input.executionCommand,
        status: input.status,
        passed: input.status === 'passed',
        exitCode: input.exitCode,
        durationMs: input.durationMs,
        stdout: input.stdout,
        stderr: input.stderr,
    };
}

async function writeFailureRecords(workspaceRoot, records) {
    const targetPath = path.join(workspaceRoot, ...FAILURE_RECORDS_PATH.split('/'));
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
}

function toFailedTestRecord(result) {
    return {
        testcasename: result.testcaseName,
        testdescription: result.testDescription,
        acceptanceCriteria: result.acceptanceCriteria,
        relatedIntentElementId: result.elementId,
        status: result.status,
        resolvedScriptPath: result.resolvedScriptPath,
        executionCommand: result.executionCommand,
        exitCode: result.exitCode,
        failureError: buildFailureError(result),
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function buildFailureError(result) {
    const stderr = result.stderr.trim();
    if (stderr) {
        return stderr;
    }
    const stdout = result.stdout.trim();
    if (stdout) {
        return stdout;
    }
    if (result.exitCode !== null) {
        return `Command exited with code ${result.exitCode}`;
    }
    return `Test status: ${result.status}`;
}

async function executeAcceptanceScript(criteria, cwd, scriptPath) {
    if (criteria.selector) {
        return runPythonPytestNodeId(criteria, cwd);
    }

    const extension = path.extname(scriptPath).toLowerCase();
    switch (extension) {
        case '.js':
        case '.cjs':
        case '.mjs':
            return runCommand(process.execPath, [scriptPath], cwd);
        case '.py':
            return runCommand(PYTHON_EXECUTABLE, [scriptPath], cwd);
        case '.ps1':
            return runCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], cwd);
        case '.cmd':
        case '.bat':
            return runCommand(scriptPath, [], cwd);
        default:
            return runCommand(scriptPath, [], cwd);
    }
}

async function runPythonPytestNodeId(criteria, cwd) {
    return runCommand(PYTHON_EXECUTABLE, ['-m', 'pytest', buildPytestNodeId(criteria)], cwd);
}

function resolvePythonExecutable(workspaceRoot) {
    const candidates = process.platform === 'win32'
        ? [
            path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe'),
            path.join(workspaceRoot, 'venv', 'Scripts', 'python.exe'),
        ]
        : [
            path.join(workspaceRoot, '.venv', 'bin', 'python'),
            path.join(workspaceRoot, 'venv', 'bin', 'python'),
        ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return 'python';
}

async function runCommand(command, args, cwd) {
    try {
        const { stdout, stderr } = await execFileAsync(command, args, {
            cwd,
            windowsHide: true,
            maxBuffer: 1024 * 1024 * 10,
            timeout: TEST_TIMEOUT_MS,
        });
        return {
            exitCode: 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
        };
    } catch (error) {
        const timedOut = error && (error.killed || error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT');
        return {
            exitCode: typeof error.code === 'number' ? error.code : 1,
            stdout: String(error.stdout || '').trim(),
            stderr: timedOut
                ? `Command timed out after ${TEST_TIMEOUT_MS}ms: ${formatCommand(command, args)}`
                : String(error.stderr || error.message || error).trim(),
        };
    }
}

function validateAcceptanceCriteria(value) {
    if (!value) {
        return { valid: false, reason: 'acceptanceCriteria is empty' };
    }

    for (const pattern of DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS) {
        if (pattern.test(value)) {
            return {
                valid: false,
                reason: 'acceptanceCriteria must be a single workspace-relative test entry only, without extra command wrappers or arguments',
            };
        }
    }

    const parsed = parseAcceptanceCriteria(value);
    const extension = path.extname(parsed.scriptRelativePath).toLowerCase();
    if (!SUPPORTED_TEST_SCRIPT_EXTENSIONS.has(extension)) {
        return {
            valid: false,
            reason: `acceptanceCriteria must point to a single executable script file (${Array.from(SUPPORTED_TEST_SCRIPT_EXTENSIONS).join(', ')})`,
        };
    }

    if (parsed.selector && extension !== '.py') {
        return {
            valid: false,
            reason: 'only Python pytest node ids like tests/test_x.py::test_y are supported when acceptanceCriteria includes :: selectors',
        };
    }

    if (parsed.selector && !parsed.selector.trim()) {
        return {
            valid: false,
            reason: 'pytest node id selectors cannot be empty',
        };
    }

    return { valid: true };
}

function parseAcceptanceCriteria(value) {
    const [scriptRelativePath, ...selectorParts] = value.split('::');
    return {
        scriptRelativePath: normalizeRelativePath(scriptRelativePath),
        selector: selectorParts.length > 0 ? selectorParts.join('::').trim() : undefined,
    };
}

function buildPytestNodeId(criteria) {
    return criteria.selector
        ? `${criteria.scriptRelativePath}::${criteria.selector}`
        : criteria.scriptRelativePath;
}

function buildExecutionCommandPreview(criteria) {
    if (criteria.selector) {
        return formatCommand('python', ['-m', 'pytest', buildPytestNodeId(criteria)]);
    }

    const scriptPath = criteria.scriptRelativePath;
    const extension = path.extname(scriptPath).toLowerCase();
    switch (extension) {
        case '.js':
        case '.cjs':
        case '.mjs':
            return formatCommand(process.execPath, [scriptPath]);
        case '.py':
            return formatCommand('python', [scriptPath]);
        case '.ps1':
            return formatCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
        case '.cmd':
        case '.bat':
            return formatCommand(scriptPath, []);
        default:
            return formatCommand(scriptPath, []);
    }
}

function formatCommand(command, args) {
    return [quoteCommandPart(command), ...args.map(quoteCommandPart)].join(' ');
}

function quoteCommandPart(value) {
    return /\s/.test(value) ? `"${value}"` : value;
}

function collectExplicitTestcases(graph) {
    const testcases = [];
    for (const element of graph.elements || []) {
        const elementId = String(element.id || '');
        for (const testcase of element.testcases || []) {
            testcases.push({
                elementId,
                testcaseName: String(testcase.name || ''),
                testDescription: String(testcase.description || ''),
                acceptanceCriteria: String(testcase.acceptanceCriteria || '').trim(),
            });
        }
    }
    return testcases;
}

function normalizeRelativePath(value) {
    return String(value).replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function readPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(String(value || ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function logTestcaseStart(index, total, testcase) {
    const label = formatTestcaseLabel(index, total, testcase.testcaseName);
    console.log(`[START] ${label}`);
    console.log(`        script: ${testcase.acceptanceCriteria || '(missing acceptanceCriteria)'}`);
}

function logTestcaseFinish(index, total, result) {
    const label = formatTestcaseLabel(index, total, result.testcaseName);
    const exitCode = result.exitCode === null ? 'n/a' : String(result.exitCode);
    console.log(`[END]   ${label}`);
    console.log(`        result: ${result.status}; exitCode=${exitCode}; durationMs=${result.durationMs}`);
    console.log(`        command: ${result.executionCommand || '(n/a)'}`);
    if (result.stderr) {
        console.log(`        stderr: ${truncateSingleLine(result.stderr)}`);
    } else if (result.stdout) {
        console.log(`        stdout: ${truncateSingleLine(result.stdout)}`);
    }
}

function formatTestcaseLabel(index, total, testcaseName) {
    return `[${index + 1}/${total}] ${testcaseName || '(unnamed testcase)'}`;
}

function truncateSingleLine(value) {
    const singleLine = String(value).replace(/\s+/g, ' ').trim();
    return singleLine.length > 240 ? `${singleLine.slice(0, 237)}...` : singleLine;
}

function printSummary(summary) {
    console.log(`Argo architecture tests from: ${summary.architecturePath}`);
    console.log(`Failure records: ${summary.failureRecordsPath}`);
    console.log(`Total: ${summary.totalTestCases}; Passed: ${summary.passedCount}; Failed or missing: ${summary.failedCount}; Missing acceptanceCriteria: ${summary.missingCriteriaCount}`);
    for (const result of summary.results) {
        const exitCode = result.exitCode === null ? 'n/a' : String(result.exitCode);
        console.log(`- ${result.testcaseName || '(unnamed testcase)'}: ${result.status} | ${result.resolvedScriptPath || '(missing)'} | ${result.executionCommand || '(n/a)'} | exitCode: ${exitCode}`);
    }
    console.log(JSON.stringify(summary, null, 2));
}

main();
```

### `.argo/scripts/systemarchitecture-mcp-server.js`

```javascript
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const DEFAULT_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const SCHEMA_PATH_CANDIDATES = [
  '.argo/schema/SystemArchitecture.schema.json',
];

const {
  elementTypeMetadata,
  relationshipCategoryByType,
  auditRelationshipEndpointTypes,
} = require('./archimate32-rules');

const HANDLED_MUTATION_TYPES = new Set([
  'addElement',
  'updateElement',
  'removeElement',
  'addRelationship',
  'updateRelationship',
  'removeRelationship',
  'addView',
  'updateView',
  'removeView',
]);

const TOOLS = [
  {
    name: 'getSystemArchitecture',
    description: 'Start here. read-only tool for inspecting current elements, relationships, views, and ids before planning mutations. Use before preview or focused mutation tools.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'getIntentElementContext',
    description: 'read-only query that returns an intent subgraph context for one element. Uses ArchiMate semantic dependency traversal with dependencyDepth and dependentDepth, preserving native subgraph elements, relationships, and views.',
    inputSchema: intentElementContextInputSchema(),
  },
  {
    name: 'validateSystemArchitecture',
    description: 'Validate the current SystemArchitecture graph through schema, graph, and ArchiMate metadata rules.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'previewSystemArchitectureMutation',
    description: 'Use before apply for complex or risky changes. Performs a dry-run of one or more mutations, runs schema, graph, view, and ArchiMate 3.2 validation, and does not write the graph.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'applySystemArchitectureMutation',
    description: 'Use for multi-step or dependent graph changes that should be validated and written atomically. Prefer focused tools for a single simple add, update, or remove operation.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'addArchitectureElement',
    description: 'Use for one element. Creates a new element or adds an existing element to view_ids. view_ids is required so elements never exist outside views.',
    inputSchema: {
      type: 'object',
      required: ['element', 'view_ids'],
      properties: {
        element: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureElement',
    description: 'Use for one global element metadata patch. Does not change view membership. Element id and type are immutable; remove and re-add to change them.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureElement',
    description: 'Use for one element removal. With view_ids, removes only from those views and cascades related relationships in the same views; without view_ids, removes from all views and the graph.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureRelationship',
    description: 'Use for one relationship. Creates a new relationship or adds an existing relationship to view_ids. relationship.type is the ArchiMate 3.2 relationship type and is validated against endpoint element types.',
    inputSchema: {
      type: 'object',
      required: ['relationship', 'view_ids'],
      properties: {
        relationship: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureRelationship',
    description: 'Use for one global relationship metadata patch, such as name, statement, source_name, or target_name. Relationship id and type are immutable; remove and re-add to change them.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureRelationship',
    description: 'Use for one relationship removal. With view_ids, removes only from those views; without view_ids, removes from all views and deletes it from the graph.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureView',
    description: 'Use for one view. The graph must have exactly one top-level view named SystemArchitecture; all sub-views must attach to an element with parent_element_id.',
    inputSchema: {
      type: 'object',
      required: ['view'],
      properties: {
        view: { type: 'object' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureView',
    description: 'Use for one view metadata or membership patch. Keep the one top-level view named SystemArchitecture and attach sub-views to parent elements.',
    inputSchema: {
      type: 'object',
      required: ['view_id', 'patch'],
      properties: {
        view_id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureView',
    description: 'Use for one view removal. After removal, every remaining element and relationship must still belong to at least one view.',
    inputSchema: {
      type: 'object',
      required: ['view_id'],
      properties: {
        view_id: { type: 'string' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
];

function intentElementContextInputSchema() {
  return {
    type: 'object',
    properties: {
      architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      elementId: { type: 'string' },
      elementName: { type: 'string' },
      profile: {
        type: 'string',
        enum: ['implementation-design', 'coding-repair', 'audit', 'generic-agent'],
        description: 'Default: generic-agent. Affects workContext enrichment only; subgraph shape stays native.',
      },
      dependencyDepth: { type: 'number', description: 'Default: 2. Semantic dependencies needed by the focus element.' },
      dependentDepth: { type: 'number', description: 'Default: 1. Semantic dependents that rely on the focus element.' },
      associationDepth: { type: 'number', description: 'Default: 1. Association neighbors are expanded at least one layer.' },
      associationNeighborDependencyDepth: { type: 'number', description: 'Default: 0. Optional dependency expansion from association neighbors.' },
    },
    additionalProperties: false,
  };
}

function mutationInputSchema() {
  return {
    type: 'object',
    required: ['mutations'],
    properties: {
      architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      mutations: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: Array.from(HANDLED_MUTATION_TYPES) },
            element: { type: 'object' },
            relationship: { type: 'object' },
            view: { type: 'object' },
            id: { type: 'string' },
            patch: { type: 'object' },
            view_id: { type: 'string' },
            view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
            element_ids: { type: 'array', items: { type: 'string' } },
            relationship_ids: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  };
}

function resolveWorkspaceRoot() {
  return process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
}

function resolveWorkspacePath(workspaceRoot, relativePath) {
  const normalizedPath = normalizeRelativePath(relativePath || DEFAULT_GRAPH_PATH);
  const absolutePath = path.resolve(workspaceRoot, normalizedPath);
  if (!absolutePath.startsWith(workspaceRoot)) {
    throw new Error(`Path escapes workspace root: ${relativePath}`);
  }
  return { absolutePath, relativePath: normalizedPath };
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '');
}

function resolveSchemaPath(workspaceRoot) {
  for (const candidate of SCHEMA_PATH_CANDIDATES) {
    const absolutePath = path.join(workspaceRoot, candidate);
    if (fs.existsSync(absolutePath)) {
      return { absolutePath, relativePath: candidate };
    }
  }
  throw new Error(`Unable to locate SystemArchitecture schema. Checked: ${SCHEMA_PATH_CANDIDATES.join(', ')}`);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${label}: ${String(error)}`);
  }
}

function loadContext(args = {}) {
  const workspaceRoot = resolveWorkspaceRoot();
  const graphPath = resolveWorkspacePath(workspaceRoot, args.architecturePath || DEFAULT_GRAPH_PATH);
  const schemaPath = resolveSchemaPath(workspaceRoot);
  return {
    workspaceRoot,
    graphPath,
    schemaPath,
    document: readJson(graphPath.absolutePath, graphPath.relativePath),
    schema: readJson(schemaPath.absolutePath, schemaPath.relativePath),
  };
}

function validateDocument(document, schema, options = {}) {
  const errors = [];
  validateAgainstSchema(document, schema, '#', errors, schema);
  validateGraphSemantics(document, errors);
  if (options.validateAllViewElementLimits) {
    validateTouchedViewElementLimit(document, (document.views || []).map(view => view && view.view_id), errors);
  }
  validateTouchedArchiMateGrammar(document, options.touchedRelationshipIds || [], errors);
  return errors;
}

function buildIntentElementContext(context, args = {}) {
  const profile = args.profile || 'generic-agent';
  const focusResult = resolveFocusElement(context.document, args);
  if (focusResult.status !== 'passed') {
    return focusResult;
  }

  const dependencyDepth = normalizeDepth(args.dependencyDepth, 2);
  const dependentDepth = normalizeDepth(args.dependentDepth, 1);
  const associationDepth = Math.max(1, normalizeDepth(args.associationDepth, 1));
  const associationNeighborDependencyDepth = normalizeDepth(args.associationNeighborDependencyDepth, 0);
  const graphIndex = buildGraphIndex(context.document);
  const focusElement = focusResult.element;
  const includedElementIds = new Set([focusElement.id]);
  const includedRelationshipIds = new Set();
  const dependencyDepthByElement = new Map([[focusElement.id, 0]]);
  const dependentDepthByElement = new Map([[focusElement.id, 0]]);
  const associationDepthByElement = new Map([[focusElement.id, 0]]);

  traverseSemanticContext({
    startId: focusElement.id,
    maxDepth: dependencyDepth,
    mode: 'dependency',
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement: dependencyDepthByElement,
  });
  traverseSemanticContext({
    startId: focusElement.id,
    maxDepth: dependentDepth,
    mode: 'dependent',
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement: dependentDepthByElement,
  });
  traverseSemanticContext({
    startId: focusElement.id,
    maxDepth: associationDepth,
    mode: 'association',
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement: associationDepthByElement,
  });

  if (associationNeighborDependencyDepth > 0) {
    for (const [elementId, depth] of associationDepthByElement.entries()) {
      if (elementId === focusElement.id || depth < 1) {
        continue;
      }
      traverseSemanticContext({
        startId: elementId,
        maxDepth: associationNeighborDependencyDepth,
        mode: 'dependency',
        graphIndex,
        includedElementIds,
        includedRelationshipIds,
        depthByElement: new Map([[elementId, 0]]),
      });
    }
  }

  includeViewAnchors(context.document, includedElementIds, includedRelationshipIds, graphIndex);
  const boundary = buildBoundary({
    graphIndex,
    includedElementIds,
    dependencyDepthByElement,
    dependentDepthByElement,
    associationDepthByElement,
    dependencyDepth,
    dependentDepth,
    associationDepth,
  });
  const explorationHints = buildExplorationHints(boundary, {
    profile,
    dependencyDepth,
    dependentDepth,
    associationDepth,
  });

  return {
    status: 'passed',
    query: {
      architecturePath: context.graphPath.relativePath,
      elementId: focusElement.id,
      elementName: focusElement.name,
      profile,
      dependencyDepth,
      dependentDepth,
      associationDepth,
      associationNeighborDependencyDepth,
      traversalMode: 'archimate-semantic',
    },
    focusElementId: focusElement.id,
    subgraph: buildNativeSubgraph(context.document, includedElementIds, includedRelationshipIds),
    boundary,
    explorationHints,
    workContext: {},
    diagnostics: [],
  };
}

function resolveFocusElement(document, args) {
  if (args.elementId) {
    const element = (document.elements || []).find(entry => entry.id === args.elementId);
    if (!element) {
      return {
        status: 'failed',
        error: `Element '${args.elementId}' does not exist`,
        candidates: [],
      };
    }
    return { status: 'passed', element };
  }

  if (!args.elementName) {
    return {
      status: 'failed',
      error: 'elementId or elementName is required',
      candidates: [],
    };
  }

  const matches = (document.elements || []).filter(element => element.name === args.elementName);
  if (matches.length === 1) {
    return { status: 'passed', element: matches[0] };
  }
  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      error: `Element name '${args.elementName}' matched multiple elements`,
      candidates: matches.map(element => ({ id: element.id, name: element.name, type: element.type })),
    };
  }
  return {
    status: 'failed',
    error: `Element name '${args.elementName}' does not exist`,
    candidates: [],
  };
}

function normalizeDepth(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return defaultValue;
  }
  return Math.floor(numericValue);
}

function buildGraphIndex(document) {
  const relationshipById = new Map();
  const elementById = new Map((document.elements || []).map(element => [element.id, element]));
  const relationshipsByElementId = new Map();
  for (const relationship of document.relationships || []) {
    relationshipById.set(relationship.id, relationship);
    addIndexedRelationship(relationshipsByElementId, relationship.source_id, relationship);
    addIndexedRelationship(relationshipsByElementId, relationship.target_id, relationship);
  }
  return { elementById, relationshipById, relationshipsByElementId };
}

function addIndexedRelationship(index, elementId, relationship) {
  if (!index.has(elementId)) {
    index.set(elementId, []);
  }
  index.get(elementId).push(relationship);
}

function traverseSemanticContext(options) {
  const {
    startId,
    maxDepth,
    mode,
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement,
  } = options;
  if (maxDepth < 1) {
    return;
  }

  const queue = [{ elementId: startId, depth: 0 }];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current.depth >= maxDepth) {
      continue;
    }
    for (const edge of resolveSemanticEdges(current.elementId, graphIndex)) {
      if (edge.kind !== mode) {
        continue;
      }
      const nextDepth = current.depth + 1;
      includedElementIds.add(edge.neighborId);
      includedRelationshipIds.add(edge.relationship.id);
      if (!depthByElement.has(edge.neighborId) || nextDepth < depthByElement.get(edge.neighborId)) {
        depthByElement.set(edge.neighborId, nextDepth);
        queue.push({ elementId: edge.neighborId, depth: nextDepth });
      }
    }
  }
}

function resolveSemanticEdges(elementId, graphIndex) {
  const edges = [];
  for (const relationship of graphIndex.relationshipsByElementId.get(elementId) || []) {
    const isSource = relationship.source_id === elementId;
    const neighborId = isSource ? relationship.target_id : relationship.source_id;
    const relationshipType = relationship.type;

    if (relationshipType === 'Association') {
      edges.push({ kind: 'association', neighborId, relationship });
      continue;
    }

    if (relationshipType === 'Composition' || relationshipType === 'Aggregation') {
      edges.push({ kind: 'dependency', neighborId, relationship });
      continue;
    }

    const sourceDependsOnTarget = ['Access', 'Assignment', 'Specialization'].includes(relationshipType);
    const targetDependsOnSource = ['Serving', 'Realization', 'Flow', 'Triggering', 'Influence'].includes(relationshipType);
    if (sourceDependsOnTarget) {
      edges.push({ kind: isSource ? 'dependency' : 'dependent', neighborId, relationship });
      continue;
    }
    if (targetDependsOnSource) {
      edges.push({ kind: isSource ? 'dependent' : 'dependency', neighborId, relationship });
    }
  }
  return edges;
}

function includeViewAnchors(document, includedElementIds, includedRelationshipIds, graphIndex) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const view of document.views || []) {
      if (!viewTouchesSubgraph(view, includedElementIds, includedRelationshipIds)) {
        continue;
      }
      if (view.parent_element_id && !includedElementIds.has(view.parent_element_id) && graphIndex.elementById.has(view.parent_element_id)) {
        includedElementIds.add(view.parent_element_id);
        changed = true;
      }
    }
    for (const elementId of Array.from(includedElementIds)) {
      const element = graphIndex.elementById.get(elementId);
      if (element && element.parent && !includedElementIds.has(element.parent) && graphIndex.elementById.has(element.parent)) {
        includedElementIds.add(element.parent);
        changed = true;
      }
    }
  }
}

function viewTouchesSubgraph(view, includedElementIds, includedRelationshipIds) {
  return (view.included_elements || []).some(elementId => includedElementIds.has(elementId))
    || (view.included_relationships || []).some(relationshipId => includedRelationshipIds.has(relationshipId));
}

function buildBoundary(options) {
  return {
    truncatedDependencies: collectTruncatedBoundary({
      ...options,
      depthByElement: mergeBoundaryDepths(options.dependencyDepthByElement, options.associationDepthByElement),
      maxDepth: options.dependencyDepth,
      kind: 'dependency',
    }),
    truncatedDependents: collectTruncatedBoundary({
      ...options,
      depthByElement: options.dependentDepthByElement,
      maxDepth: options.dependentDepth,
      kind: 'dependent',
    }),
  };
}

function mergeBoundaryDepths(primaryDepths, associationDepths) {
  const merged = new Map(primaryDepths);
  for (const [elementId, depth] of associationDepths.entries()) {
    if (!merged.has(elementId) || depth < merged.get(elementId)) {
      merged.set(elementId, depth);
    }
  }
  return merged;
}

function collectTruncatedBoundary(options) {
  const {
    graphIndex,
    includedElementIds,
    depthByElement,
    maxDepth,
    kind,
  } = options;
  const truncated = [];
  if (maxDepth < 0) {
    return truncated;
  }
  for (const [elementId, depth] of depthByElement.entries()) {
    if (depth < maxDepth && kind !== 'dependency') {
      continue;
    }
    const unexpandedEdges = resolveSemanticEdges(elementId, graphIndex).filter(edge => (
      (edge.kind === kind || (kind === 'dependency' && edge.kind === 'association'))
      && !includedElementIds.has(edge.neighborId)
    ));
    if (unexpandedEdges.length === 0) {
      continue;
    }
    const element = graphIndex.elementById.get(elementId);
    truncated.push({
      elementId,
      elementName: element ? element.name : undefined,
      direction: kind,
      remainingEdgeCount: unexpandedEdges.length,
      relationshipIds: unexpandedEdges.map(edge => edge.relationship.id),
      reason: `${kind} depth limit reached`,
    });
  }
  return truncated;
}

function buildExplorationHints(boundary, defaults) {
  const hints = [];
  for (const entry of boundary.truncatedDependencies || []) {
    hints.push({
      reason: `Element ${entry.elementId} has unexpanded dependency context`,
      suggestedTool: 'getIntentElementContext',
      suggestedArguments: {
        elementId: entry.elementId,
        profile: defaults.profile,
        dependencyDepth: Math.max(1, defaults.dependencyDepth),
        dependentDepth: 0,
        associationDepth: defaults.associationDepth,
      },
    });
  }
  for (const entry of boundary.truncatedDependents || []) {
    hints.push({
      reason: `Element ${entry.elementId} has unexpanded dependent context`,
      suggestedTool: 'getIntentElementContext',
      suggestedArguments: {
        elementId: entry.elementId,
        profile: defaults.profile,
        dependencyDepth: 0,
        dependentDepth: Math.max(1, defaults.dependentDepth),
        associationDepth: defaults.associationDepth,
      },
    });
  }
  return hints;
}

function buildNativeSubgraph(document, includedElementIds, includedRelationshipIds) {
  const elements = (document.elements || [])
    .filter(element => includedElementIds.has(element.id))
    .map(clone);
  const relationships = (document.relationships || [])
    .filter(relationship => includedRelationshipIds.has(relationship.id))
    .map(clone);
  const views = (document.views || [])
    .filter(view => viewTouchesSubgraph(view, includedElementIds, includedRelationshipIds))
    .map(view => {
      const viewCopy = clone(view);
      if (Array.isArray(viewCopy.included_elements)) {
        viewCopy.included_elements = viewCopy.included_elements.filter(elementId => includedElementIds.has(elementId));
      }
      if (Array.isArray(viewCopy.included_relationships)) {
        viewCopy.included_relationships = viewCopy.included_relationships.filter(relationshipId => includedRelationshipIds.has(relationshipId));
      }
      return viewCopy;
    });
  return { elements, relationships, views };
}

function applyMutations(document, mutations) {
  const nextDocument = clone(document);
  const touchedElementIds = new Set();
  const touchedRelationshipIds = new Set();
  const touchedViewIds = new Set();
  const viewLimitCheckIds = new Set();
  const mutationSummaries = [];

  if (!Array.isArray(mutations) || mutations.length === 0) {
    throw new Error('mutations must contain at least one mutation');
  }

  for (const mutation of mutations) {
    if (!mutation || typeof mutation !== 'object' || !HANDLED_MUTATION_TYPES.has(mutation.type)) {
      throw new Error(`Unsupported mutation type: ${mutation && mutation.type}`);
    }

    if (mutation.type === 'addElement') {
      requireObject(mutation.element, 'mutation.element');
      const scopedViews = requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      requireId(mutation.element.id, 'mutation.element.id');
      const existingElement = findById(nextDocument.elements, mutation.element.id);
      if (!existingElement) {
        nextDocument.elements.push(clone(mutation.element));
      }
      for (const view of scopedViews) {
        view.included_elements = addUnique(view.included_elements || [], [mutation.element.id]);
        touchedViewIds.add(view.view_id);
        viewLimitCheckIds.add(view.view_id);
      }
      touchedElementIds.add(mutation.element.id);
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.element.id,
        view_ids: mutation.view_ids,
        created: !existingElement,
      });
      continue;
    }

    if (mutation.type === 'updateElement') {
      requireId(mutation.id, 'mutation.id');
      requireObject(mutation.patch, 'mutation.patch');
      const element = findById(nextDocument.elements, mutation.id);
      if (!element) {
        throw new Error(`Element '${mutation.id}' does not exist`);
      }
      requirePatchDoesNotChangeElementIdentityOrType(mutation.id, mutation.patch);
      Object.assign(element, clone(mutation.patch));
      touchedElementIds.add(element.id);
      mutationSummaries.push({ type: mutation.type, id: element.id });
      continue;
    }

    if (mutation.type === 'removeElement') {
      requireId(mutation.id, 'mutation.id');
      const element = findById(nextDocument.elements, mutation.id);
      if (!element) {
        throw new Error(`Element '${mutation.id}' does not exist`);
      }
      const scopedViews = mutation.view_ids === undefined
        ? nextDocument.views
        : requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      const relatedRelationshipIds = nextDocument.relationships
        .filter(relationship => relationship.source_id === mutation.id || relationship.target_id === mutation.id)
        .map(relationship => relationship.id);
      for (const view of scopedViews) {
        view.included_elements = removeEntries(view.included_elements || [], [mutation.id]);
        view.included_relationships = removeEntries(view.included_relationships || [], relatedRelationshipIds);
        touchedViewIds.add(view.view_id);
      }
      const stillIncludedInView = nextDocument.views.some(view => (
        Array.isArray(view.included_elements) && view.included_elements.includes(mutation.id)
      ));
      if (!stillIncludedInView) {
        for (const view of nextDocument.views) {
          view.included_relationships = removeEntries(view.included_relationships || [], relatedRelationshipIds);
          touchedViewIds.add(view.view_id);
        }
        nextDocument.elements = nextDocument.elements.filter(entry => entry.id !== mutation.id);
      }
      const relationshipIdsStillInViews = new Set();
      for (const view of nextDocument.views) {
        for (const relationshipId of view.included_relationships || []) {
          relationshipIdsStillInViews.add(relationshipId);
        }
      }
      nextDocument.relationships = nextDocument.relationships.filter(relationship => (
        !relatedRelationshipIds.includes(relationship.id) || relationshipIdsStillInViews.has(relationship.id)
      ));
      touchedElementIds.add(mutation.id);
      for (const relationshipId of relatedRelationshipIds) {
        touchedRelationshipIds.add(relationshipId);
      }
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.id,
        view_ids: mutation.view_ids,
        removed_from_graph: !stillIncludedInView,
        removed_relationship_ids: relatedRelationshipIds.filter(relationshipId => !relationshipIdsStillInViews.has(relationshipId)),
      });
      continue;
    }

    if (mutation.type === 'addRelationship') {
      requireObject(mutation.relationship, 'mutation.relationship');
      const scopedViews = requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      requireId(mutation.relationship.id, 'mutation.relationship.id');
      const existingRelationship = findById(nextDocument.relationships, mutation.relationship.id);
      if (!existingRelationship) {
        nextDocument.relationships.push(clone(mutation.relationship));
      }
      for (const view of scopedViews) {
        view.included_relationships = addUnique(view.included_relationships || [], [mutation.relationship.id]);
        touchedViewIds.add(view.view_id);
      }
      touchedRelationshipIds.add(mutation.relationship.id);
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.relationship.id,
        view_ids: mutation.view_ids,
        created: !existingRelationship,
      });
      continue;
    }

    if (mutation.type === 'updateRelationship') {
      requireId(mutation.id, 'mutation.id');
      requireObject(mutation.patch, 'mutation.patch');
      const relationship = findById(nextDocument.relationships, mutation.id);
      if (!relationship) {
        throw new Error(`Relationship '${mutation.id}' does not exist`);
      }
      requirePatchDoesNotChangeRelationshipIdentityOrType(mutation.id, mutation.patch);
      Object.assign(relationship, clone(mutation.patch));
      touchedRelationshipIds.add(relationship.id);
      mutationSummaries.push({ type: mutation.type, id: relationship.id });
      continue;
    }

    if (mutation.type === 'removeRelationship') {
      requireId(mutation.id, 'mutation.id');
      const relationship = findById(nextDocument.relationships, mutation.id);
      if (!relationship) {
        throw new Error(`Relationship '${mutation.id}' does not exist`);
      }
      const scopedViews = mutation.view_ids === undefined
        ? nextDocument.views
        : requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      for (const view of scopedViews) {
        view.included_relationships = removeEntries(view.included_relationships || [], [mutation.id]);
        touchedViewIds.add(view.view_id);
      }
      const stillIncludedInView = nextDocument.views.some(view => (
        Array.isArray(view.included_relationships) && view.included_relationships.includes(mutation.id)
      ));
      if (!stillIncludedInView) {
        nextDocument.relationships = nextDocument.relationships.filter(entry => entry.id !== mutation.id);
      }
      touchedRelationshipIds.add(mutation.id);
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.id,
        view_ids: mutation.view_ids,
        removed_from_graph: !stillIncludedInView,
      });
      continue;
    }

    if (mutation.type === 'addView') {
      requireObject(mutation.view, 'mutation.view');
      if (findView(nextDocument.views, mutation.view.view_id)) {
        throw new Error(`View '${mutation.view.view_id}' already exists`);
      }
      nextDocument.views.push(clone(mutation.view));
      touchedViewIds.add(mutation.view.view_id);
      viewLimitCheckIds.add(mutation.view.view_id);
      mutationSummaries.push({ type: mutation.type, id: mutation.view.view_id });
      continue;
    }

    if (mutation.type === 'updateView') {
      requireId(mutation.view_id, 'mutation.view_id');
      requireObject(mutation.patch, 'mutation.patch');
      const view = findView(nextDocument.views, mutation.view_id);
      if (!view) {
        throw new Error(`View '${mutation.view_id}' does not exist`);
      }
      Object.assign(view, clone(mutation.patch));
      touchedViewIds.add(view.view_id);
      if (Object.prototype.hasOwnProperty.call(mutation.patch, 'included_elements')) {
        viewLimitCheckIds.add(view.view_id);
      }
      mutationSummaries.push({ type: mutation.type, id: view.view_id });
      continue;
    }

    if (mutation.type === 'removeView') {
      requireId(mutation.view_id, 'mutation.view_id');
      const beforeCount = nextDocument.views.length;
      nextDocument.views = nextDocument.views.filter(view => view.view_id !== mutation.view_id);
      if (nextDocument.views.length === beforeCount) {
        throw new Error(`View '${mutation.view_id}' does not exist`);
      }
      mutationSummaries.push({ type: mutation.type, id: mutation.view_id });
      continue;
    }

  }

  return {
    document: nextDocument,
    touchedElementIds: Array.from(touchedElementIds),
    touchedRelationshipIds: Array.from(touchedRelationshipIds),
    touchedViewIds: Array.from(touchedViewIds),
    viewLimitCheckIds: Array.from(viewLimitCheckIds),
    mutationSummaries,
  };
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireId(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function requireViewScope(views, viewIds, label) {
  if (!Array.isArray(viewIds) || viewIds.length === 0) {
    throw new Error(`${label} must contain at least one view id`);
  }

  const scopedViews = [];
  const seenViewIds = new Set();
  for (const viewId of viewIds) {
    requireId(viewId, `${label}[]`);
    if (seenViewIds.has(viewId)) {
      continue;
    }
    const view = findView(views, viewId);
    if (!view) {
      throw new Error(`View '${viewId}' does not exist`);
    }
    scopedViews.push(view);
    seenViewIds.add(viewId);
  }
  return scopedViews;
}

function requirePatchDoesNotChangeElementIdentityOrType(elementId, patch) {
  if (Object.prototype.hasOwnProperty.call(patch, 'id')) {
    throw new Error(`Element '${elementId}' id cannot be updated; remove and re-add the element to change its id`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'type')) {
    throw new Error(`Element '${elementId}' type cannot be updated; remove and re-add the element to change its type`);
  }
}

function requirePatchDoesNotChangeRelationshipIdentityOrType(relationshipId, patch) {
  if (Object.prototype.hasOwnProperty.call(patch, 'id')) {
    throw new Error(`Relationship '${relationshipId}' id cannot be updated; remove and re-add the relationship to change its id`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'type')) {
    throw new Error(`Relationship '${relationshipId}' type cannot be updated; remove and re-add the relationship to change its type`);
  }
}

function requireElementInViews(elementId, views) {
  for (const view of views) {
    if (!Array.isArray(view.included_elements) || !view.included_elements.includes(elementId)) {
      throw new Error(`Element '${elementId}' is not included in view '${view.view_id}'`);
    }
  }
}

function requireRelationshipInViews(relationshipId, views) {
  for (const view of views) {
    if (!Array.isArray(view.included_relationships) || !view.included_relationships.includes(relationshipId)) {
      throw new Error(`Relationship '${relationshipId}' is not included in view '${view.view_id}'`);
    }
  }
}

function findById(entries, id) {
  return Array.isArray(entries) ? entries.find(entry => entry && entry.id === id) : undefined;
}

function findView(entries, viewId) {
  return Array.isArray(entries) ? entries.find(entry => entry && entry.view_id === viewId) : undefined;
}

function addUnique(existing, additions) {
  const result = Array.isArray(existing) ? [...existing] : [];
  for (const addition of additions) {
    if (!result.includes(addition)) {
      result.push(addition);
    }
  }
  return result;
}

function removeEntries(existing, removals) {
  const removalSet = new Set(removals);
  return (Array.isArray(existing) ? existing : []).filter(entry => !removalSet.has(entry));
}

function buildMutationResult(context, mutations, write) {
  const beforeSummary = summarizeDocument(context.document);
  let mutationResult;
  try {
    mutationResult = applyMutations(context.document, mutations);
  } catch (error) {
    const errors = [String(error && error.message ? error.message : error)];
    return {
      status: 'failed',
      written: false,
      graphPath: context.graphPath.relativePath,
      schemaPath: context.schemaPath.relativePath,
      mutations: [],
      touchedElementIds: [],
      touchedRelationshipIds: [],
      before: beforeSummary,
      after: beforeSummary,
      errors,
      guidance: buildFailureGuidance(errors),
    };
  }
  const errors = validateDocument(mutationResult.document, context.schema, {
    touchedRelationshipIds: mutationResult.touchedRelationshipIds,
  });
  validateTouchedViewElementLimit(mutationResult.document, mutationResult.viewLimitCheckIds, errors);
  const afterSummary = summarizeDocument(mutationResult.document);
  const result = {
    status: errors.length === 0 ? 'passed' : 'failed',
    written: false,
    graphPath: context.graphPath.relativePath,
    schemaPath: context.schemaPath.relativePath,
    mutations: mutationResult.mutationSummaries,
    touchedElementIds: mutationResult.touchedElementIds,
    touchedRelationshipIds: mutationResult.touchedRelationshipIds,
    touchedViewIds: mutationResult.touchedViewIds,
    viewLimitCheckIds: mutationResult.viewLimitCheckIds,
    before: beforeSummary,
    after: afterSummary,
    errors,
  };
  if (errors.length > 0) {
    result.guidance = buildFailureGuidance(errors);
  }

  if (errors.length > 0 || !write) {
    return result;
  }

  writeGraph(context.graphPath.absolutePath, mutationResult.document);
  result.written = true;
  return result;
}

function buildFailureGuidance(errors) {
  const guidance = [];
  for (const error of errors || []) {
    addGuidanceForError(guidance, String(error));
  }
  if (guidance.length === 0 && Array.isArray(errors) && errors.length > 0) {
    guidance.push('Inspect the error text, call getSystemArchitecture to refresh ids and current view membership, then retry with previewSystemArchitectureMutation before writing.');
  }
  return guidance;
}

function addGuidanceForError(guidance, error) {
  if (error.includes('mutation.view_ids must contain at least one view id')) {
    pushUnique(guidance, 'Select the target view_ids explicitly. Call getSystemArchitecture to inspect existing views, then retry the add/remove operation with the intended view_ids.');
  }
  if (error.includes('violates ArchiMate 3.2 relationship matrix')) {
    pushUnique(guidance, 'Check relationship.type and the source and target element types against ArchiMate 3.2. If the intended meaning is still valid, choose a compliant relationship type or change the endpoint element types by remove-and-add.');
  }
  if (error.includes('uses unsupported ArchiMate relationship type')) {
    pushUnique(guidance, 'Use relationship.type for the ArchiMate relationship type and choose one of the schema-supported ArchiMate 3.2 relationship types.');
  }
  if (error.includes('id cannot be updated') || error.includes('type cannot be updated')) {
    pushUnique(guidance, 'Do not patch immutable identity or type fields. To change an id or type, remove the existing element or relationship, then add the replacement with the desired id or type.');
  }
  if (error.includes('must be included in at least one view')) {
    pushUnique(guidance, 'Every element and relationship must belong to at least one view. Add it with view_ids, or add the existing object to an appropriate view before validating again.');
  }
  if (error.includes('must declare parent_element_id') || error.includes('top-level view')) {
    pushUnique(guidance, 'Keep exactly one top-level view named SystemArchitecture. For any sub-view, set parent_element_id to an existing element and keep parent_element_name aligned with that element name.');
  }
  if (error.includes('must contain at most 7 elements')) {
    pushUnique(guidance, 'Do not force more than 7 elements into one view. Pause and think about layered architecture: split the view into layered sub-views, attach each sub-view with parent_element_id, and move lower-level elements into the appropriate child view before retrying.');
  }
  if (error.includes('does not exist') || error.includes('references missing')) {
    pushUnique(guidance, 'Refresh current ids with getSystemArchitecture. Do not guess ids; use existing element, relationship, and view ids or create missing objects first.');
  }
}

function pushUnique(entries, entry) {
  if (!entries.includes(entry)) {
    entries.push(entry);
  }
}

function summarizeDocument(document) {
  return {
    elementCount: Array.isArray(document.elements) ? document.elements.length : 0,
    relationshipCount: Array.isArray(document.relationships) ? document.relationships.length : 0,
    viewCount: Array.isArray(document.views) ? document.views.length : 0,
  };
}

function writeGraph(graphPath, document) {
  const tempPath = `${graphPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, graphPath);
}

function validateGraphSemantics(document, errors) {
  if (!document || typeof document !== 'object') {
    return;
  }

  const elements = Array.isArray(document.elements) ? document.elements : [];
  const relationships = Array.isArray(document.relationships) ? document.relationships : [];
  const views = Array.isArray(document.views) ? document.views : [];
  const elementById = new Map();
  const relationshipById = new Map();

  for (const element of elements) {
    if (!element || typeof element !== 'object') {
      continue;
    }
    if (elementById.has(element.id)) {
      errors.push(`elements contains duplicate id '${element.id}'`);
      continue;
    }
    elementById.set(element.id, element);
    if (!elementTypeMetadata.has(element.type)) {
      errors.push(`elements '${element.id}' uses unsupported ArchiMate element type '${element.type}'`);
    }
  }

  for (const element of elements) {
    if (!element || typeof element !== 'object' || !element.parent) {
      continue;
    }
    if (!elementById.has(element.parent)) {
      errors.push(`elements '${element.id}' references missing parent '${element.parent}'`);
    }
  }

  for (const relationship of relationships) {
    if (!relationship || typeof relationship !== 'object') {
      continue;
    }
    if (relationshipById.has(relationship.id)) {
      errors.push(`relationships contains duplicate id '${relationship.id}'`);
      continue;
    }
    relationshipById.set(relationship.id, relationship);
    if (!relationshipCategoryByType.has(relationship.type)) {
      errors.push(`relationships '${relationship.id}' uses unsupported ArchiMate relationship type '${relationship.type}'`);
    }

    const source = elementById.get(relationship.source_id);
    if (!source) {
      errors.push(`relationships '${relationship.id}' references missing source_id '${relationship.source_id}'`);
    } else if (relationship.source_name !== source.name) {
      errors.push(`relationships '${relationship.id}' source_name '${relationship.source_name}' does not match element '${relationship.source_id}' name '${source.name}'`);
    }

    const target = elementById.get(relationship.target_id);
    if (!target) {
      errors.push(`relationships '${relationship.id}' references missing target_id '${relationship.target_id}'`);
    } else if (relationship.target_name !== target.name) {
      errors.push(`relationships '${relationship.id}' target_name '${relationship.target_name}' does not match element '${relationship.target_id}' name '${target.name}'`);
    }

    const expectedStatement = source && target
      ? `${source.name} --(${relationship.type})--> ${target.name}`
      : undefined;
    if (expectedStatement && relationship.statement !== expectedStatement) {
      errors.push(`relationships '${relationship.id}' statement must be '${expectedStatement}'`);
    }
  }

  const topLevelViews = views.filter(view => view && typeof view === 'object' && !view.parent_element_id);
  if (topLevelViews.length !== 1) {
    errors.push(`views must contain exactly one top-level view named 'SystemArchitecture'; found ${topLevelViews.length}`);
  } else if (topLevelViews[0].view_name !== 'SystemArchitecture') {
    errors.push(`top-level view '${topLevelViews[0].view_id}' view_name must be 'SystemArchitecture'`);
  }

  const elementIdsIncludedInViews = new Set();
  const relationshipIdsIncludedInViews = new Set();
  for (const view of views) {
    if (!view || typeof view !== 'object') {
      continue;
    }
    if (!view.parent_element_id && view.view_name !== 'SystemArchitecture') {
      errors.push(`views '${view.view_id}' must declare parent_element_id unless it is the top-level SystemArchitecture view`);
    }
    if (view.parent_element_id) {
      const parent = elementById.get(view.parent_element_id);
      if (!parent) {
        errors.push(`views '${view.view_id}' references missing parent_element_id '${view.parent_element_id}'`);
      } else if (view.parent_element_name && view.parent_element_name !== parent.name) {
        errors.push(`views '${view.view_id}' parent_element_name '${view.parent_element_name}' does not match element '${view.parent_element_id}' name '${parent.name}'`);
      }
    }
    const includedElementIds = new Set(view.included_elements || []);
    for (const elementId of view.included_elements || []) {
      elementIdsIncludedInViews.add(elementId);
      if (!elementById.has(elementId)) {
        errors.push(`views '${view.view_id}' references missing included element '${elementId}'`);
      }
    }
    for (const relationshipId of view.included_relationships || []) {
      relationshipIdsIncludedInViews.add(relationshipId);
      const relationship = relationshipById.get(relationshipId);
      if (!relationship) {
        errors.push(`views '${view.view_id}' references missing included relationship '${relationshipId}'`);
        continue;
      }
      if (!includedElementIds.has(relationship.source_id)) {
        errors.push(`views '${view.view_id}' includes relationship '${relationshipId}' but not source element '${relationship.source_id}'`);
      }
      if (!includedElementIds.has(relationship.target_id)) {
        errors.push(`views '${view.view_id}' includes relationship '${relationshipId}' but not target element '${relationship.target_id}'`);
      }
    }
  }

  for (const element of elements) {
    if (element && typeof element === 'object' && !elementIdsIncludedInViews.has(element.id)) {
      errors.push(`elements '${element.id}' must be included in at least one view`);
    }
  }

  for (const relationship of relationships) {
    if (relationship && typeof relationship === 'object' && !relationshipIdsIncludedInViews.has(relationship.id)) {
      errors.push(`relationships '${relationship.id}' must be included in at least one view`);
    }
  }
}

function validateTouchedViewElementLimit(document, touchedViewIds, errors) {
  if (!Array.isArray(touchedViewIds) || touchedViewIds.length === 0) {
    return;
  }
  const touchedViewIdSet = new Set(touchedViewIds);
  for (const view of document.views || []) {
    if (!view || !touchedViewIdSet.has(view.view_id)) {
      continue;
    }
    const elementCount = Array.isArray(view.included_elements) ? view.included_elements.length : 0;
    if (elementCount > 7) {
      errors.push(`views '${view.view_id}' must contain at most 7 elements; found ${elementCount}. Split the content into layered sub-views before adding more elements.`);
    }
  }
}

function validateTouchedArchiMateGrammar(document, touchedRelationshipIds, errors) {
  if (!Array.isArray(touchedRelationshipIds) || touchedRelationshipIds.length === 0) {
    return;
  }

  errors.push(...auditRelationshipEndpointTypes(document, touchedRelationshipIds));
}

function validateAgainstSchema(value, schemaNode, pointer, errors, rootSchema) {
  if (!schemaNode || typeof schemaNode !== 'object') {
    return;
  }

  const resolvedSchema = schemaNode.$ref ? resolveRef(schemaNode.$ref, rootSchema, errors, pointer) : schemaNode;
  if (!resolvedSchema) {
    return;
  }

  if (resolvedSchema.const !== undefined && !isDeepStrictEqual(value, resolvedSchema.const)) {
    errors.push(`${pointer} must equal ${JSON.stringify(resolvedSchema.const)}`);
    return;
  }

  if (resolvedSchema.enum && !resolvedSchema.enum.some(option => isDeepStrictEqual(option, value))) {
    errors.push(`${pointer} must be one of: ${resolvedSchema.enum.map(option => JSON.stringify(option)).join(', ')}`);
    return;
  }

  if (resolvedSchema.type !== undefined) {
    validateType(value, resolvedSchema.type, pointer, errors);
    if (!typeMatches(value, resolvedSchema.type)) {
      return;
    }
  }

  if (typeof resolvedSchema.minLength === 'number' && (typeof value !== 'string' || value.length < resolvedSchema.minLength)) {
    errors.push(`${pointer} must be at least ${resolvedSchema.minLength} character(s) long`);
  }

  if (resolvedSchema.pattern) {
    const matcher = new RegExp(resolvedSchema.pattern);
    if (typeof value !== 'string' || !matcher.test(value)) {
      errors.push(`${pointer} must match pattern ${JSON.stringify(resolvedSchema.pattern)}`);
    }
  }

  if (typeof resolvedSchema.minItems === 'number' && (!Array.isArray(value) || value.length < resolvedSchema.minItems)) {
    errors.push(`${pointer} must contain at least ${resolvedSchema.minItems} item(s)`);
  }

  if (resolvedSchema.type === 'object') {
    validateObject(value, resolvedSchema, pointer, errors, rootSchema);
    return;
  }

  if (resolvedSchema.type === 'array') {
    validateArray(value, resolvedSchema, pointer, errors, rootSchema);
  }
}

function validateObject(value, schemaNode, pointer, errors, rootSchema) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return;
  }

  const properties = schemaNode.properties || {};
  const required = Array.isArray(schemaNode.required) ? schemaNode.required : [];
  for (const key of required) {
    if (!(key in value)) {
      errors.push(`${pointer} is missing required property '${key}'`);
    }
  }

  if (schemaNode.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in properties)) {
        errors.push(`${pointer} contains unsupported property '${key}'`);
      }
    }
  }

  for (const [key, propertySchema] of Object.entries(properties)) {
    if (key in value) {
      validateAgainstSchema(value[key], propertySchema, `${pointer}.${key}`, errors, rootSchema);
    }
  }
}

function validateArray(value, schemaNode, pointer, errors, rootSchema) {
  if (!Array.isArray(value)) {
    return;
  }

  if (schemaNode.items) {
    value.forEach((entry, index) => {
      validateAgainstSchema(entry, schemaNode.items, `${pointer}[${index}]`, errors, rootSchema);
    });
  }
}

function validateType(value, expectedType, pointer, errors) {
  if (!typeMatches(value, expectedType)) {
    const printableType = Array.isArray(expectedType) ? expectedType.join(' or ') : expectedType;
    errors.push(`${pointer} must be of type ${printableType}`);
  }
}

function typeMatches(value, expectedType) {
  if (Array.isArray(expectedType)) {
    return expectedType.some(candidate => typeMatches(value, candidate));
  }
  switch (expectedType) {
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function resolveRef(ref, rootSchema, errors, pointer) {
  if (!ref.startsWith('#/')) {
    errors.push(`${pointer} uses unsupported $ref '${ref}'`);
    return undefined;
  }

  const segments = ref.slice(2).split('/');
  let current = rootSchema;
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      errors.push(`${pointer} references missing schema path '${ref}'`);
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function isDeepStrictEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toolResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    isError: payload.status === 'failed',
  };
}

async function callTool(name, args = {}) {
  if (name === 'getSystemArchitecture') {
    const context = loadContext(args);
    return toolResult({
      status: 'passed',
      graphPath: context.graphPath.relativePath,
      document: context.document,
    });
  }

  if (name === 'getIntentElementContext') {
    const context = loadContext(args);
    return toolResult(buildIntentElementContext(context, args));
  }

  if (name === 'validateSystemArchitecture') {
    const context = loadContext({});
    const errors = validateDocument(context.document, context.schema, {
      validateAllViewElementLimits: true,
    });
    return toolResult({
      status: errors.length === 0 ? 'passed' : 'failed',
      graphPath: context.graphPath.relativePath,
      schemaPath: context.schemaPath.relativePath,
      errors,
    });
  }

  if (name === 'previewSystemArchitectureMutation') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, args.mutations, false));
  }

  if (name === 'applySystemArchitectureMutation') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, args.mutations, true));
  }

  if (name === 'addArchitectureElement') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'addElement', element: args.element, view_ids: args.view_ids }], true));
  }

  if (name === 'updateArchitectureElement') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'updateElement', id: args.id, patch: args.patch }], true));
  }

  if (name === 'removeArchitectureElement') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'removeElement', id: args.id, view_ids: args.view_ids }], true));
  }

  if (name === 'addArchitectureRelationship') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'addRelationship', relationship: args.relationship, view_ids: args.view_ids }], true));
  }

  if (name === 'updateArchitectureRelationship') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'updateRelationship', id: args.id, patch: args.patch }], true));
  }

  if (name === 'removeArchitectureRelationship') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'removeRelationship', id: args.id, view_ids: args.view_ids }], true));
  }

  if (name === 'addArchitectureView') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'addView', view: args.view }], true));
  }

  if (name === 'updateArchitectureView') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'updateView', view_id: args.view_id, patch: args.patch }], true));
  }

  if (name === 'removeArchitectureView') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'removeView', view_id: args.view_id }], true));
  }

  throw new Error(`Unknown tool: ${name}`);
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'argo',
          version: '1.0.0',
        },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === 'tools/call') {
    try {
      const result = await callTool(params.name, params.arguments || {});
      return { jsonrpc: '2.0', id, result };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: String(error && error.stack ? error.stack : error),
            },
          ],
          isError: true,
        },
      };
    }
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  };
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }
    let request;
    try {
      request = JSON.parse(line);
    } catch {
      continue;
    }
    const response = await handleRequest(request);
    if (response) {
      send(response);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  applyMutations,
  callTool,
  loadContext,
  main,
  validateDocument,
};
```

### `.argo/scripts/validateStageHandoff.js`

```javascript
const fs = require('fs');
const path = require('path');

const repoRoot = process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
const SYSTEM_ARCHITECTURE_PATH = 'design/KG/SystemArchitecture.json';
const SUPPORTED_ACCEPTANCE_ENTRY_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.py']);
const DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS = [
    /^\s*(?:node|npm|npx|pnpm|yarn|python|py|bun)\b/i,
    /^\s*(?:\.\\|\.\/)?[^\s]+\s+[^:]+/i,
    /[`'"|;&]/,
];

const HANDOFFS = {
    'intent-to-implementation': {
        filePath: 'design/KG/IntentToImplementationHandoff.json',
        schemaPath: '.argo/schema/IntentToImplementationHandoff.schema.json',
        validate: validateIntentToImplementation,
    },
    'implementation-to-coding': {
        filePath: 'design/KG/ImplementationToCodingHandoff.json',
        schemaPath: '.argo/schema/ImplementationToCodingHandoff.schema.json',
        validate: validateImplementationToCoding,
    },
};

function main() {
    const stage = process.argv[2];
    const stages = stage ? [stage] : Object.keys(HANDOFFS);
    const errors = [];

    for (const currentStage of stages) {
        const config = HANDOFFS[currentStage];
        if (!config) {
            errors.push(`Unknown stage '${currentStage}'. Expected one of: ${Object.keys(HANDOFFS).join(', ')}`);
            continue;
        }
        validateStage(currentStage, config, errors);
    }

    if (errors.length > 0) {
        console.error('Stage handoff validation failed:');
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exit(1);
    }

    console.log(`Stage handoff validation passed for: ${stages.join(', ')}`);
}

function validateStage(stage, config, errors) {
    const handoffAbsolutePath = path.join(repoRoot, config.filePath);
    const schemaAbsolutePath = path.join(repoRoot, config.schemaPath);

    if (!fs.existsSync(schemaAbsolutePath)) {
        errors.push(`${stage}: schema file is missing at ${config.schemaPath}`);
        return;
    }

    if (!fs.existsSync(handoffAbsolutePath)) {
        errors.push(`${stage}: handoff file is missing at ${config.filePath}`);
        return;
    }

    let document;
    try {
        document = JSON.parse(fs.readFileSync(handoffAbsolutePath, 'utf8'));
    } catch (error) {
        errors.push(`${stage}: failed to parse ${config.filePath}: ${String(error)}`);
        return;
    }

    config.validate(document, errors, config.filePath);
}

function validateIntentToImplementation(document, errors, filePath) {
    requireString(document, 'stage', errors, filePath);
    requireString(document, 'generatedAt', errors, filePath);
    requireString(document, 'sourceIntentGraphPath', errors, filePath);
    const intentElementIds = requireStringArray(document, 'intentElementIds', true, errors, filePath);
    ['explicitTestcases', 'frozenBaselines', 'requiredImplementationArtifacts'].forEach((legacyField) => {
        if (Object.prototype.hasOwnProperty.call(document, legacyField)) {
            errors.push(`${filePath}.${legacyField} must not be present. Intent-to-implementation handoff only carries architecture element ids; explicit testcase baselines belong in ${SYSTEM_ARCHITECTURE_PATH}`);
        }
    });

    const graphPath = requireString(document, 'sourceIntentGraphPath', errors, filePath);
    if (graphPath) {
        ensureRepoPathExists(graphPath, `${filePath}.sourceIntentGraphPath`, errors);
    }

    const graphDocument = loadSystemArchitecture(errors, filePath);
    if (graphDocument && Array.isArray(intentElementIds)) {
        const elementIds = new Set((graphDocument.elements || []).map((element) => element && element.id).filter(Boolean));
        intentElementIds.forEach((elementId, index) => {
            if (!elementIds.has(elementId)) {
                errors.push(`${filePath}.intentElementIds[${index}] references missing intent architecture element '${elementId}' in ${SYSTEM_ARCHITECTURE_PATH}`);
            }
        });
        validateIntentElementTestcases(graphDocument, intentElementIds, errors, filePath);
    }

    const questions = document.openQuestions;
    if (Array.isArray(questions)) {
        questions.forEach((question, index) => {
            requireString(question, 'question', errors, `${filePath}.openQuestions[${index}]`);
            requireString(question, 'recommendedAnswer', errors, `${filePath}.openQuestions[${index}]`);
            requireString(question, 'reason', errors, `${filePath}.openQuestions[${index}]`);
        });
    }
}

function validateIntentElementTestcases(graphDocument, intentElementIds, errors, filePath) {
    const elementsById = buildElementsById(graphDocument);

    intentElementIds.forEach((elementId, index) => {
        if (!elementsById.has(elementId)) {
            return;
        }

        const element = elementsById.get(elementId);
        if (!hasMountedTestcase(element)) {
            errors.push(buildMissingMountedTestcaseError(filePath, index, element, elementId));
        }
    });
}

function buildElementsById(graphDocument) {
    const elementsById = new Map();

    (graphDocument.elements || []).forEach((element) => {
        if (element && typeof element.id === 'string' && element.id.trim() !== '') {
            elementsById.set(element.id, element);
        }
    });

    return elementsById;
}

function hasMountedTestcase(element) {
    return Array.isArray(element && element.testcases) && element.testcases.length > 0;
}

function buildMissingMountedTestcaseError(filePath, handoffElementIndex, element, fallbackElementId) {
    const elementId = element && element.id ? element.id : fallbackElementId;
    const elementName = element && element.name ? element.name : '<unnamed>';
    const functionalPointHint = describeFunctionalPointHint(element);
    return `${filePath}.intentElementIds[${handoffElementIndex}] intent element '${elementId}' ('${elementName}') has no mounted testcases. ` +
        `Mount Acceptance Test testcases that cover this element${functionalPointHint} under the exact element before validating intent-to-implementation.`;
}

function describeFunctionalPointHint(element) {
    const functionalPoints = extractFunctionalPointDescriptions(element);
    if (functionalPoints.length === 0) {
        return "'s functional points";
    }

    return `'s functional points (${functionalPoints.join('; ')})`;
}

function extractFunctionalPointDescriptions(element) {
    if (!Array.isArray(element && element.attributes)) {
        return [];
    }

    return element.attributes
        .filter((attribute) => attribute && typeof attribute.name === 'string' && /functional/i.test(attribute.name))
        .map((attribute) => typeof attribute.description === 'string' ? attribute.description.trim() : '')
        .filter(Boolean);
}

function validateImplementationToCoding(document, errors, filePath) {
    const graphDocument = loadSystemArchitecture(errors, filePath);
    const acceptanceCriteriaByTestcase = buildAcceptanceCriteriaByTestcase(graphDocument, errors, filePath);

    requireString(document, 'stage', errors, filePath);
    requireString(document, 'generatedAt', errors, filePath);
    const graphPath = requireString(document, 'sourceIntentGraphPath', errors, filePath);
    if (graphPath) {
        ensureRepoPathExists(graphPath, `${filePath}.sourceIntentGraphPath`, errors);
    }

    const implementationContracts = requireStringArray(document, 'implementationContracts', true, errors, filePath);
    if (Array.isArray(implementationContracts)) {
        implementationContracts.forEach((contractPath, index) => {
            ensureRepoPathExists(contractPath, `${filePath}.implementationContracts[${index}]`, errors);
        });
    }

    const explicitEntrypoints = requireArray(document, 'explicitEntrypoints', true, errors, filePath);
    if (Array.isArray(explicitEntrypoints)) {
        explicitEntrypoints.forEach((entry, index) => {
            const testcaseName = requireString(entry, 'testcaseName', errors, `${filePath}.explicitEntrypoints[${index}]`);
            const entryPath = requireString(entry, 'entryPath', errors, `${filePath}.explicitEntrypoints[${index}]`);
            requireString(entry, 'controlPoint', errors, `${filePath}.explicitEntrypoints[${index}]`);
            requireString(entry, 'observationPoint', errors, `${filePath}.explicitEntrypoints[${index}]`);
            const status = requireString(entry, 'initialExecutionStatus', errors, `${filePath}.explicitEntrypoints[${index}]`);
            requireString(entry, 'initialExecutionCommand', errors, `${filePath}.explicitEntrypoints[${index}]`);
            if (entryPath) {
                validateAcceptanceEntryReference(entryPath, `${filePath}.explicitEntrypoints[${index}].entryPath`, errors);
            }
            if (status && !['passed', 'failed'].includes(status)) {
                errors.push(`${filePath}.explicitEntrypoints[${index}].initialExecutionStatus must be 'passed' or 'failed'`);
            }
            if (status === 'failed') {
                requireString(entry, 'failureReason', errors, `${filePath}.explicitEntrypoints[${index}]`);
            }
            if (testcaseName && entryPath) {
                const acceptanceCriteria = acceptanceCriteriaByTestcase.get(testcaseName);
                if (!acceptanceCriteria) {
                    errors.push(`${filePath}.explicitEntrypoints[${index}] testcase '${testcaseName}' is missing from ${SYSTEM_ARCHITECTURE_PATH} or has an empty acceptanceCriteria`);
                } else if (normalizeEntrypointReference(acceptanceCriteria) !== normalizeEntrypointReference(entryPath)) {
                    errors.push(`${filePath}.explicitEntrypoints[${index}] entryPath '${entryPath}' must match ${SYSTEM_ARCHITECTURE_PATH} acceptanceCriteria '${acceptanceCriteria}' for testcase '${testcaseName}'`);
                }
            }
        });
    }

    const criticalTests = requireArray(document, 'criticalNonExplicitTests', false, errors, filePath) || [];
    criticalTests.forEach((test, index) => validateNonExplicitTest(test, `${filePath}.criticalNonExplicitTests[${index}]`, errors));

    const supportingTests = requireArray(document, 'supportingNonExplicitTests', false, errors, filePath) || [];
    supportingTests.forEach((test, index) => validateNonExplicitTest(test, `${filePath}.supportingNonExplicitTests[${index}]`, errors));

    const failureRecordsPath = requireString(document, 'expectedFailureRecordsPath', errors, filePath);
    if (failureRecordsPath) {
        ensureRepoPathExists(failureRecordsPath, `${filePath}.expectedFailureRecordsPath`, errors);
    }

    const codingTargets = requireArray(document, 'codingTargets', true, errors, filePath);
    if (Array.isArray(codingTargets)) {
        codingTargets.forEach((target, index) => {
            requireString(target, 'failureSignal', errors, `${filePath}.codingTargets[${index}]`);
            requireString(target, 'nextAction', errors, `${filePath}.codingTargets[${index}]`);
        });
    }

    const taskExecutionPlan = document.taskExecutionPlan;
    if (!taskExecutionPlan || typeof taskExecutionPlan !== 'object' || Array.isArray(taskExecutionPlan)) {
        errors.push(`${filePath}.taskExecutionPlan must be an object`);
    } else {
        requireString(taskExecutionPlan, 'executionStrategy', errors, `${filePath}.taskExecutionPlan`);
        const tasks = requireArray(taskExecutionPlan, 'tasks', true, errors, `${filePath}.taskExecutionPlan`);
        if (Array.isArray(tasks)) {
            const taskIds = new Set();
            tasks.forEach((task, index) => {
                const prefix = `${filePath}.taskExecutionPlan.tasks[${index}]`;
                const taskId = requireString(task, 'taskId', errors, prefix);
                requireString(task, 'title', errors, prefix);
                requireString(task, 'objective', errors, prefix);
                requireString(task, 'completionSignal', errors, prefix);

                const steps = requireArray(task, 'steps', true, errors, prefix);
                if (Array.isArray(steps)) {
                    steps.forEach((step, stepIndex) => {
                        if (typeof step !== 'string' || step.trim() === '') {
                            errors.push(`${prefix}.steps[${stepIndex}] must be a non-empty string`);
                        }
                    });
                }

                if (taskId) {
                    if (taskIds.has(taskId)) {
                        errors.push(`${prefix}.taskId '${taskId}' must be unique within taskExecutionPlan.tasks`);
                    }
                    taskIds.add(taskId);
                }
            });

            tasks.forEach((task, index) => {
                const dependsOn = Array.isArray(task.dependsOn) ? task.dependsOn : [];
                dependsOn.forEach((dependencyId, dependencyIndex) => {
                    if (typeof dependencyId !== 'string' || dependencyId.trim() === '') {
                        errors.push(`${filePath}.taskExecutionPlan.tasks[${index}].dependsOn[${dependencyIndex}] must be a non-empty string`);
                        return;
                    }
                    if (!taskIds.has(dependencyId)) {
                        errors.push(`${filePath}.taskExecutionPlan.tasks[${index}].dependsOn[${dependencyIndex}] references unknown taskId '${dependencyId}'`);
                    }
                });

                validateOptionalStringArray(task, 'relatedTestcases', `${filePath}.taskExecutionPlan.tasks[${index}]`, errors);
                validateOptionalStringArray(task, 'targetPaths', `${filePath}.taskExecutionPlan.tasks[${index}]`, errors);
            });
        }
    }

    const frozenFiles = requireStringArray(document, 'frozenFiles', true, errors, filePath);
    if (Array.isArray(frozenFiles)) {
        frozenFiles.forEach((frozenFile, index) => {
            ensureRepoPathExists(frozenFile, `${filePath}.frozenFiles[${index}]`, errors);
        });
    }
}

function validateNonExplicitTest(test, prefix, errors) {
    const testPath = requireString(test, 'path', errors, prefix);
    requireString(test, 'controlPoint', errors, prefix);
    requireString(test, 'observationPoint', errors, prefix);
    if (testPath) {
        ensureRepoPathExists(testPath, `${prefix}.path`, errors);
    }
}

function loadSystemArchitecture(errors, filePath) {
    const absolutePath = path.join(repoRoot, SYSTEM_ARCHITECTURE_PATH);
    if (!fs.existsSync(absolutePath)) {
        errors.push(`${filePath}: required graph file is missing at ${SYSTEM_ARCHITECTURE_PATH}`);
        return undefined;
    }

    try {
        return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } catch (error) {
        errors.push(`${filePath}: failed to parse ${SYSTEM_ARCHITECTURE_PATH}: ${String(error)}`);
        return undefined;
    }
}

function buildAcceptanceCriteriaByTestcase(graphDocument, errors, filePath) {
    const mapping = new Map();
    if (!graphDocument || !Array.isArray(graphDocument.elements)) {
        return mapping;
    }

    graphDocument.elements.forEach((element, elementIndex) => {
        if (!Array.isArray(element.testcases)) {
            return;
        }

        element.testcases.forEach((testcase, testcaseIndex) => {
            if (!testcase || typeof testcase.name !== 'string' || testcase.name.trim() === '') {
                return;
            }

            const testcaseName = testcase.name.trim();
            const acceptanceCriteria = typeof testcase.acceptanceCriteria === 'string'
                ? testcase.acceptanceCriteria.trim()
                : '';

            if (!acceptanceCriteria) {
                errors.push(`${filePath}: ${SYSTEM_ARCHITECTURE_PATH}.elements[${elementIndex}].testcases[${testcaseIndex}].acceptanceCriteria must be a non-empty entrypoint string for testcase '${testcaseName}'`);
                return;
            }

            validateAcceptanceEntryReference(
                acceptanceCriteria,
                `${SYSTEM_ARCHITECTURE_PATH}.testcase(${testcaseName}).acceptanceCriteria`,
                errors,
            );

            mapping.set(testcaseName, acceptanceCriteria);
        });
    });

    return mapping;
}

function validateAcceptanceEntryReference(value, label, errors) {
    if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${label} must be a non-empty string`);
        return;
    }

    const trimmed = value.trim();
    for (const pattern of DISALLOWED_ACCEPTANCE_CRITERIA_PATTERNS) {
        if (pattern.test(trimmed)) {
            errors.push(`${label} must be a single workspace-relative testcase entrypoint, not a descriptive sentence or wrapped command`);
            return;
        }
    }

    const scriptPath = normalizeEntrypointReference(trimmed);
    const extension = path.extname(scriptPath).toLowerCase();
    if (!SUPPORTED_ACCEPTANCE_ENTRY_EXTENSIONS.has(extension)) {
        errors.push(`${label} must point to a single executable entry file (${Array.from(SUPPORTED_ACCEPTANCE_ENTRY_EXTENSIONS).join(', ')}) optionally followed by a pytest ::selector`);
        return;
    }

    ensureRepoPathExists(scriptPath, label, errors);
}

function normalizeEntrypointReference(value) {
    const [scriptPath] = String(value).split('::');
    return scriptPath.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function requireString(object, key, errors, prefix) {
    if (!object || typeof object[key] !== 'string' || object[key].trim() === '') {
        errors.push(`${prefix}.${key} must be a non-empty string`);
        return undefined;
    }
    return object[key];
}

function requireArray(object, key, mustHaveItems, errors, prefix) {
    if (!object || !Array.isArray(object[key])) {
        errors.push(`${prefix}.${key} must be an array`);
        return undefined;
    }
    if (mustHaveItems && object[key].length === 0) {
        errors.push(`${prefix}.${key} must not be empty`);
    }
    return object[key];
}

function requireStringArray(object, key, mustHaveItems, errors, prefix) {
    const value = requireArray(object, key, mustHaveItems, errors, prefix);
    if (!Array.isArray(value)) {
        return undefined;
    }
    value.forEach((entry, index) => {
        if (typeof entry !== 'string' || entry.trim() === '') {
            errors.push(`${prefix}.${key}[${index}] must be a non-empty string`);
        }
    });
    return value;
}

function validateOptionalStringArray(object, key, prefix, errors) {
    if (object[key] === undefined) {
        return;
    }

    if (!Array.isArray(object[key])) {
        errors.push(`${prefix}.${key} must be an array`);
        return;
    }

    object[key].forEach((entry, index) => {
        if (typeof entry !== 'string' || entry.trim() === '') {
            errors.push(`${prefix}.${key}[${index}] must be a non-empty string`);
        }
    });
}

function ensureRepoPathExists(relativePath, label, errors) {
    const normalized = relativePath.replace(/[\\/]+/g, path.sep);
    const absolutePath = path.join(repoRoot, normalized);
    if (!fs.existsSync(absolutePath)) {
        errors.push(`${label} points to a missing path: ${relativePath}`);
    }
}

main();
```

### `.argo/scripts/validateSystemArchitecture.js`

```javascript
const fs = require('fs');
const path = require('path');

const repoRoot = process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
const graphRelativePath = path.join('design', 'KG', 'SystemArchitecture.json');
const graphPath = path.join(repoRoot, graphRelativePath);
const schemaPathCandidates = [
    path.join(repoRoot, '.argo', 'schema', 'SystemArchitecture.schema.json'),
];

const {
    elementTypeMetadata,
    relationshipCategoryByType,
    validateRelationshipEndpointTypes,
} = require('./archimate32-rules');

function main() {
    const schemaPath = schemaPathCandidates.find(candidate => fs.existsSync(candidate));
    if (!schemaPath) {
        fail(`Schema file is missing. Checked: ${schemaPathCandidates.map(candidate => path.relative(repoRoot, candidate)).join(', ')}`);
    }

    if (!fs.existsSync(graphPath)) {
        fail('System architecture file is missing at design/KG/SystemArchitecture.json');
    }

    const schema = parseJson(schemaPath, path.relative(repoRoot, schemaPath));
    const document = parseJson(graphPath, 'design/KG/SystemArchitecture.json');
    const errors = [];

    validateAgainstSchema(document, schema, '#', errors, schema);
    validateGraphSemantics(document, errors);

    if (errors.length > 0) {
        console.error('SystemArchitecture validation failed:');
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exit(1);
    }

    console.log('SystemArchitecture validation passed for: design/KG/SystemArchitecture.json');
}

function parseJson(filePath, label) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        fail(`Failed to parse ${label}: ${String(error)}`);
    }
}

function validateAgainstSchema(value, schemaNode, pointer, errors, rootSchema) {
    if (!schemaNode || typeof schemaNode !== 'object') {
        return;
    }

    const resolvedSchema = schemaNode.$ref ? resolveRef(schemaNode.$ref, rootSchema, errors, pointer) : schemaNode;
    if (!resolvedSchema) {
        return;
    }

    if (resolvedSchema.const !== undefined && !isDeepStrictEqual(value, resolvedSchema.const)) {
        errors.push(`${pointer} must equal ${JSON.stringify(resolvedSchema.const)}`);
        return;
    }

    if (resolvedSchema.enum && !resolvedSchema.enum.some(option => isDeepStrictEqual(option, value))) {
        errors.push(`${pointer} must be one of: ${resolvedSchema.enum.map(option => JSON.stringify(option)).join(', ')}`);
        return;
    }

    if (resolvedSchema.type !== undefined) {
        validateType(value, resolvedSchema.type, pointer, errors);
        if (!typeMatches(value, resolvedSchema.type)) {
            return;
        }
    }

    if (typeof resolvedSchema.minLength === 'number') {
        if (typeof value !== 'string' || value.length < resolvedSchema.minLength) {
            errors.push(`${pointer} must be at least ${resolvedSchema.minLength} character(s) long`);
        }
    }

    if (typeof resolvedSchema.maxLength === 'number') {
        if (typeof value !== 'string' || value.length > resolvedSchema.maxLength) {
            errors.push(`${pointer} must be at most ${resolvedSchema.maxLength} character(s) long`);
        }
    }

    if (resolvedSchema.pattern) {
        const matcher = new RegExp(resolvedSchema.pattern);
        if (typeof value !== 'string' || !matcher.test(value)) {
            errors.push(`${pointer} must match pattern ${JSON.stringify(resolvedSchema.pattern)}`);
        }
    }

    if (typeof resolvedSchema.minimum === 'number') {
        if (typeof value !== 'number' || value < resolvedSchema.minimum) {
            errors.push(`${pointer} must be >= ${resolvedSchema.minimum}`);
        }
    }

    if (typeof resolvedSchema.maximum === 'number') {
        if (typeof value !== 'number' || value > resolvedSchema.maximum) {
            errors.push(`${pointer} must be <= ${resolvedSchema.maximum}`);
        }
    }

    if (typeof resolvedSchema.minItems === 'number') {
        if (!Array.isArray(value) || value.length < resolvedSchema.minItems) {
            errors.push(`${pointer} must contain at least ${resolvedSchema.minItems} item(s)`);
        }
    }

    if (typeof resolvedSchema.maxItems === 'number') {
        if (!Array.isArray(value) || value.length > resolvedSchema.maxItems) {
            errors.push(`${pointer} must contain at most ${resolvedSchema.maxItems} item(s)`);
        }
    }

    if (resolvedSchema.uniqueItems === true && Array.isArray(value)) {
        const seen = new Set();
        value.forEach((entry, index) => {
            const serialized = JSON.stringify(entry);
            if (seen.has(serialized)) {
                errors.push(`${pointer}[${index}] must be unique within ${pointer}`);
            } else {
                seen.add(serialized);
            }
        });
    }

    if (resolvedSchema.type === 'object') {
        validateObject(value, resolvedSchema, pointer, errors, rootSchema);
        return;
    }

    if (resolvedSchema.type === 'array') {
        validateArray(value, resolvedSchema, pointer, errors, rootSchema);
    }
}

function validateObject(value, schemaNode, pointer, errors, rootSchema) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return;
    }

    const properties = schemaNode.properties || {};
    const required = Array.isArray(schemaNode.required) ? schemaNode.required : [];

    for (const key of required) {
        if (!(key in value)) {
            errors.push(`${pointer} is missing required property '${key}'`);
        }
    }

    if (schemaNode.additionalProperties === false) {
        for (const key of Object.keys(value)) {
            if (!(key in properties)) {
                errors.push(`${pointer} contains unsupported property '${key}'`);
            }
        }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
        if (key in value) {
            validateAgainstSchema(value[key], propertySchema, `${pointer}.${key}`, errors, rootSchema);
        }
    }
}

function validateArray(value, schemaNode, pointer, errors, rootSchema) {
    if (!Array.isArray(value)) {
        return;
    }

    if (schemaNode.items) {
        value.forEach((entry, index) => {
            validateAgainstSchema(entry, schemaNode.items, `${pointer}[${index}]`, errors, rootSchema);
        });
    }
}

function validateType(value, expectedType, pointer, errors) {
    if (!typeMatches(value, expectedType)) {
        const printableType = Array.isArray(expectedType) ? expectedType.join(' or ') : expectedType;
        errors.push(`${pointer} must be of type ${printableType}`);
    }
}

function typeMatches(value, expectedType) {
    if (Array.isArray(expectedType)) {
        return expectedType.some(candidate => typeMatches(value, candidate));
    }

    switch (expectedType) {
        case 'object':
            return value !== null && typeof value === 'object' && !Array.isArray(value);
        case 'array':
            return Array.isArray(value);
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && Number.isFinite(value);
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'null':
            return value === null;
        default:
            return true;
    }
}

function resolveRef(ref, rootSchema, errors, pointer) {
    if (!ref.startsWith('#/')) {
        errors.push(`${pointer} uses unsupported $ref '${ref}'`);
        return undefined;
    }

    const segments = ref.slice(2).split('/');
    let current = rootSchema;
    for (const segment of segments) {
        if (!current || typeof current !== 'object' || !(segment in current)) {
            errors.push(`${pointer} references missing schema path '${ref}'`);
            return undefined;
        }
        current = current[segment];
    }

    return current;
}

function validateGraphSemantics(document, errors) {
    if (!document || typeof document !== 'object') {
        return;
    }

    const elements = Array.isArray(document.elements) ? document.elements : [];
    const relationships = Array.isArray(document.relationships) ? document.relationships : [];
    const views = Array.isArray(document.views) ? document.views : [];

    const elementById = new Map();
    const relationshipById = new Map();

    for (const element of elements) {
        if (!element || typeof element !== 'object') {
            continue;
        }

        if (elementById.has(element.id)) {
            errors.push(`elements contains duplicate id '${element.id}'`);
            continue;
        }

        elementById.set(element.id, element);

        const expectedMetadata = elementTypeMetadata.get(element.type);
        if (!expectedMetadata) {
            errors.push(`elements '${element.id}' uses unsupported ArchiMate element type '${element.type}'`);
            continue;
        }
    }

    for (const element of elements) {
        if (!element || typeof element !== 'object' || !element.parent) {
            continue;
        }

        if (!elementById.has(element.parent)) {
            errors.push(`elements '${element.id}' references missing parent '${element.parent}'`);
        }
    }

    for (const relationship of relationships) {
        if (!relationship || typeof relationship !== 'object') {
            continue;
        }

        if (relationshipById.has(relationship.id)) {
            errors.push(`relationships contains duplicate id '${relationship.id}'`);
            continue;
        }

        relationshipById.set(relationship.id, relationship);

        const expectedCategory = relationshipCategoryByType.get(relationship.type);
        if (!expectedCategory) {
            errors.push(`relationships '${relationship.id}' uses unsupported ArchiMate relationship type '${relationship.type}'`);
        }

        const source = elementById.get(relationship.source_id);
        if (!source) {
            errors.push(`relationships '${relationship.id}' references missing source_id '${relationship.source_id}'`);
        } else if (relationship.source_name !== source.name) {
            errors.push(`relationships '${relationship.id}' source_name '${relationship.source_name}' does not match element '${relationship.source_id}' name '${source.name}'`);
        }

        const target = elementById.get(relationship.target_id);
        if (!target) {
            errors.push(`relationships '${relationship.id}' references missing target_id '${relationship.target_id}'`);
        } else if (relationship.target_name !== target.name) {
            errors.push(`relationships '${relationship.id}' target_name '${relationship.target_name}' does not match element '${relationship.target_id}' name '${target.name}'`);
        }

        if (source && target) {
            errors.push(...validateRelationshipEndpointTypes(relationship, source, target));
        }
    }

    const topLevelViews = views.filter(view => view && typeof view === 'object' && !view.parent_element_id);
    if (topLevelViews.length !== 1) {
        errors.push(`views must contain exactly one top-level view named 'SystemArchitecture'; found ${topLevelViews.length}`);
    } else if (topLevelViews[0].view_name !== 'SystemArchitecture') {
        errors.push(`top-level view '${topLevelViews[0].view_id}' view_name must be 'SystemArchitecture'`);
    }

    const elementIdsIncludedInViews = new Set();
    const relationshipIdsIncludedInViews = new Set();
    for (const view of views) {
        if (!view || typeof view !== 'object') {
            continue;
        }

        if (!view.parent_element_id && view.view_name !== 'SystemArchitecture') {
            errors.push(`views '${view.view_id}' must declare parent_element_id unless it is the top-level SystemArchitecture view`);
        }

        if (view.parent_element_id) {
            const parent = elementById.get(view.parent_element_id);
            if (!parent) {
                errors.push(`views '${view.view_id}' references missing parent_element_id '${view.parent_element_id}'`);
            } else if (view.parent_element_name && view.parent_element_name !== parent.name) {
                errors.push(`views '${view.view_id}' parent_element_name '${view.parent_element_name}' does not match element '${view.parent_element_id}' name '${parent.name}'`);
            }
        }

        const includedElements = Array.isArray(view.included_elements) ? view.included_elements : [];
        const includedElementIds = new Set(includedElements);
        if (includedElements.length > 7) {
            errors.push(`views '${view.view_id}' must contain at most 7 elements; found ${includedElements.length}. Split the content into layered sub-views before adding more elements.`);
        }
        includedElements.forEach(elementId => {
            elementIdsIncludedInViews.add(elementId);
            if (!elementById.has(elementId)) {
                errors.push(`views '${view.view_id}' references missing included element '${elementId}'`);
            }
        });

        const includedRelationships = Array.isArray(view.included_relationships) ? view.included_relationships : [];
        includedRelationships.forEach(relationshipId => {
            relationshipIdsIncludedInViews.add(relationshipId);
            const relationship = relationshipById.get(relationshipId);
            if (!relationship) {
                errors.push(`views '${view.view_id}' references missing included relationship '${relationshipId}'`);
                return;
            }
            if (!includedElementIds.has(relationship.source_id)) {
                errors.push(`views '${view.view_id}' includes relationship '${relationshipId}' but not source element '${relationship.source_id}'`);
            }
            if (!includedElementIds.has(relationship.target_id)) {
                errors.push(`views '${view.view_id}' includes relationship '${relationshipId}' but not target element '${relationship.target_id}'`);
            }
        });
    }

    for (const element of elements) {
        if (element && typeof element === 'object' && !elementIdsIncludedInViews.has(element.id)) {
            errors.push(`elements '${element.id}' must be included in at least one view`);
        }
    }

    for (const relationship of relationships) {
        if (relationship && typeof relationship === 'object' && !relationshipIdsIncludedInViews.has(relationship.id)) {
            errors.push(`relationships '${relationship.id}' must be included in at least one view`);
        }
    }
}

function isDeepStrictEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function fail(message) {
    console.error(`SystemArchitecture validation failed: ${message}`);
    process.exit(1);
}

main();
```

### `.argo/scripts/validateTraceProposal.js`

```javascript
const fs = require('fs');
const path = require('path');

const repoRoot = process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
const DEFAULT_PROPOSAL_PATH = 'design/KG/ImplementationToIntentTraceProposal.json';
const TRACE_PROPOSAL_SCHEMA_PATH = '.argo/schema/ImplementationToIntentTraceProposal.schema.json';

function main() {
    const proposalPath = process.argv[2] || DEFAULT_PROPOSAL_PATH;
    const errors = validateTraceProposal(proposalPath);

    if (errors.length > 0) {
        console.error('Trace proposal validation failed:');
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exit(1);
    }

    console.log(`Trace proposal validation passed for: ${proposalPath}`);
}

function validateTraceProposal(proposalPath) {
    const errors = [];
    const schemaAbsolutePath = path.join(repoRoot, TRACE_PROPOSAL_SCHEMA_PATH);
    if (!fs.existsSync(schemaAbsolutePath)) {
        errors.push(`schema file is missing at ${TRACE_PROPOSAL_SCHEMA_PATH}`);
        return errors;
    }

    const proposalAbsolutePath = path.join(repoRoot, proposalPath.replace(/[\\/]+/g, path.sep));
    if (!fs.existsSync(proposalAbsolutePath)) {
        errors.push(`proposal file is missing at ${proposalPath}`);
        return errors;
    }

    const document = readJson(proposalAbsolutePath, proposalPath, errors);
    if (!document) {
        return errors;
    }

    requireExact(document, 'proposalType', 'implementation-to-intent-trace', errors, proposalPath);
    requireString(document, 'generatedAt', errors, proposalPath);
    requireExact(document, 'sourceAgent', 'ImplementationDesign', errors, proposalPath);
    requireExact(document, 'targetAgent', 'IntentionDesign', errors, proposalPath);
    requireExact(document, 'lifecycle', 'temporary-trace-proposal', errors, proposalPath);

    const graphPath = requireString(document, 'sourceIntentGraphPath', errors, proposalPath);
    if (graphPath) {
        ensureRepoPathExists(graphPath, `${proposalPath}.sourceIntentGraphPath`, errors);
    }

    const implementationContracts = requireStringArray(document, 'implementationContracts', true, errors, proposalPath);
    if (Array.isArray(implementationContracts)) {
        implementationContracts.forEach((contractPath, index) => {
            ensureRepoPathExists(contractPath, `${proposalPath}.implementationContracts[${index}]`, errors);
        });
    }

    const anchorProposals = requireArray(document, 'anchorProposals', true, errors, proposalPath);
    if (Array.isArray(anchorProposals)) {
        anchorProposals.forEach((anchor, index) => validateAnchorProposal(anchor, `${proposalPath}.anchorProposals[${index}]`, errors));
    }

    return errors;
}

function validateAnchorProposal(anchor, prefix, errors) {
    requireString(anchor, 'intentElementId', errors, prefix);
    requireString(anchor, 'implementationElementName', errors, prefix);
    const implementationElementKind = requireString(anchor, 'implementationElementKind', errors, prefix);
    if (implementationElementKind && ![
        'stable-directory',
        'contract-file',
        'explicit-test-entry',
        'critical-guardrail',
        'runtime-component',
        'schema-contract',
        'mcp-tool',
        'command',
    ].includes(implementationElementKind)) {
        errors.push(`${prefix}.implementationElementKind has unsupported value '${implementationElementKind}'`);
    }

    const implementsType = requireString(anchor, 'implementsType', errors, prefix);
    if (implementsType && !['direct', 'indirect'].includes(implementsType)) {
        errors.push(`${prefix}.implementsType must be 'direct' or 'indirect'`);
    }

    requireString(anchor, 'tracePurpose', errors, prefix);
    const contractPaths = requireStringArray(anchor, 'contractPaths', true, errors, prefix);
    if (Array.isArray(contractPaths)) {
        contractPaths.forEach((contractPath, index) => {
            ensureRepoPathExists(contractPath, `${prefix}.contractPaths[${index}]`, errors);
        });
    }
    const contextEntryPoints = requireStringArray(anchor, 'contextEntryPoints', true, errors, prefix);
    if (Array.isArray(contextEntryPoints)) {
        contextEntryPoints.forEach((entryPoint, index) => {
            ensureRepoPathExists(entryPoint, `${prefix}.contextEntryPoints[${index}]`, errors);
        });
    }
    requireStringArray(anchor, 'excludedDetails', true, errors, prefix);
}

function readJson(filePath, label, errors) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
        errors.push(`failed to parse ${label}: ${String(error)}`);
        return undefined;
    }
}

function requireExact(object, key, expectedValue, errors, prefix) {
    const value = requireString(object, key, errors, prefix);
    if (value && value !== expectedValue) {
        errors.push(`${prefix}.${key} must be '${expectedValue}'`);
    }
}

function requireString(object, key, errors, prefix) {
    if (!object || typeof object[key] !== 'string' || object[key].trim() === '') {
        errors.push(`${prefix}.${key} must be a non-empty string`);
        return undefined;
    }
    return object[key];
}

function requireArray(object, key, mustHaveItems, errors, prefix) {
    if (!object || !Array.isArray(object[key])) {
        errors.push(`${prefix}.${key} must be an array`);
        return undefined;
    }
    if (mustHaveItems && object[key].length === 0) {
        errors.push(`${prefix}.${key} must not be empty`);
    }
    return object[key];
}

function requireStringArray(object, key, mustHaveItems, errors, prefix) {
    const value = requireArray(object, key, mustHaveItems, errors, prefix);
    if (!Array.isArray(value)) {
        return undefined;
    }
    value.forEach((entry, index) => {
        if (typeof entry !== 'string' || entry.trim() === '') {
            errors.push(`${prefix}.${key}[${index}] must be a non-empty string`);
        }
    });
    return value;
}

function ensureRepoPathExists(relativePath, label, errors) {
    const normalized = relativePath.replace(/[\\/]+/g, path.sep);
    const absolutePath = path.join(repoRoot, normalized);
    if (!fs.existsSync(absolutePath)) {
        errors.push(`${label} points to a missing path: ${relativePath}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    validateTraceProposal,
};
```

### `.argo/scripts/validator-mcp-server.js`

```javascript
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const HANDOFF_STAGES = ['intent-to-implementation', 'implementation-to-coding'];
const DEFAULT_TRACE_PROPOSAL_PATH = 'design/KG/ImplementationToIntentTraceProposal.json';
const DEFAULT_ARCHITECTURE_GRAPH_PATH = 'design/KG/SystemArchitecture.json';

const SCRIPT_CANDIDATES = {
  validateSystemArchitecture: [
    '.argo/scripts/validateSystemArchitecture.js',
  ],
  validateStageHandoff: [
    '.argo/scripts/validateStageHandoff.js',
  ],
  validateTraceProposal: [
    '.argo/scripts/validateTraceProposal.js',
  ],
  runArchitectureTests: [
    '.argo/scripts/runArchitectureTests.js',
  ],
};

const TOOLS = [
  {
    name: 'validateSystemArchitecture',
    description: 'Validate design/KG/SystemArchitecture.json against .argo/schema/SystemArchitecture.schema.json and Argo graph rules.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'validateStageHandoff',
    description: 'Validate Argo stage handoff JSON. Use stage intent-to-implementation or implementation-to-coding, or omit to validate all supported stages.',
    inputSchema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          enum: HANDOFF_STAGES,
          description: 'Optional handoff stage to validate.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'validateTraceProposal',
    description: 'Validate ImplementationToIntentTraceProposal JSON against .argo/schema/ImplementationToIntentTraceProposal.schema.json and repository path references.',
    inputSchema: {
      type: 'object',
      properties: {
        proposalPath: {
          type: 'string',
          description: `Optional proposal path relative to workspace root. Default: ${DEFAULT_TRACE_PROPOSAL_PATH}`,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'runArchitectureTests',
    description: 'Execute explicit architecture testcases from the intent graph and refresh design/KG/test-failure-records.json.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: {
          type: 'string',
          description: `Optional architecture graph path relative to workspace root. Default: ${DEFAULT_ARCHITECTURE_GRAPH_PATH}`,
        },
      },
      additionalProperties: false,
    },
  },
];

function resolveWorkspaceRoot() {
  return process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
}

function resolveScriptPath(workspaceRoot, candidates) {
  for (const relativePath of candidates) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    if (fs.existsSync(absolutePath)) {
      return { absolutePath, relativePath };
    }
  }

  throw new Error(`Unable to locate validator script. Checked: ${candidates.join(', ')}`);
}

async function runValidatorScript(workspaceRoot, scriptKey, args = []) {
  const { absolutePath, relativePath } = resolveScriptPath(workspaceRoot, SCRIPT_CANDIDATES[scriptKey]);
  const command = process.execPath;
  const commandArgs = [absolutePath, ...args];

  try {
    const { stdout, stderr } = await execFileAsync(command, commandArgs, {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        ARGO_REPO_ROOT: workspaceRoot,
      },
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      status: 'passed',
      exitCode: 0,
      workspaceRoot,
      scriptPath: relativePath,
      command: [command, ...commandArgs],
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    return {
      status: 'failed',
      exitCode: typeof error.code === 'number' ? error.code : 1,
      workspaceRoot,
      scriptPath: relativePath,
      command: [command, ...commandArgs],
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || error.message || error).trim(),
    };
  }
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function toolResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    isError: payload.status === 'failed',
  };
}

async function callTool(name, args) {
  const workspaceRoot = resolveWorkspaceRoot();

  if (name === 'validateSystemArchitecture') {
    return toolResult(await runValidatorScript(workspaceRoot, 'validateSystemArchitecture'));
  }

  if (name === 'validateStageHandoff') {
    const stage = args && args.stage;
    if (stage && !HANDOFF_STAGES.includes(stage)) {
      throw new Error(`Unsupported handoff stage '${stage}'. Expected one of: ${HANDOFF_STAGES.join(', ')}`);
    }
    return toolResult(await runValidatorScript(workspaceRoot, 'validateStageHandoff', stage ? [stage] : []));
  }

  if (name === 'validateTraceProposal') {
    const proposalPath = (args && args.proposalPath) || DEFAULT_TRACE_PROPOSAL_PATH;
    return toolResult(await runValidatorScript(workspaceRoot, 'validateTraceProposal', [proposalPath]));
  }

  if (name === 'runArchitectureTests') {
    const architecturePath = (args && args.architecturePath) || DEFAULT_ARCHITECTURE_GRAPH_PATH;
    return toolResult(await runValidatorScript(workspaceRoot, 'runArchitectureTests', [architecturePath]));
  }

  throw new Error(`Unknown tool: ${name}`);
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'argo',
          version: '1.0.0',
        },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS,
      },
    };
  }

  if (method === 'tools/call') {
    try {
      const result = await callTool(params.name, params.arguments || {});
      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: String(error && error.stack ? error.stack : error),
            },
          ],
          isError: true,
        },
      };
    }
  }

  if (method === 'ping') {
    return {
      jsonrpc: '2.0',
      id,
      result: {},
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  };
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }

    let request;
    try {
      request = JSON.parse(line);
    } catch {
      continue;
    }

    const response = await handleRequest(request);
    if (response) {
      send(response);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  callTool,
  main,
};
```

### `.cursor/.obsidian/app.json`

```json
{
  "readableLineLength": false
}
```

### `.cursor/.obsidian/appearance.json`

```json
{}
```

### `.cursor/.obsidian/community-plugins.json`

```json
[
  "obsidian-plantuml"
]
```

### `.cursor/.obsidian/core-plugins.json`

```json
{
  "file-explorer": true,
  "global-search": true,
  "switcher": true,
  "graph": true,
  "backlink": true,
  "canvas": true,
  "outgoing-link": true,
  "tag-pane": true,
  "footnotes": false,
  "properties": true,
  "page-preview": true,
  "daily-notes": true,
  "templates": true,
  "note-composer": true,
  "command-palette": true,
  "slash-command": false,
  "editor-status": true,
  "bookmarks": true,
  "markdown-importer": false,
  "zk-prefixer": false,
  "random-note": false,
  "outline": true,
  "word-count": true,
  "slides": false,
  "audio-recorder": false,
  "workspaces": false,
  "file-recovery": true,
  "publish": false,
  "sync": true,
  "bases": true,
  "webviewer": false
}
```

### `.cursor/.obsidian/plugins/obsidian-plantuml/main.js`

```javascript
/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
https://github.com/joethei/obsidian-plantuml
*/

var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// node_modules/plantuml-encoder/dist/plantuml-encoder.js
var require_plantuml_encoder = __commonJS({
  "node_modules/plantuml-encoder/dist/plantuml-encoder.js"(exports, module2) {
    (function(f) {
      if (typeof exports === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.plantumlEncoder = f();
      }
    })(function() {
      var define2, module3, exports2;
      return function() {
        function r(e, n, t) {
          function o(i2, f) {
            if (!n[i2]) {
              if (!e[i2]) {
                var c = typeof require == "function" && require;
                if (!f && c)
                  return c(i2, true);
                if (u)
                  return u(i2, true);
                var a = new Error("Cannot find module '" + i2 + "'");
                throw a.code = "MODULE_NOT_FOUND", a;
              }
              var p = n[i2] = { exports: {} };
              e[i2][0].call(p.exports, function(r2) {
                var n2 = e[i2][1][r2];
                return o(n2 || r2);
              }, p, p.exports, r, e, n, t);
            }
            return n[i2].exports;
          }
          for (var u = typeof require == "function" && require, i = 0; i < t.length; i++)
            o(t[i]);
          return o;
        }
        return r;
      }()({ 1: [function(require2, module4, exports3) {
        "use strict";
        var pako = require2("pako/lib/deflate.js");
        module4.exports = function(data) {
          return pako.deflateRaw(data, { level: 9, to: "string" });
        };
      }, { "pako/lib/deflate.js": 4 }], 2: [function(require2, module4, exports3) {
        "use strict";
        function encode6bit(b) {
          if (b < 10) {
            return String.fromCharCode(48 + b);
          }
          b -= 10;
          if (b < 26) {
            return String.fromCharCode(65 + b);
          }
          b -= 26;
          if (b < 26) {
            return String.fromCharCode(97 + b);
          }
          b -= 26;
          if (b === 0) {
            return "-";
          }
          if (b === 1) {
            return "_";
          }
          return "?";
        }
        function append3bytes(b1, b2, b3) {
          var c1 = b1 >> 2;
          var c2 = (b1 & 3) << 4 | b2 >> 4;
          var c3 = (b2 & 15) << 2 | b3 >> 6;
          var c4 = b3 & 63;
          var r = "";
          r += encode6bit(c1 & 63);
          r += encode6bit(c2 & 63);
          r += encode6bit(c3 & 63);
          r += encode6bit(c4 & 63);
          return r;
        }
        module4.exports = function(data) {
          var r = "";
          for (var i = 0; i < data.length; i += 3) {
            if (i + 2 === data.length) {
              r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
            } else if (i + 1 === data.length) {
              r += append3bytes(data.charCodeAt(i), 0, 0);
            } else {
              r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
            }
          }
          return r;
        };
      }, {}], 3: [function(require2, module4, exports3) {
        "use strict";
        var deflate = require2("./deflate");
        var encode64 = require2("./encode64");
        module4.exports.encode = function(puml) {
          var deflated = deflate(puml);
          return encode64(deflated);
        };
      }, { "./deflate": 1, "./encode64": 2 }], 4: [function(require2, module4, exports3) {
        "use strict";
        var zlib_deflate = require2("./zlib/deflate");
        var utils = require2("./utils/common");
        var strings = require2("./utils/strings");
        var msg = require2("./zlib/messages");
        var ZStream = require2("./zlib/zstream");
        var toString = Object.prototype.toString;
        var Z_NO_FLUSH = 0;
        var Z_FINISH = 4;
        var Z_OK = 0;
        var Z_STREAM_END = 1;
        var Z_SYNC_FLUSH = 2;
        var Z_DEFAULT_COMPRESSION = -1;
        var Z_DEFAULT_STRATEGY = 0;
        var Z_DEFLATED = 8;
        function Deflate(options) {
          if (!(this instanceof Deflate))
            return new Deflate(options);
          this.options = utils.assign({
            level: Z_DEFAULT_COMPRESSION,
            method: Z_DEFLATED,
            chunkSize: 16384,
            windowBits: 15,
            memLevel: 8,
            strategy: Z_DEFAULT_STRATEGY,
            to: ""
          }, options || {});
          var opt = this.options;
          if (opt.raw && opt.windowBits > 0) {
            opt.windowBits = -opt.windowBits;
          } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
            opt.windowBits += 16;
          }
          this.err = 0;
          this.msg = "";
          this.ended = false;
          this.chunks = [];
          this.strm = new ZStream();
          this.strm.avail_out = 0;
          var status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
          if (opt.header) {
            zlib_deflate.deflateSetHeader(this.strm, opt.header);
          }
          if (opt.dictionary) {
            var dict;
            if (typeof opt.dictionary === "string") {
              dict = strings.string2buf(opt.dictionary);
            } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
              dict = new Uint8Array(opt.dictionary);
            } else {
              dict = opt.dictionary;
            }
            status = zlib_deflate.deflateSetDictionary(this.strm, dict);
            if (status !== Z_OK) {
              throw new Error(msg[status]);
            }
            this._dict_set = true;
          }
        }
        Deflate.prototype.push = function(data, mode) {
          var strm = this.strm;
          var chunkSize = this.options.chunkSize;
          var status, _mode;
          if (this.ended) {
            return false;
          }
          _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
          if (typeof data === "string") {
            strm.input = strings.string2buf(data);
          } else if (toString.call(data) === "[object ArrayBuffer]") {
            strm.input = new Uint8Array(data);
          } else {
            strm.input = data;
          }
          strm.next_in = 0;
          strm.avail_in = strm.input.length;
          do {
            if (strm.avail_out === 0) {
              strm.output = new utils.Buf8(chunkSize);
              strm.next_out = 0;
              strm.avail_out = chunkSize;
            }
            status = zlib_deflate.deflate(strm, _mode);
            if (status !== Z_STREAM_END && status !== Z_OK) {
              this.onEnd(status);
              this.ended = true;
              return false;
            }
            if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
              if (this.options.to === "string") {
                this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
              } else {
                this.onData(utils.shrinkBuf(strm.output, strm.next_out));
              }
            }
          } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
          if (_mode === Z_FINISH) {
            status = zlib_deflate.deflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === Z_OK;
          }
          if (_mode === Z_SYNC_FLUSH) {
            this.onEnd(Z_OK);
            strm.avail_out = 0;
            return true;
          }
          return true;
        };
        Deflate.prototype.onData = function(chunk) {
          this.chunks.push(chunk);
        };
        Deflate.prototype.onEnd = function(status) {
          if (status === Z_OK) {
            if (this.options.to === "string") {
              this.result = this.chunks.join("");
            } else {
              this.result = utils.flattenChunks(this.chunks);
            }
          }
          this.chunks = [];
          this.err = status;
          this.msg = this.strm.msg;
        };
        function deflate(input, options) {
          var deflator = new Deflate(options);
          deflator.push(input, true);
          if (deflator.err) {
            throw deflator.msg || msg[deflator.err];
          }
          return deflator.result;
        }
        function deflateRaw(input, options) {
          options = options || {};
          options.raw = true;
          return deflate(input, options);
        }
        function gzip(input, options) {
          options = options || {};
          options.gzip = true;
          return deflate(input, options);
        }
        exports3.Deflate = Deflate;
        exports3.deflate = deflate;
        exports3.deflateRaw = deflateRaw;
        exports3.gzip = gzip;
      }, { "./utils/common": 5, "./utils/strings": 6, "./zlib/deflate": 9, "./zlib/messages": 10, "./zlib/zstream": 12 }], 5: [function(require2, module4, exports3) {
        "use strict";
        var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
        function _has(obj, key) {
          return Object.prototype.hasOwnProperty.call(obj, key);
        }
        exports3.assign = function(obj) {
          var sources = Array.prototype.slice.call(arguments, 1);
          while (sources.length) {
            var source = sources.shift();
            if (!source) {
              continue;
            }
            if (typeof source !== "object") {
              throw new TypeError(source + "must be non-object");
            }
            for (var p in source) {
              if (_has(source, p)) {
                obj[p] = source[p];
              }
            }
          }
          return obj;
        };
        exports3.shrinkBuf = function(buf, size) {
          if (buf.length === size) {
            return buf;
          }
          if (buf.subarray) {
            return buf.subarray(0, size);
          }
          buf.length = size;
          return buf;
        };
        var fnTyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            if (src.subarray && dest.subarray) {
              dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
              return;
            }
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          flattenChunks: function(chunks) {
            var i, l, len, pos, chunk, result;
            len = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              len += chunks[i].length;
            }
            result = new Uint8Array(len);
            pos = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              chunk = chunks[i];
              result.set(chunk, pos);
              pos += chunk.length;
            }
            return result;
          }
        };
        var fnUntyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          flattenChunks: function(chunks) {
            return [].concat.apply([], chunks);
          }
        };
        exports3.setTyped = function(on) {
          if (on) {
            exports3.Buf8 = Uint8Array;
            exports3.Buf16 = Uint16Array;
            exports3.Buf32 = Int32Array;
            exports3.assign(exports3, fnTyped);
          } else {
            exports3.Buf8 = Array;
            exports3.Buf16 = Array;
            exports3.Buf32 = Array;
            exports3.assign(exports3, fnUntyped);
          }
        };
        exports3.setTyped(TYPED_OK);
      }, {}], 6: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("./common");
        var STR_APPLY_OK = true;
        var STR_APPLY_UIA_OK = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (__) {
          STR_APPLY_OK = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (__) {
          STR_APPLY_UIA_OK = false;
        }
        var _utf8len = new utils.Buf8(256);
        for (var q = 0; q < 256; q++) {
          _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
        }
        _utf8len[254] = _utf8len[254] = 1;
        exports3.string2buf = function(str) {
          var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
          for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
          }
          buf = new utils.Buf8(buf_len);
          for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            if (c < 128) {
              buf[i++] = c;
            } else if (c < 2048) {
              buf[i++] = 192 | c >>> 6;
              buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
              buf[i++] = 224 | c >>> 12;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            } else {
              buf[i++] = 240 | c >>> 18;
              buf[i++] = 128 | c >>> 12 & 63;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            }
          }
          return buf;
        };
        function buf2binstring(buf, len) {
          if (len < 65534) {
            if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
              return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
            }
          }
          var result = "";
          for (var i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
          }
          return result;
        }
        exports3.buf2binstring = function(buf) {
          return buf2binstring(buf, buf.length);
        };
        exports3.binstring2buf = function(str) {
          var buf = new utils.Buf8(str.length);
          for (var i = 0, len = buf.length; i < len; i++) {
            buf[i] = str.charCodeAt(i);
          }
          return buf;
        };
        exports3.buf2string = function(buf, max) {
          var i, out, c, c_len;
          var len = max || buf.length;
          var utf16buf = new Array(len * 2);
          for (out = 0, i = 0; i < len; ) {
            c = buf[i++];
            if (c < 128) {
              utf16buf[out++] = c;
              continue;
            }
            c_len = _utf8len[c];
            if (c_len > 4) {
              utf16buf[out++] = 65533;
              i += c_len - 1;
              continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
              c = c << 6 | buf[i++] & 63;
              c_len--;
            }
            if (c_len > 1) {
              utf16buf[out++] = 65533;
              continue;
            }
            if (c < 65536) {
              utf16buf[out++] = c;
            } else {
              c -= 65536;
              utf16buf[out++] = 55296 | c >> 10 & 1023;
              utf16buf[out++] = 56320 | c & 1023;
            }
          }
          return buf2binstring(utf16buf, out);
        };
        exports3.utf8border = function(buf, max) {
          var pos;
          max = max || buf.length;
          if (max > buf.length) {
            max = buf.length;
          }
          pos = max - 1;
          while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
          }
          if (pos < 0) {
            return max;
          }
          if (pos === 0) {
            return max;
          }
          return pos + _utf8len[buf[pos]] > max ? pos : max;
        };
      }, { "./common": 5 }], 7: [function(require2, module4, exports3) {
        "use strict";
        function adler32(adler, buf, len, pos) {
          var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
          while (len !== 0) {
            n = len > 2e3 ? 2e3 : len;
            len -= n;
            do {
              s1 = s1 + buf[pos++] | 0;
              s2 = s2 + s1 | 0;
            } while (--n);
            s1 %= 65521;
            s2 %= 65521;
          }
          return s1 | s2 << 16 | 0;
        }
        module4.exports = adler32;
      }, {}], 8: [function(require2, module4, exports3) {
        "use strict";
        function makeTable() {
          var c, table = [];
          for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
              c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
          }
          return table;
        }
        var crcTable = makeTable();
        function crc32(crc, buf, len, pos) {
          var t = crcTable, end = pos + len;
          crc ^= -1;
          for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
          }
          return crc ^ -1;
        }
        module4.exports = crc32;
      }, {}], 9: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var trees = require2("./trees");
        var adler32 = require2("./adler32");
        var crc32 = require2("./crc32");
        var msg = require2("./messages");
        var Z_NO_FLUSH = 0;
        var Z_PARTIAL_FLUSH = 1;
        var Z_FULL_FLUSH = 3;
        var Z_FINISH = 4;
        var Z_BLOCK = 5;
        var Z_OK = 0;
        var Z_STREAM_END = 1;
        var Z_STREAM_ERROR = -2;
        var Z_DATA_ERROR = -3;
        var Z_BUF_ERROR = -5;
        var Z_DEFAULT_COMPRESSION = -1;
        var Z_FILTERED = 1;
        var Z_HUFFMAN_ONLY = 2;
        var Z_RLE = 3;
        var Z_FIXED = 4;
        var Z_DEFAULT_STRATEGY = 0;
        var Z_UNKNOWN = 2;
        var Z_DEFLATED = 8;
        var MAX_MEM_LEVEL = 9;
        var MAX_WBITS = 15;
        var DEF_MEM_LEVEL = 8;
        var LENGTH_CODES = 29;
        var LITERALS = 256;
        var L_CODES = LITERALS + 1 + LENGTH_CODES;
        var D_CODES = 30;
        var BL_CODES = 19;
        var HEAP_SIZE = 2 * L_CODES + 1;
        var MAX_BITS = 15;
        var MIN_MATCH = 3;
        var MAX_MATCH = 258;
        var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
        var PRESET_DICT = 32;
        var INIT_STATE = 42;
        var EXTRA_STATE = 69;
        var NAME_STATE = 73;
        var COMMENT_STATE = 91;
        var HCRC_STATE = 103;
        var BUSY_STATE = 113;
        var FINISH_STATE = 666;
        var BS_NEED_MORE = 1;
        var BS_BLOCK_DONE = 2;
        var BS_FINISH_STARTED = 3;
        var BS_FINISH_DONE = 4;
        var OS_CODE = 3;
        function err(strm, errorCode) {
          strm.msg = msg[errorCode];
          return errorCode;
        }
        function rank(f) {
          return (f << 1) - (f > 4 ? 9 : 0);
        }
        function zero(buf) {
          var len = buf.length;
          while (--len >= 0) {
            buf[len] = 0;
          }
        }
        function flush_pending(strm) {
          var s = strm.state;
          var len = s.pending;
          if (len > strm.avail_out) {
            len = strm.avail_out;
          }
          if (len === 0) {
            return;
          }
          utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
          strm.next_out += len;
          s.pending_out += len;
          strm.total_out += len;
          strm.avail_out -= len;
          s.pending -= len;
          if (s.pending === 0) {
            s.pending_out = 0;
          }
        }
        function flush_block_only(s, last) {
          trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
          s.block_start = s.strstart;
          flush_pending(s.strm);
        }
        function put_byte(s, b) {
          s.pending_buf[s.pending++] = b;
        }
        function putShortMSB(s, b) {
          s.pending_buf[s.pending++] = b >>> 8 & 255;
          s.pending_buf[s.pending++] = b & 255;
        }
        function read_buf(strm, buf, start, size) {
          var len = strm.avail_in;
          if (len > size) {
            len = size;
          }
          if (len === 0) {
            return 0;
          }
          strm.avail_in -= len;
          utils.arraySet(buf, strm.input, strm.next_in, len, start);
          if (strm.state.wrap === 1) {
            strm.adler = adler32(strm.adler, buf, len, start);
          } else if (strm.state.wrap === 2) {
            strm.adler = crc32(strm.adler, buf, len, start);
          }
          strm.next_in += len;
          strm.total_in += len;
          return len;
        }
        function longest_match(s, cur_match) {
          var chain_length = s.max_chain_length;
          var scan = s.strstart;
          var match;
          var len;
          var best_len = s.prev_length;
          var nice_match = s.nice_match;
          var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
          var _win = s.window;
          var wmask = s.w_mask;
          var prev = s.prev;
          var strend = s.strstart + MAX_MATCH;
          var scan_end1 = _win[scan + best_len - 1];
          var scan_end = _win[scan + best_len];
          if (s.prev_length >= s.good_match) {
            chain_length >>= 2;
          }
          if (nice_match > s.lookahead) {
            nice_match = s.lookahead;
          }
          do {
            match = cur_match;
            if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
              continue;
            }
            scan += 2;
            match++;
            do {
            } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
            len = MAX_MATCH - (strend - scan);
            scan = strend - MAX_MATCH;
            if (len > best_len) {
              s.match_start = cur_match;
              best_len = len;
              if (len >= nice_match) {
                break;
              }
              scan_end1 = _win[scan + best_len - 1];
              scan_end = _win[scan + best_len];
            }
          } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
          if (best_len <= s.lookahead) {
            return best_len;
          }
          return s.lookahead;
        }
        function fill_window(s) {
          var _w_size = s.w_size;
          var p, n, m, more, str;
          do {
            more = s.window_size - s.lookahead - s.strstart;
            if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
              utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
              s.match_start -= _w_size;
              s.strstart -= _w_size;
              s.block_start -= _w_size;
              n = s.hash_size;
              p = n;
              do {
                m = s.head[--p];
                s.head[p] = m >= _w_size ? m - _w_size : 0;
              } while (--n);
              n = _w_size;
              p = n;
              do {
                m = s.prev[--p];
                s.prev[p] = m >= _w_size ? m - _w_size : 0;
              } while (--n);
              more += _w_size;
            }
            if (s.strm.avail_in === 0) {
              break;
            }
            n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
            s.lookahead += n;
            if (s.lookahead + s.insert >= MIN_MATCH) {
              str = s.strstart - s.insert;
              s.ins_h = s.window[str];
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
              while (s.insert) {
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
                s.prev[str & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = str;
                str++;
                s.insert--;
                if (s.lookahead + s.insert < MIN_MATCH) {
                  break;
                }
              }
            }
          } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
        }
        function deflate_stored(s, flush) {
          var max_block_size = 65535;
          if (max_block_size > s.pending_buf_size - 5) {
            max_block_size = s.pending_buf_size - 5;
          }
          for (; ; ) {
            if (s.lookahead <= 1) {
              fill_window(s);
              if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            s.strstart += s.lookahead;
            s.lookahead = 0;
            var max_start = s.block_start + max_block_size;
            if (s.strstart === 0 || s.strstart >= max_start) {
              s.lookahead = s.strstart - max_start;
              s.strstart = max_start;
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
            if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = 0;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.strstart > s.block_start) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_NEED_MORE;
        }
        function deflate_fast(s, flush) {
          var hash_head;
          var bflush;
          for (; ; ) {
            if (s.lookahead < MIN_LOOKAHEAD) {
              fill_window(s);
              if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            hash_head = 0;
            if (s.lookahead >= MIN_MATCH) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
            if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
              s.match_length = longest_match(s, hash_head);
            }
            if (s.match_length >= MIN_MATCH) {
              bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
              s.lookahead -= s.match_length;
              if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
                s.match_length--;
                do {
                  s.strstart++;
                  s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                  s.head[s.ins_h] = s.strstart;
                } while (--s.match_length !== 0);
                s.strstart++;
              } else {
                s.strstart += s.match_length;
                s.match_length = 0;
                s.ins_h = s.window[s.strstart];
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
              }
            } else {
              bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
              s.lookahead--;
              s.strstart++;
            }
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function deflate_slow(s, flush) {
          var hash_head;
          var bflush;
          var max_insert;
          for (; ; ) {
            if (s.lookahead < MIN_LOOKAHEAD) {
              fill_window(s);
              if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            hash_head = 0;
            if (s.lookahead >= MIN_MATCH) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
            s.prev_length = s.match_length;
            s.prev_match = s.match_start;
            s.match_length = MIN_MATCH - 1;
            if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
              s.match_length = longest_match(s, hash_head);
              if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
                s.match_length = MIN_MATCH - 1;
              }
            }
            if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
              max_insert = s.strstart + s.lookahead - MIN_MATCH;
              bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
              s.lookahead -= s.prev_length - 1;
              s.prev_length -= 2;
              do {
                if (++s.strstart <= max_insert) {
                  s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                  hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                  s.head[s.ins_h] = s.strstart;
                }
              } while (--s.prev_length !== 0);
              s.match_available = 0;
              s.match_length = MIN_MATCH - 1;
              s.strstart++;
              if (bflush) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                  return BS_NEED_MORE;
                }
              }
            } else if (s.match_available) {
              bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
              if (bflush) {
                flush_block_only(s, false);
              }
              s.strstart++;
              s.lookahead--;
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            } else {
              s.match_available = 1;
              s.strstart++;
              s.lookahead--;
            }
          }
          if (s.match_available) {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
            s.match_available = 0;
          }
          s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function deflate_rle(s, flush) {
          var bflush;
          var prev;
          var scan, strend;
          var _win = s.window;
          for (; ; ) {
            if (s.lookahead <= MAX_MATCH) {
              fill_window(s);
              if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              if (s.lookahead === 0) {
                break;
              }
            }
            s.match_length = 0;
            if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
              scan = s.strstart - 1;
              prev = _win[scan];
              if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
                strend = s.strstart + MAX_MATCH;
                do {
                } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
                s.match_length = MAX_MATCH - (strend - scan);
                if (s.match_length > s.lookahead) {
                  s.match_length = s.lookahead;
                }
              }
            }
            if (s.match_length >= MIN_MATCH) {
              bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
              s.lookahead -= s.match_length;
              s.strstart += s.match_length;
              s.match_length = 0;
            } else {
              bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
              s.lookahead--;
              s.strstart++;
            }
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = 0;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function deflate_huff(s, flush) {
          var bflush;
          for (; ; ) {
            if (s.lookahead === 0) {
              fill_window(s);
              if (s.lookahead === 0) {
                if (flush === Z_NO_FLUSH) {
                  return BS_NEED_MORE;
                }
                break;
              }
            }
            s.match_length = 0;
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          }
          s.insert = 0;
          if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
              return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
          }
          if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          return BS_BLOCK_DONE;
        }
        function Config(good_length, max_lazy, nice_length, max_chain, func) {
          this.good_length = good_length;
          this.max_lazy = max_lazy;
          this.nice_length = nice_length;
          this.max_chain = max_chain;
          this.func = func;
        }
        var configuration_table;
        configuration_table = [
          new Config(0, 0, 0, 0, deflate_stored),
          new Config(4, 4, 8, 4, deflate_fast),
          new Config(4, 5, 16, 8, deflate_fast),
          new Config(4, 6, 32, 32, deflate_fast),
          new Config(4, 4, 16, 16, deflate_slow),
          new Config(8, 16, 32, 32, deflate_slow),
          new Config(8, 16, 128, 128, deflate_slow),
          new Config(8, 32, 128, 256, deflate_slow),
          new Config(32, 128, 258, 1024, deflate_slow),
          new Config(32, 258, 258, 4096, deflate_slow)
        ];
        function lm_init(s) {
          s.window_size = 2 * s.w_size;
          zero(s.head);
          s.max_lazy_match = configuration_table[s.level].max_lazy;
          s.good_match = configuration_table[s.level].good_length;
          s.nice_match = configuration_table[s.level].nice_length;
          s.max_chain_length = configuration_table[s.level].max_chain;
          s.strstart = 0;
          s.block_start = 0;
          s.lookahead = 0;
          s.insert = 0;
          s.match_length = s.prev_length = MIN_MATCH - 1;
          s.match_available = 0;
          s.ins_h = 0;
        }
        function DeflateState() {
          this.strm = null;
          this.status = 0;
          this.pending_buf = null;
          this.pending_buf_size = 0;
          this.pending_out = 0;
          this.pending = 0;
          this.wrap = 0;
          this.gzhead = null;
          this.gzindex = 0;
          this.method = Z_DEFLATED;
          this.last_flush = -1;
          this.w_size = 0;
          this.w_bits = 0;
          this.w_mask = 0;
          this.window = null;
          this.window_size = 0;
          this.prev = null;
          this.head = null;
          this.ins_h = 0;
          this.hash_size = 0;
          this.hash_bits = 0;
          this.hash_mask = 0;
          this.hash_shift = 0;
          this.block_start = 0;
          this.match_length = 0;
          this.prev_match = 0;
          this.match_available = 0;
          this.strstart = 0;
          this.match_start = 0;
          this.lookahead = 0;
          this.prev_length = 0;
          this.max_chain_length = 0;
          this.max_lazy_match = 0;
          this.level = 0;
          this.strategy = 0;
          this.good_match = 0;
          this.nice_match = 0;
          this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
          this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
          this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
          zero(this.dyn_ltree);
          zero(this.dyn_dtree);
          zero(this.bl_tree);
          this.l_desc = null;
          this.d_desc = null;
          this.bl_desc = null;
          this.bl_count = new utils.Buf16(MAX_BITS + 1);
          this.heap = new utils.Buf16(2 * L_CODES + 1);
          zero(this.heap);
          this.heap_len = 0;
          this.heap_max = 0;
          this.depth = new utils.Buf16(2 * L_CODES + 1);
          zero(this.depth);
          this.l_buf = 0;
          this.lit_bufsize = 0;
          this.last_lit = 0;
          this.d_buf = 0;
          this.opt_len = 0;
          this.static_len = 0;
          this.matches = 0;
          this.insert = 0;
          this.bi_buf = 0;
          this.bi_valid = 0;
        }
        function deflateResetKeep(strm) {
          var s;
          if (!strm || !strm.state) {
            return err(strm, Z_STREAM_ERROR);
          }
          strm.total_in = strm.total_out = 0;
          strm.data_type = Z_UNKNOWN;
          s = strm.state;
          s.pending = 0;
          s.pending_out = 0;
          if (s.wrap < 0) {
            s.wrap = -s.wrap;
          }
          s.status = s.wrap ? INIT_STATE : BUSY_STATE;
          strm.adler = s.wrap === 2 ? 0 : 1;
          s.last_flush = Z_NO_FLUSH;
          trees._tr_init(s);
          return Z_OK;
        }
        function deflateReset(strm) {
          var ret = deflateResetKeep(strm);
          if (ret === Z_OK) {
            lm_init(strm.state);
          }
          return ret;
        }
        function deflateSetHeader(strm, head) {
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          if (strm.state.wrap !== 2) {
            return Z_STREAM_ERROR;
          }
          strm.state.gzhead = head;
          return Z_OK;
        }
        function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
          if (!strm) {
            return Z_STREAM_ERROR;
          }
          var wrap = 1;
          if (level === Z_DEFAULT_COMPRESSION) {
            level = 6;
          }
          if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
          } else if (windowBits > 15) {
            wrap = 2;
            windowBits -= 16;
          }
          if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
            return err(strm, Z_STREAM_ERROR);
          }
          if (windowBits === 8) {
            windowBits = 9;
          }
          var s = new DeflateState();
          strm.state = s;
          s.strm = strm;
          s.wrap = wrap;
          s.gzhead = null;
          s.w_bits = windowBits;
          s.w_size = 1 << s.w_bits;
          s.w_mask = s.w_size - 1;
          s.hash_bits = memLevel + 7;
          s.hash_size = 1 << s.hash_bits;
          s.hash_mask = s.hash_size - 1;
          s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
          s.window = new utils.Buf8(s.w_size * 2);
          s.head = new utils.Buf16(s.hash_size);
          s.prev = new utils.Buf16(s.w_size);
          s.lit_bufsize = 1 << memLevel + 6;
          s.pending_buf_size = s.lit_bufsize * 4;
          s.pending_buf = new utils.Buf8(s.pending_buf_size);
          s.d_buf = 1 * s.lit_bufsize;
          s.l_buf = (1 + 2) * s.lit_bufsize;
          s.level = level;
          s.strategy = strategy;
          s.method = method;
          return deflateReset(strm);
        }
        function deflateInit(strm, level) {
          return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
        }
        function deflate(strm, flush) {
          var old_flush, s;
          var beg, val;
          if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
            return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
          }
          s = strm.state;
          if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
            return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
          }
          s.strm = strm;
          old_flush = s.last_flush;
          s.last_flush = flush;
          if (s.status === INIT_STATE) {
            if (s.wrap === 2) {
              strm.adler = 0;
              put_byte(s, 31);
              put_byte(s, 139);
              put_byte(s, 8);
              if (!s.gzhead) {
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, 0);
                put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
                put_byte(s, OS_CODE);
                s.status = BUSY_STATE;
              } else {
                put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
                put_byte(s, s.gzhead.time & 255);
                put_byte(s, s.gzhead.time >> 8 & 255);
                put_byte(s, s.gzhead.time >> 16 & 255);
                put_byte(s, s.gzhead.time >> 24 & 255);
                put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
                put_byte(s, s.gzhead.os & 255);
                if (s.gzhead.extra && s.gzhead.extra.length) {
                  put_byte(s, s.gzhead.extra.length & 255);
                  put_byte(s, s.gzhead.extra.length >> 8 & 255);
                }
                if (s.gzhead.hcrc) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
                }
                s.gzindex = 0;
                s.status = EXTRA_STATE;
              }
            } else {
              var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
              var level_flags = -1;
              if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
                level_flags = 0;
              } else if (s.level < 6) {
                level_flags = 1;
              } else if (s.level === 6) {
                level_flags = 2;
              } else {
                level_flags = 3;
              }
              header |= level_flags << 6;
              if (s.strstart !== 0) {
                header |= PRESET_DICT;
              }
              header += 31 - header % 31;
              s.status = BUSY_STATE;
              putShortMSB(s, header);
              if (s.strstart !== 0) {
                putShortMSB(s, strm.adler >>> 16);
                putShortMSB(s, strm.adler & 65535);
              }
              strm.adler = 1;
            }
          }
          if (s.status === EXTRA_STATE) {
            if (s.gzhead.extra) {
              beg = s.pending;
              while (s.gzindex < (s.gzhead.extra.length & 65535)) {
                if (s.pending === s.pending_buf_size) {
                  if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                  }
                  flush_pending(strm);
                  beg = s.pending;
                  if (s.pending === s.pending_buf_size) {
                    break;
                  }
                }
                put_byte(s, s.gzhead.extra[s.gzindex] & 255);
                s.gzindex++;
              }
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              if (s.gzindex === s.gzhead.extra.length) {
                s.gzindex = 0;
                s.status = NAME_STATE;
              }
            } else {
              s.status = NAME_STATE;
            }
          }
          if (s.status === NAME_STATE) {
            if (s.gzhead.name) {
              beg = s.pending;
              do {
                if (s.pending === s.pending_buf_size) {
                  if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                  }
                  flush_pending(strm);
                  beg = s.pending;
                  if (s.pending === s.pending_buf_size) {
                    val = 1;
                    break;
                  }
                }
                if (s.gzindex < s.gzhead.name.length) {
                  val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
                } else {
                  val = 0;
                }
                put_byte(s, val);
              } while (val !== 0);
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              if (val === 0) {
                s.gzindex = 0;
                s.status = COMMENT_STATE;
              }
            } else {
              s.status = COMMENT_STATE;
            }
          }
          if (s.status === COMMENT_STATE) {
            if (s.gzhead.comment) {
              beg = s.pending;
              do {
                if (s.pending === s.pending_buf_size) {
                  if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                  }
                  flush_pending(strm);
                  beg = s.pending;
                  if (s.pending === s.pending_buf_size) {
                    val = 1;
                    break;
                  }
                }
                if (s.gzindex < s.gzhead.comment.length) {
                  val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
                } else {
                  val = 0;
                }
                put_byte(s, val);
              } while (val !== 0);
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              if (val === 0) {
                s.status = HCRC_STATE;
              }
            } else {
              s.status = HCRC_STATE;
            }
          }
          if (s.status === HCRC_STATE) {
            if (s.gzhead.hcrc) {
              if (s.pending + 2 > s.pending_buf_size) {
                flush_pending(strm);
              }
              if (s.pending + 2 <= s.pending_buf_size) {
                put_byte(s, strm.adler & 255);
                put_byte(s, strm.adler >> 8 & 255);
                strm.adler = 0;
                s.status = BUSY_STATE;
              }
            } else {
              s.status = BUSY_STATE;
            }
          }
          if (s.pending !== 0) {
            flush_pending(strm);
            if (strm.avail_out === 0) {
              s.last_flush = -1;
              return Z_OK;
            }
          } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
            return err(strm, Z_BUF_ERROR);
          }
          if (s.status === FINISH_STATE && strm.avail_in !== 0) {
            return err(strm, Z_BUF_ERROR);
          }
          if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
            var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
            if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
              s.status = FINISH_STATE;
            }
            if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
              if (strm.avail_out === 0) {
                s.last_flush = -1;
              }
              return Z_OK;
            }
            if (bstate === BS_BLOCK_DONE) {
              if (flush === Z_PARTIAL_FLUSH) {
                trees._tr_align(s);
              } else if (flush !== Z_BLOCK) {
                trees._tr_stored_block(s, 0, 0, false);
                if (flush === Z_FULL_FLUSH) {
                  zero(s.head);
                  if (s.lookahead === 0) {
                    s.strstart = 0;
                    s.block_start = 0;
                    s.insert = 0;
                  }
                }
              }
              flush_pending(strm);
              if (strm.avail_out === 0) {
                s.last_flush = -1;
                return Z_OK;
              }
            }
          }
          if (flush !== Z_FINISH) {
            return Z_OK;
          }
          if (s.wrap <= 0) {
            return Z_STREAM_END;
          }
          if (s.wrap === 2) {
            put_byte(s, strm.adler & 255);
            put_byte(s, strm.adler >> 8 & 255);
            put_byte(s, strm.adler >> 16 & 255);
            put_byte(s, strm.adler >> 24 & 255);
            put_byte(s, strm.total_in & 255);
            put_byte(s, strm.total_in >> 8 & 255);
            put_byte(s, strm.total_in >> 16 & 255);
            put_byte(s, strm.total_in >> 24 & 255);
          } else {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 65535);
          }
          flush_pending(strm);
          if (s.wrap > 0) {
            s.wrap = -s.wrap;
          }
          return s.pending !== 0 ? Z_OK : Z_STREAM_END;
        }
        function deflateEnd(strm) {
          var status;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          status = strm.state.status;
          if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
            return err(strm, Z_STREAM_ERROR);
          }
          strm.state = null;
          return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
        }
        function deflateSetDictionary(strm, dictionary) {
          var dictLength = dictionary.length;
          var s;
          var str, n;
          var wrap;
          var avail;
          var next;
          var input;
          var tmpDict;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          s = strm.state;
          wrap = s.wrap;
          if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
            return Z_STREAM_ERROR;
          }
          if (wrap === 1) {
            strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
          }
          s.wrap = 0;
          if (dictLength >= s.w_size) {
            if (wrap === 0) {
              zero(s.head);
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
            tmpDict = new utils.Buf8(s.w_size);
            utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
            dictionary = tmpDict;
            dictLength = s.w_size;
          }
          avail = strm.avail_in;
          next = strm.next_in;
          input = strm.input;
          strm.avail_in = dictLength;
          strm.next_in = 0;
          strm.input = dictionary;
          fill_window(s);
          while (s.lookahead >= MIN_MATCH) {
            str = s.strstart;
            n = s.lookahead - (MIN_MATCH - 1);
            do {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
              s.prev[str & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = str;
              str++;
            } while (--n);
            s.strstart = str;
            s.lookahead = MIN_MATCH - 1;
            fill_window(s);
          }
          s.strstart += s.lookahead;
          s.block_start = s.strstart;
          s.insert = s.lookahead;
          s.lookahead = 0;
          s.match_length = s.prev_length = MIN_MATCH - 1;
          s.match_available = 0;
          strm.next_in = next;
          strm.input = input;
          strm.avail_in = avail;
          s.wrap = wrap;
          return Z_OK;
        }
        exports3.deflateInit = deflateInit;
        exports3.deflateInit2 = deflateInit2;
        exports3.deflateReset = deflateReset;
        exports3.deflateResetKeep = deflateResetKeep;
        exports3.deflateSetHeader = deflateSetHeader;
        exports3.deflate = deflate;
        exports3.deflateEnd = deflateEnd;
        exports3.deflateSetDictionary = deflateSetDictionary;
        exports3.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 5, "./adler32": 7, "./crc32": 8, "./messages": 10, "./trees": 11 }], 10: [function(require2, module4, exports3) {
        "use strict";
        module4.exports = {
          2: "need dictionary",
          1: "stream end",
          0: "",
          "-1": "file error",
          "-2": "stream error",
          "-3": "data error",
          "-4": "insufficient memory",
          "-5": "buffer error",
          "-6": "incompatible version"
        };
      }, {}], 11: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var Z_FIXED = 4;
        var Z_BINARY = 0;
        var Z_TEXT = 1;
        var Z_UNKNOWN = 2;
        function zero(buf) {
          var len = buf.length;
          while (--len >= 0) {
            buf[len] = 0;
          }
        }
        var STORED_BLOCK = 0;
        var STATIC_TREES = 1;
        var DYN_TREES = 2;
        var MIN_MATCH = 3;
        var MAX_MATCH = 258;
        var LENGTH_CODES = 29;
        var LITERALS = 256;
        var L_CODES = LITERALS + 1 + LENGTH_CODES;
        var D_CODES = 30;
        var BL_CODES = 19;
        var HEAP_SIZE = 2 * L_CODES + 1;
        var MAX_BITS = 15;
        var Buf_size = 16;
        var MAX_BL_BITS = 7;
        var END_BLOCK = 256;
        var REP_3_6 = 16;
        var REPZ_3_10 = 17;
        var REPZ_11_138 = 18;
        var extra_lbits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
        var extra_dbits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
        var extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];
        var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        var DIST_CODE_LEN = 512;
        var static_ltree = new Array((L_CODES + 2) * 2);
        zero(static_ltree);
        var static_dtree = new Array(D_CODES * 2);
        zero(static_dtree);
        var _dist_code = new Array(DIST_CODE_LEN);
        zero(_dist_code);
        var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
        zero(_length_code);
        var base_length = new Array(LENGTH_CODES);
        zero(base_length);
        var base_dist = new Array(D_CODES);
        zero(base_dist);
        function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
          this.static_tree = static_tree;
          this.extra_bits = extra_bits;
          this.extra_base = extra_base;
          this.elems = elems;
          this.max_length = max_length;
          this.has_stree = static_tree && static_tree.length;
        }
        var static_l_desc;
        var static_d_desc;
        var static_bl_desc;
        function TreeDesc(dyn_tree, stat_desc) {
          this.dyn_tree = dyn_tree;
          this.max_code = 0;
          this.stat_desc = stat_desc;
        }
        function d_code(dist) {
          return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
        }
        function put_short(s, w) {
          s.pending_buf[s.pending++] = w & 255;
          s.pending_buf[s.pending++] = w >>> 8 & 255;
        }
        function send_bits(s, value, length) {
          if (s.bi_valid > Buf_size - length) {
            s.bi_buf |= value << s.bi_valid & 65535;
            put_short(s, s.bi_buf);
            s.bi_buf = value >> Buf_size - s.bi_valid;
            s.bi_valid += length - Buf_size;
          } else {
            s.bi_buf |= value << s.bi_valid & 65535;
            s.bi_valid += length;
          }
        }
        function send_code(s, c, tree) {
          send_bits(s, tree[c * 2], tree[c * 2 + 1]);
        }
        function bi_reverse(code, len) {
          var res = 0;
          do {
            res |= code & 1;
            code >>>= 1;
            res <<= 1;
          } while (--len > 0);
          return res >>> 1;
        }
        function bi_flush(s) {
          if (s.bi_valid === 16) {
            put_short(s, s.bi_buf);
            s.bi_buf = 0;
            s.bi_valid = 0;
          } else if (s.bi_valid >= 8) {
            s.pending_buf[s.pending++] = s.bi_buf & 255;
            s.bi_buf >>= 8;
            s.bi_valid -= 8;
          }
        }
        function gen_bitlen(s, desc) {
          var tree = desc.dyn_tree;
          var max_code = desc.max_code;
          var stree = desc.stat_desc.static_tree;
          var has_stree = desc.stat_desc.has_stree;
          var extra = desc.stat_desc.extra_bits;
          var base = desc.stat_desc.extra_base;
          var max_length = desc.stat_desc.max_length;
          var h;
          var n, m;
          var bits;
          var xbits;
          var f;
          var overflow = 0;
          for (bits = 0; bits <= MAX_BITS; bits++) {
            s.bl_count[bits] = 0;
          }
          tree[s.heap[s.heap_max] * 2 + 1] = 0;
          for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
            n = s.heap[h];
            bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
            if (bits > max_length) {
              bits = max_length;
              overflow++;
            }
            tree[n * 2 + 1] = bits;
            if (n > max_code) {
              continue;
            }
            s.bl_count[bits]++;
            xbits = 0;
            if (n >= base) {
              xbits = extra[n - base];
            }
            f = tree[n * 2];
            s.opt_len += f * (bits + xbits);
            if (has_stree) {
              s.static_len += f * (stree[n * 2 + 1] + xbits);
            }
          }
          if (overflow === 0) {
            return;
          }
          do {
            bits = max_length - 1;
            while (s.bl_count[bits] === 0) {
              bits--;
            }
            s.bl_count[bits]--;
            s.bl_count[bits + 1] += 2;
            s.bl_count[max_length]--;
            overflow -= 2;
          } while (overflow > 0);
          for (bits = max_length; bits !== 0; bits--) {
            n = s.bl_count[bits];
            while (n !== 0) {
              m = s.heap[--h];
              if (m > max_code) {
                continue;
              }
              if (tree[m * 2 + 1] !== bits) {
                s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
                tree[m * 2 + 1] = bits;
              }
              n--;
            }
          }
        }
        function gen_codes(tree, max_code, bl_count) {
          var next_code = new Array(MAX_BITS + 1);
          var code = 0;
          var bits;
          var n;
          for (bits = 1; bits <= MAX_BITS; bits++) {
            next_code[bits] = code = code + bl_count[bits - 1] << 1;
          }
          for (n = 0; n <= max_code; n++) {
            var len = tree[n * 2 + 1];
            if (len === 0) {
              continue;
            }
            tree[n * 2] = bi_reverse(next_code[len]++, len);
          }
        }
        function tr_static_init() {
          var n;
          var bits;
          var length;
          var code;
          var dist;
          var bl_count = new Array(MAX_BITS + 1);
          length = 0;
          for (code = 0; code < LENGTH_CODES - 1; code++) {
            base_length[code] = length;
            for (n = 0; n < 1 << extra_lbits[code]; n++) {
              _length_code[length++] = code;
            }
          }
          _length_code[length - 1] = code;
          dist = 0;
          for (code = 0; code < 16; code++) {
            base_dist[code] = dist;
            for (n = 0; n < 1 << extra_dbits[code]; n++) {
              _dist_code[dist++] = code;
            }
          }
          dist >>= 7;
          for (; code < D_CODES; code++) {
            base_dist[code] = dist << 7;
            for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
              _dist_code[256 + dist++] = code;
            }
          }
          for (bits = 0; bits <= MAX_BITS; bits++) {
            bl_count[bits] = 0;
          }
          n = 0;
          while (n <= 143) {
            static_ltree[n * 2 + 1] = 8;
            n++;
            bl_count[8]++;
          }
          while (n <= 255) {
            static_ltree[n * 2 + 1] = 9;
            n++;
            bl_count[9]++;
          }
          while (n <= 279) {
            static_ltree[n * 2 + 1] = 7;
            n++;
            bl_count[7]++;
          }
          while (n <= 287) {
            static_ltree[n * 2 + 1] = 8;
            n++;
            bl_count[8]++;
          }
          gen_codes(static_ltree, L_CODES + 1, bl_count);
          for (n = 0; n < D_CODES; n++) {
            static_dtree[n * 2 + 1] = 5;
            static_dtree[n * 2] = bi_reverse(n, 5);
          }
          static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
          static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
          static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
        }
        function init_block(s) {
          var n;
          for (n = 0; n < L_CODES; n++) {
            s.dyn_ltree[n * 2] = 0;
          }
          for (n = 0; n < D_CODES; n++) {
            s.dyn_dtree[n * 2] = 0;
          }
          for (n = 0; n < BL_CODES; n++) {
            s.bl_tree[n * 2] = 0;
          }
          s.dyn_ltree[END_BLOCK * 2] = 1;
          s.opt_len = s.static_len = 0;
          s.last_lit = s.matches = 0;
        }
        function bi_windup(s) {
          if (s.bi_valid > 8) {
            put_short(s, s.bi_buf);
          } else if (s.bi_valid > 0) {
            s.pending_buf[s.pending++] = s.bi_buf;
          }
          s.bi_buf = 0;
          s.bi_valid = 0;
        }
        function copy_block(s, buf, len, header) {
          bi_windup(s);
          if (header) {
            put_short(s, len);
            put_short(s, ~len);
          }
          utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
          s.pending += len;
        }
        function smaller(tree, n, m, depth) {
          var _n2 = n * 2;
          var _m2 = m * 2;
          return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
        }
        function pqdownheap(s, tree, k) {
          var v = s.heap[k];
          var j = k << 1;
          while (j <= s.heap_len) {
            if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
              j++;
            }
            if (smaller(tree, v, s.heap[j], s.depth)) {
              break;
            }
            s.heap[k] = s.heap[j];
            k = j;
            j <<= 1;
          }
          s.heap[k] = v;
        }
        function compress_block(s, ltree, dtree) {
          var dist;
          var lc;
          var lx = 0;
          var code;
          var extra;
          if (s.last_lit !== 0) {
            do {
              dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
              lc = s.pending_buf[s.l_buf + lx];
              lx++;
              if (dist === 0) {
                send_code(s, lc, ltree);
              } else {
                code = _length_code[lc];
                send_code(s, code + LITERALS + 1, ltree);
                extra = extra_lbits[code];
                if (extra !== 0) {
                  lc -= base_length[code];
                  send_bits(s, lc, extra);
                }
                dist--;
                code = d_code(dist);
                send_code(s, code, dtree);
                extra = extra_dbits[code];
                if (extra !== 0) {
                  dist -= base_dist[code];
                  send_bits(s, dist, extra);
                }
              }
            } while (lx < s.last_lit);
          }
          send_code(s, END_BLOCK, ltree);
        }
        function build_tree(s, desc) {
          var tree = desc.dyn_tree;
          var stree = desc.stat_desc.static_tree;
          var has_stree = desc.stat_desc.has_stree;
          var elems = desc.stat_desc.elems;
          var n, m;
          var max_code = -1;
          var node;
          s.heap_len = 0;
          s.heap_max = HEAP_SIZE;
          for (n = 0; n < elems; n++) {
            if (tree[n * 2] !== 0) {
              s.heap[++s.heap_len] = max_code = n;
              s.depth[n] = 0;
            } else {
              tree[n * 2 + 1] = 0;
            }
          }
          while (s.heap_len < 2) {
            node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
            tree[node * 2] = 1;
            s.depth[node] = 0;
            s.opt_len--;
            if (has_stree) {
              s.static_len -= stree[node * 2 + 1];
            }
          }
          desc.max_code = max_code;
          for (n = s.heap_len >> 1; n >= 1; n--) {
            pqdownheap(s, tree, n);
          }
          node = elems;
          do {
            n = s.heap[1];
            s.heap[1] = s.heap[s.heap_len--];
            pqdownheap(s, tree, 1);
            m = s.heap[1];
            s.heap[--s.heap_max] = n;
            s.heap[--s.heap_max] = m;
            tree[node * 2] = tree[n * 2] + tree[m * 2];
            s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
            tree[n * 2 + 1] = tree[m * 2 + 1] = node;
            s.heap[1] = node++;
            pqdownheap(s, tree, 1);
          } while (s.heap_len >= 2);
          s.heap[--s.heap_max] = s.heap[1];
          gen_bitlen(s, desc);
          gen_codes(tree, max_code, s.bl_count);
        }
        function scan_tree(s, tree, max_code) {
          var n;
          var prevlen = -1;
          var curlen;
          var nextlen = tree[0 * 2 + 1];
          var count = 0;
          var max_count = 7;
          var min_count = 4;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          }
          tree[(max_code + 1) * 2 + 1] = 65535;
          for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[(n + 1) * 2 + 1];
            if (++count < max_count && curlen === nextlen) {
              continue;
            } else if (count < min_count) {
              s.bl_tree[curlen * 2] += count;
            } else if (curlen !== 0) {
              if (curlen !== prevlen) {
                s.bl_tree[curlen * 2]++;
              }
              s.bl_tree[REP_3_6 * 2]++;
            } else if (count <= 10) {
              s.bl_tree[REPZ_3_10 * 2]++;
            } else {
              s.bl_tree[REPZ_11_138 * 2]++;
            }
            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
              max_count = 138;
              min_count = 3;
            } else if (curlen === nextlen) {
              max_count = 6;
              min_count = 3;
            } else {
              max_count = 7;
              min_count = 4;
            }
          }
        }
        function send_tree(s, tree, max_code) {
          var n;
          var prevlen = -1;
          var curlen;
          var nextlen = tree[0 * 2 + 1];
          var count = 0;
          var max_count = 7;
          var min_count = 4;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          }
          for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[(n + 1) * 2 + 1];
            if (++count < max_count && curlen === nextlen) {
              continue;
            } else if (count < min_count) {
              do {
                send_code(s, curlen, s.bl_tree);
              } while (--count !== 0);
            } else if (curlen !== 0) {
              if (curlen !== prevlen) {
                send_code(s, curlen, s.bl_tree);
                count--;
              }
              send_code(s, REP_3_6, s.bl_tree);
              send_bits(s, count - 3, 2);
            } else if (count <= 10) {
              send_code(s, REPZ_3_10, s.bl_tree);
              send_bits(s, count - 3, 3);
            } else {
              send_code(s, REPZ_11_138, s.bl_tree);
              send_bits(s, count - 11, 7);
            }
            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
              max_count = 138;
              min_count = 3;
            } else if (curlen === nextlen) {
              max_count = 6;
              min_count = 3;
            } else {
              max_count = 7;
              min_count = 4;
            }
          }
        }
        function build_bl_tree(s) {
          var max_blindex;
          scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
          scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
          build_tree(s, s.bl_desc);
          for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
            if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
              break;
            }
          }
          s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
          return max_blindex;
        }
        function send_all_trees(s, lcodes, dcodes, blcodes) {
          var rank;
          send_bits(s, lcodes - 257, 5);
          send_bits(s, dcodes - 1, 5);
          send_bits(s, blcodes - 4, 4);
          for (rank = 0; rank < blcodes; rank++) {
            send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
          }
          send_tree(s, s.dyn_ltree, lcodes - 1);
          send_tree(s, s.dyn_dtree, dcodes - 1);
        }
        function detect_data_type(s) {
          var black_mask = 4093624447;
          var n;
          for (n = 0; n <= 31; n++, black_mask >>>= 1) {
            if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
              return Z_BINARY;
            }
          }
          if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
            return Z_TEXT;
          }
          for (n = 32; n < LITERALS; n++) {
            if (s.dyn_ltree[n * 2] !== 0) {
              return Z_TEXT;
            }
          }
          return Z_BINARY;
        }
        var static_init_done = false;
        function _tr_init(s) {
          if (!static_init_done) {
            tr_static_init();
            static_init_done = true;
          }
          s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
          s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
          s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
          s.bi_buf = 0;
          s.bi_valid = 0;
          init_block(s);
        }
        function _tr_stored_block(s, buf, stored_len, last) {
          send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
          copy_block(s, buf, stored_len, true);
        }
        function _tr_align(s) {
          send_bits(s, STATIC_TREES << 1, 3);
          send_code(s, END_BLOCK, static_ltree);
          bi_flush(s);
        }
        function _tr_flush_block(s, buf, stored_len, last) {
          var opt_lenb, static_lenb;
          var max_blindex = 0;
          if (s.level > 0) {
            if (s.strm.data_type === Z_UNKNOWN) {
              s.strm.data_type = detect_data_type(s);
            }
            build_tree(s, s.l_desc);
            build_tree(s, s.d_desc);
            max_blindex = build_bl_tree(s);
            opt_lenb = s.opt_len + 3 + 7 >>> 3;
            static_lenb = s.static_len + 3 + 7 >>> 3;
            if (static_lenb <= opt_lenb) {
              opt_lenb = static_lenb;
            }
          } else {
            opt_lenb = static_lenb = stored_len + 5;
          }
          if (stored_len + 4 <= opt_lenb && buf !== -1) {
            _tr_stored_block(s, buf, stored_len, last);
          } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
            send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
            compress_block(s, static_ltree, static_dtree);
          } else {
            send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
            send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
            compress_block(s, s.dyn_ltree, s.dyn_dtree);
          }
          init_block(s);
          if (last) {
            bi_windup(s);
          }
        }
        function _tr_tally(s, dist, lc) {
          s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
          s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
          s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
          s.last_lit++;
          if (dist === 0) {
            s.dyn_ltree[lc * 2]++;
          } else {
            s.matches++;
            dist--;
            s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
            s.dyn_dtree[d_code(dist) * 2]++;
          }
          return s.last_lit === s.lit_bufsize - 1;
        }
        exports3._tr_init = _tr_init;
        exports3._tr_stored_block = _tr_stored_block;
        exports3._tr_flush_block = _tr_flush_block;
        exports3._tr_tally = _tr_tally;
        exports3._tr_align = _tr_align;
      }, { "../utils/common": 5 }], 12: [function(require2, module4, exports3) {
        "use strict";
        function ZStream() {
          this.input = null;
          this.next_in = 0;
          this.avail_in = 0;
          this.total_in = 0;
          this.output = null;
          this.next_out = 0;
          this.avail_out = 0;
          this.total_out = 0;
          this.msg = "";
          this.state = null;
          this.data_type = 2;
          this.adler = 0;
        }
        module4.exports = ZStream;
      }, {}] }, {}, [3])(3);
    });
  }
});

// node_modules/plantuml-encoder/dist/plantuml-decoder.js
var require_plantuml_decoder = __commonJS({
  "node_modules/plantuml-encoder/dist/plantuml-decoder.js"(exports, module2) {
    (function(f) {
      if (typeof exports === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.plantumlEncoder = f();
      }
    })(function() {
      var define2, module3, exports2;
      return function() {
        function r(e, n, t) {
          function o(i2, f) {
            if (!n[i2]) {
              if (!e[i2]) {
                var c = typeof require == "function" && require;
                if (!f && c)
                  return c(i2, true);
                if (u)
                  return u(i2, true);
                var a = new Error("Cannot find module '" + i2 + "'");
                throw a.code = "MODULE_NOT_FOUND", a;
              }
              var p = n[i2] = { exports: {} };
              e[i2][0].call(p.exports, function(r2) {
                var n2 = e[i2][1][r2];
                return o(n2 || r2);
              }, p, p.exports, r, e, n, t);
            }
            return n[i2].exports;
          }
          for (var u = typeof require == "function" && require, i = 0; i < t.length; i++)
            o(t[i]);
          return o;
        }
        return r;
      }()({ 1: [function(require2, module4, exports3) {
        "use strict";
        var pako = require2("pako/lib/inflate.js");
        module4.exports = function(data) {
          return pako.inflateRaw(data, { to: "string" });
        };
      }, { "pako/lib/inflate.js": 4 }], 2: [function(require2, module4, exports3) {
        "use strict";
        function decode6bit(cc) {
          var c = cc.charCodeAt(0);
          if (cc === "_")
            return 63;
          if (cc === "-")
            return 62;
          if (c >= 97)
            return c - 61;
          if (c >= 65)
            return c - 55;
          if (c >= 48)
            return c - 48;
          return "?";
        }
        function extract3bytes(data) {
          var c1 = decode6bit(data[0]);
          var c2 = decode6bit(data[1]);
          var c3 = decode6bit(data[2]);
          var c4 = decode6bit(data[3]);
          var b1 = c1 << 2 | c2 >> 4 & 63;
          var b2 = c2 << 4 & 240 | c3 >> 2 & 15;
          var b3 = c3 << 6 & 192 | c4 & 63;
          return [b1, b2, b3];
        }
        module4.exports = function(data) {
          var r = "";
          var i = 0;
          for (i = 0; i < data.length; i += 4) {
            var t = extract3bytes(data.substring(i, i + 4));
            r = r + String.fromCharCode(t[0]);
            r = r + String.fromCharCode(t[1]);
            r = r + String.fromCharCode(t[2]);
          }
          return r;
        };
      }, {}], 3: [function(require2, module4, exports3) {
        "use strict";
        var inflate = require2("./inflate");
        var decode64 = require2("./decode64");
        module4.exports.decode = function(encoded) {
          var deflated = decode64(encoded);
          return inflate(deflated);
        };
      }, { "./decode64": 2, "./inflate": 1 }], 4: [function(require2, module4, exports3) {
        "use strict";
        var zlib_inflate = require2("./zlib/inflate");
        var utils = require2("./utils/common");
        var strings = require2("./utils/strings");
        var c = require2("./zlib/constants");
        var msg = require2("./zlib/messages");
        var ZStream = require2("./zlib/zstream");
        var GZheader = require2("./zlib/gzheader");
        var toString = Object.prototype.toString;
        function Inflate(options) {
          if (!(this instanceof Inflate))
            return new Inflate(options);
          this.options = utils.assign({
            chunkSize: 16384,
            windowBits: 0,
            to: ""
          }, options || {});
          var opt = this.options;
          if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
            opt.windowBits = -opt.windowBits;
            if (opt.windowBits === 0) {
              opt.windowBits = -15;
            }
          }
          if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
            opt.windowBits += 32;
          }
          if (opt.windowBits > 15 && opt.windowBits < 48) {
            if ((opt.windowBits & 15) === 0) {
              opt.windowBits |= 15;
            }
          }
          this.err = 0;
          this.msg = "";
          this.ended = false;
          this.chunks = [];
          this.strm = new ZStream();
          this.strm.avail_out = 0;
          var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
          if (status !== c.Z_OK) {
            throw new Error(msg[status]);
          }
          this.header = new GZheader();
          zlib_inflate.inflateGetHeader(this.strm, this.header);
          if (opt.dictionary) {
            if (typeof opt.dictionary === "string") {
              opt.dictionary = strings.string2buf(opt.dictionary);
            } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
              opt.dictionary = new Uint8Array(opt.dictionary);
            }
            if (opt.raw) {
              status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
              if (status !== c.Z_OK) {
                throw new Error(msg[status]);
              }
            }
          }
        }
        Inflate.prototype.push = function(data, mode) {
          var strm = this.strm;
          var chunkSize = this.options.chunkSize;
          var dictionary = this.options.dictionary;
          var status, _mode;
          var next_out_utf8, tail, utf8str;
          var allowBufError = false;
          if (this.ended) {
            return false;
          }
          _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
          if (typeof data === "string") {
            strm.input = strings.binstring2buf(data);
          } else if (toString.call(data) === "[object ArrayBuffer]") {
            strm.input = new Uint8Array(data);
          } else {
            strm.input = data;
          }
          strm.next_in = 0;
          strm.avail_in = strm.input.length;
          do {
            if (strm.avail_out === 0) {
              strm.output = new utils.Buf8(chunkSize);
              strm.next_out = 0;
              strm.avail_out = chunkSize;
            }
            status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
            if (status === c.Z_NEED_DICT && dictionary) {
              status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
            }
            if (status === c.Z_BUF_ERROR && allowBufError === true) {
              status = c.Z_OK;
              allowBufError = false;
            }
            if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
              this.onEnd(status);
              this.ended = true;
              return false;
            }
            if (strm.next_out) {
              if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
                if (this.options.to === "string") {
                  next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                  tail = strm.next_out - next_out_utf8;
                  utf8str = strings.buf2string(strm.output, next_out_utf8);
                  strm.next_out = tail;
                  strm.avail_out = chunkSize - tail;
                  if (tail) {
                    utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
                  }
                  this.onData(utf8str);
                } else {
                  this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                }
              }
            }
            if (strm.avail_in === 0 && strm.avail_out === 0) {
              allowBufError = true;
            }
          } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
          if (status === c.Z_STREAM_END) {
            _mode = c.Z_FINISH;
          }
          if (_mode === c.Z_FINISH) {
            status = zlib_inflate.inflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === c.Z_OK;
          }
          if (_mode === c.Z_SYNC_FLUSH) {
            this.onEnd(c.Z_OK);
            strm.avail_out = 0;
            return true;
          }
          return true;
        };
        Inflate.prototype.onData = function(chunk) {
          this.chunks.push(chunk);
        };
        Inflate.prototype.onEnd = function(status) {
          if (status === c.Z_OK) {
            if (this.options.to === "string") {
              this.result = this.chunks.join("");
            } else {
              this.result = utils.flattenChunks(this.chunks);
            }
          }
          this.chunks = [];
          this.err = status;
          this.msg = this.strm.msg;
        };
        function inflate(input, options) {
          var inflator = new Inflate(options);
          inflator.push(input, true);
          if (inflator.err) {
            throw inflator.msg || msg[inflator.err];
          }
          return inflator.result;
        }
        function inflateRaw(input, options) {
          options = options || {};
          options.raw = true;
          return inflate(input, options);
        }
        exports3.Inflate = Inflate;
        exports3.inflate = inflate;
        exports3.inflateRaw = inflateRaw;
        exports3.ungzip = inflate;
      }, { "./utils/common": 5, "./utils/strings": 6, "./zlib/constants": 8, "./zlib/gzheader": 10, "./zlib/inflate": 12, "./zlib/messages": 14, "./zlib/zstream": 15 }], 5: [function(require2, module4, exports3) {
        "use strict";
        var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
        function _has(obj, key) {
          return Object.prototype.hasOwnProperty.call(obj, key);
        }
        exports3.assign = function(obj) {
          var sources = Array.prototype.slice.call(arguments, 1);
          while (sources.length) {
            var source = sources.shift();
            if (!source) {
              continue;
            }
            if (typeof source !== "object") {
              throw new TypeError(source + "must be non-object");
            }
            for (var p in source) {
              if (_has(source, p)) {
                obj[p] = source[p];
              }
            }
          }
          return obj;
        };
        exports3.shrinkBuf = function(buf, size) {
          if (buf.length === size) {
            return buf;
          }
          if (buf.subarray) {
            return buf.subarray(0, size);
          }
          buf.length = size;
          return buf;
        };
        var fnTyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            if (src.subarray && dest.subarray) {
              dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
              return;
            }
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          flattenChunks: function(chunks) {
            var i, l, len, pos, chunk, result;
            len = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              len += chunks[i].length;
            }
            result = new Uint8Array(len);
            pos = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
              chunk = chunks[i];
              result.set(chunk, pos);
              pos += chunk.length;
            }
            return result;
          }
        };
        var fnUntyped = {
          arraySet: function(dest, src, src_offs, len, dest_offs) {
            for (var i = 0; i < len; i++) {
              dest[dest_offs + i] = src[src_offs + i];
            }
          },
          flattenChunks: function(chunks) {
            return [].concat.apply([], chunks);
          }
        };
        exports3.setTyped = function(on) {
          if (on) {
            exports3.Buf8 = Uint8Array;
            exports3.Buf16 = Uint16Array;
            exports3.Buf32 = Int32Array;
            exports3.assign(exports3, fnTyped);
          } else {
            exports3.Buf8 = Array;
            exports3.Buf16 = Array;
            exports3.Buf32 = Array;
            exports3.assign(exports3, fnUntyped);
          }
        };
        exports3.setTyped(TYPED_OK);
      }, {}], 6: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("./common");
        var STR_APPLY_OK = true;
        var STR_APPLY_UIA_OK = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (__) {
          STR_APPLY_OK = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (__) {
          STR_APPLY_UIA_OK = false;
        }
        var _utf8len = new utils.Buf8(256);
        for (var q = 0; q < 256; q++) {
          _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
        }
        _utf8len[254] = _utf8len[254] = 1;
        exports3.string2buf = function(str) {
          var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
          for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
          }
          buf = new utils.Buf8(buf_len);
          for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
              c2 = str.charCodeAt(m_pos + 1);
              if ((c2 & 64512) === 56320) {
                c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                m_pos++;
              }
            }
            if (c < 128) {
              buf[i++] = c;
            } else if (c < 2048) {
              buf[i++] = 192 | c >>> 6;
              buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
              buf[i++] = 224 | c >>> 12;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            } else {
              buf[i++] = 240 | c >>> 18;
              buf[i++] = 128 | c >>> 12 & 63;
              buf[i++] = 128 | c >>> 6 & 63;
              buf[i++] = 128 | c & 63;
            }
          }
          return buf;
        };
        function buf2binstring(buf, len) {
          if (len < 65534) {
            if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
              return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
            }
          }
          var result = "";
          for (var i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
          }
          return result;
        }
        exports3.buf2binstring = function(buf) {
          return buf2binstring(buf, buf.length);
        };
        exports3.binstring2buf = function(str) {
          var buf = new utils.Buf8(str.length);
          for (var i = 0, len = buf.length; i < len; i++) {
            buf[i] = str.charCodeAt(i);
          }
          return buf;
        };
        exports3.buf2string = function(buf, max) {
          var i, out, c, c_len;
          var len = max || buf.length;
          var utf16buf = new Array(len * 2);
          for (out = 0, i = 0; i < len; ) {
            c = buf[i++];
            if (c < 128) {
              utf16buf[out++] = c;
              continue;
            }
            c_len = _utf8len[c];
            if (c_len > 4) {
              utf16buf[out++] = 65533;
              i += c_len - 1;
              continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
              c = c << 6 | buf[i++] & 63;
              c_len--;
            }
            if (c_len > 1) {
              utf16buf[out++] = 65533;
              continue;
            }
            if (c < 65536) {
              utf16buf[out++] = c;
            } else {
              c -= 65536;
              utf16buf[out++] = 55296 | c >> 10 & 1023;
              utf16buf[out++] = 56320 | c & 1023;
            }
          }
          return buf2binstring(utf16buf, out);
        };
        exports3.utf8border = function(buf, max) {
          var pos;
          max = max || buf.length;
          if (max > buf.length) {
            max = buf.length;
          }
          pos = max - 1;
          while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
          }
          if (pos < 0) {
            return max;
          }
          if (pos === 0) {
            return max;
          }
          return pos + _utf8len[buf[pos]] > max ? pos : max;
        };
      }, { "./common": 5 }], 7: [function(require2, module4, exports3) {
        "use strict";
        function adler32(adler, buf, len, pos) {
          var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
          while (len !== 0) {
            n = len > 2e3 ? 2e3 : len;
            len -= n;
            do {
              s1 = s1 + buf[pos++] | 0;
              s2 = s2 + s1 | 0;
            } while (--n);
            s1 %= 65521;
            s2 %= 65521;
          }
          return s1 | s2 << 16 | 0;
        }
        module4.exports = adler32;
      }, {}], 8: [function(require2, module4, exports3) {
        "use strict";
        module4.exports = {
          Z_NO_FLUSH: 0,
          Z_PARTIAL_FLUSH: 1,
          Z_SYNC_FLUSH: 2,
          Z_FULL_FLUSH: 3,
          Z_FINISH: 4,
          Z_BLOCK: 5,
          Z_TREES: 6,
          Z_OK: 0,
          Z_STREAM_END: 1,
          Z_NEED_DICT: 2,
          Z_ERRNO: -1,
          Z_STREAM_ERROR: -2,
          Z_DATA_ERROR: -3,
          Z_BUF_ERROR: -5,
          Z_NO_COMPRESSION: 0,
          Z_BEST_SPEED: 1,
          Z_BEST_COMPRESSION: 9,
          Z_DEFAULT_COMPRESSION: -1,
          Z_FILTERED: 1,
          Z_HUFFMAN_ONLY: 2,
          Z_RLE: 3,
          Z_FIXED: 4,
          Z_DEFAULT_STRATEGY: 0,
          Z_BINARY: 0,
          Z_TEXT: 1,
          Z_UNKNOWN: 2,
          Z_DEFLATED: 8
        };
      }, {}], 9: [function(require2, module4, exports3) {
        "use strict";
        function makeTable() {
          var c, table = [];
          for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
              c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
          }
          return table;
        }
        var crcTable = makeTable();
        function crc32(crc, buf, len, pos) {
          var t = crcTable, end = pos + len;
          crc ^= -1;
          for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
          }
          return crc ^ -1;
        }
        module4.exports = crc32;
      }, {}], 10: [function(require2, module4, exports3) {
        "use strict";
        function GZheader() {
          this.text = 0;
          this.time = 0;
          this.xflags = 0;
          this.os = 0;
          this.extra = null;
          this.extra_len = 0;
          this.name = "";
          this.comment = "";
          this.hcrc = 0;
          this.done = false;
        }
        module4.exports = GZheader;
      }, {}], 11: [function(require2, module4, exports3) {
        "use strict";
        var BAD = 30;
        var TYPE = 12;
        module4.exports = function inflate_fast(strm, start) {
          var state;
          var _in;
          var last;
          var _out;
          var beg;
          var end;
          var dmax;
          var wsize;
          var whave;
          var wnext;
          var s_window;
          var hold;
          var bits;
          var lcode;
          var dcode;
          var lmask;
          var dmask;
          var here;
          var op;
          var len;
          var dist;
          var from;
          var from_source;
          var input, output;
          state = strm.state;
          _in = strm.next_in;
          input = strm.input;
          last = _in + (strm.avail_in - 5);
          _out = strm.next_out;
          output = strm.output;
          beg = _out - (start - strm.avail_out);
          end = _out + (strm.avail_out - 257);
          dmax = state.dmax;
          wsize = state.wsize;
          whave = state.whave;
          wnext = state.wnext;
          s_window = state.window;
          hold = state.hold;
          bits = state.bits;
          lcode = state.lencode;
          dcode = state.distcode;
          lmask = (1 << state.lenbits) - 1;
          dmask = (1 << state.distbits) - 1;
          top:
            do {
              if (bits < 15) {
                hold += input[_in++] << bits;
                bits += 8;
                hold += input[_in++] << bits;
                bits += 8;
              }
              here = lcode[hold & lmask];
              dolen:
                for (; ; ) {
                  op = here >>> 24;
                  hold >>>= op;
                  bits -= op;
                  op = here >>> 16 & 255;
                  if (op === 0) {
                    output[_out++] = here & 65535;
                  } else if (op & 16) {
                    len = here & 65535;
                    op &= 15;
                    if (op) {
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                      }
                      len += hold & (1 << op) - 1;
                      hold >>>= op;
                      bits -= op;
                    }
                    if (bits < 15) {
                      hold += input[_in++] << bits;
                      bits += 8;
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                    here = dcode[hold & dmask];
                    dodist:
                      for (; ; ) {
                        op = here >>> 24;
                        hold >>>= op;
                        bits -= op;
                        op = here >>> 16 & 255;
                        if (op & 16) {
                          dist = here & 65535;
                          op &= 15;
                          if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                            if (bits < op) {
                              hold += input[_in++] << bits;
                              bits += 8;
                            }
                          }
                          dist += hold & (1 << op) - 1;
                          if (dist > dmax) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                          }
                          hold >>>= op;
                          bits -= op;
                          op = _out - beg;
                          if (dist > op) {
                            op = dist - op;
                            if (op > whave) {
                              if (state.sane) {
                                strm.msg = "invalid distance too far back";
                                state.mode = BAD;
                                break top;
                              }
                            }
                            from = 0;
                            from_source = s_window;
                            if (wnext === 0) {
                              from += wsize - op;
                              if (op < len) {
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            } else if (wnext < op) {
                              from += wsize + wnext - op;
                              op -= wnext;
                              if (op < len) {
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = 0;
                                if (wnext < len) {
                                  op = wnext;
                                  len -= op;
                                  do {
                                    output[_out++] = s_window[from++];
                                  } while (--op);
                                  from = _out - dist;
                                  from_source = output;
                                }
                              }
                            } else {
                              from += wnext - op;
                              if (op < len) {
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            }
                            while (len > 2) {
                              output[_out++] = from_source[from++];
                              output[_out++] = from_source[from++];
                              output[_out++] = from_source[from++];
                              len -= 3;
                            }
                            if (len) {
                              output[_out++] = from_source[from++];
                              if (len > 1) {
                                output[_out++] = from_source[from++];
                              }
                            }
                          } else {
                            from = _out - dist;
                            do {
                              output[_out++] = output[from++];
                              output[_out++] = output[from++];
                              output[_out++] = output[from++];
                              len -= 3;
                            } while (len > 2);
                            if (len) {
                              output[_out++] = output[from++];
                              if (len > 1) {
                                output[_out++] = output[from++];
                              }
                            }
                          }
                        } else if ((op & 64) === 0) {
                          here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                          continue dodist;
                        } else {
                          strm.msg = "invalid distance code";
                          state.mode = BAD;
                          break top;
                        }
                        break;
                      }
                  } else if ((op & 64) === 0) {
                    here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                    continue dolen;
                  } else if (op & 32) {
                    state.mode = TYPE;
                    break top;
                  } else {
                    strm.msg = "invalid literal/length code";
                    state.mode = BAD;
                    break top;
                  }
                  break;
                }
            } while (_in < last && _out < end);
          len = bits >> 3;
          _in -= len;
          bits -= len << 3;
          hold &= (1 << bits) - 1;
          strm.next_in = _in;
          strm.next_out = _out;
          strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
          strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
          state.hold = hold;
          state.bits = bits;
          return;
        };
      }, {}], 12: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var adler32 = require2("./adler32");
        var crc32 = require2("./crc32");
        var inflate_fast = require2("./inffast");
        var inflate_table = require2("./inftrees");
        var CODES = 0;
        var LENS = 1;
        var DISTS = 2;
        var Z_FINISH = 4;
        var Z_BLOCK = 5;
        var Z_TREES = 6;
        var Z_OK = 0;
        var Z_STREAM_END = 1;
        var Z_NEED_DICT = 2;
        var Z_STREAM_ERROR = -2;
        var Z_DATA_ERROR = -3;
        var Z_MEM_ERROR = -4;
        var Z_BUF_ERROR = -5;
        var Z_DEFLATED = 8;
        var HEAD = 1;
        var FLAGS = 2;
        var TIME = 3;
        var OS = 4;
        var EXLEN = 5;
        var EXTRA = 6;
        var NAME = 7;
        var COMMENT = 8;
        var HCRC = 9;
        var DICTID = 10;
        var DICT = 11;
        var TYPE = 12;
        var TYPEDO = 13;
        var STORED = 14;
        var COPY_ = 15;
        var COPY = 16;
        var TABLE = 17;
        var LENLENS = 18;
        var CODELENS = 19;
        var LEN_ = 20;
        var LEN = 21;
        var LENEXT = 22;
        var DIST = 23;
        var DISTEXT = 24;
        var MATCH = 25;
        var LIT = 26;
        var CHECK = 27;
        var LENGTH = 28;
        var DONE = 29;
        var BAD = 30;
        var MEM = 31;
        var SYNC = 32;
        var ENOUGH_LENS = 852;
        var ENOUGH_DISTS = 592;
        var MAX_WBITS = 15;
        var DEF_WBITS = MAX_WBITS;
        function zswap32(q) {
          return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
        }
        function InflateState() {
          this.mode = 0;
          this.last = false;
          this.wrap = 0;
          this.havedict = false;
          this.flags = 0;
          this.dmax = 0;
          this.check = 0;
          this.total = 0;
          this.head = null;
          this.wbits = 0;
          this.wsize = 0;
          this.whave = 0;
          this.wnext = 0;
          this.window = null;
          this.hold = 0;
          this.bits = 0;
          this.length = 0;
          this.offset = 0;
          this.extra = 0;
          this.lencode = null;
          this.distcode = null;
          this.lenbits = 0;
          this.distbits = 0;
          this.ncode = 0;
          this.nlen = 0;
          this.ndist = 0;
          this.have = 0;
          this.next = null;
          this.lens = new utils.Buf16(320);
          this.work = new utils.Buf16(288);
          this.lendyn = null;
          this.distdyn = null;
          this.sane = 0;
          this.back = 0;
          this.was = 0;
        }
        function inflateResetKeep(strm) {
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          strm.total_in = strm.total_out = state.total = 0;
          strm.msg = "";
          if (state.wrap) {
            strm.adler = state.wrap & 1;
          }
          state.mode = HEAD;
          state.last = 0;
          state.havedict = 0;
          state.dmax = 32768;
          state.head = null;
          state.hold = 0;
          state.bits = 0;
          state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
          state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
          state.sane = 1;
          state.back = -1;
          return Z_OK;
        }
        function inflateReset(strm) {
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          state.wsize = 0;
          state.whave = 0;
          state.wnext = 0;
          return inflateResetKeep(strm);
        }
        function inflateReset2(strm, windowBits) {
          var wrap;
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
          } else {
            wrap = (windowBits >> 4) + 1;
            if (windowBits < 48) {
              windowBits &= 15;
            }
          }
          if (windowBits && (windowBits < 8 || windowBits > 15)) {
            return Z_STREAM_ERROR;
          }
          if (state.window !== null && state.wbits !== windowBits) {
            state.window = null;
          }
          state.wrap = wrap;
          state.wbits = windowBits;
          return inflateReset(strm);
        }
        function inflateInit2(strm, windowBits) {
          var ret;
          var state;
          if (!strm) {
            return Z_STREAM_ERROR;
          }
          state = new InflateState();
          strm.state = state;
          state.window = null;
          ret = inflateReset2(strm, windowBits);
          if (ret !== Z_OK) {
            strm.state = null;
          }
          return ret;
        }
        function inflateInit(strm) {
          return inflateInit2(strm, DEF_WBITS);
        }
        var virgin = true;
        var lenfix, distfix;
        function fixedtables(state) {
          if (virgin) {
            var sym;
            lenfix = new utils.Buf32(512);
            distfix = new utils.Buf32(32);
            sym = 0;
            while (sym < 144) {
              state.lens[sym++] = 8;
            }
            while (sym < 256) {
              state.lens[sym++] = 9;
            }
            while (sym < 280) {
              state.lens[sym++] = 7;
            }
            while (sym < 288) {
              state.lens[sym++] = 8;
            }
            inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
            sym = 0;
            while (sym < 32) {
              state.lens[sym++] = 5;
            }
            inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
            virgin = false;
          }
          state.lencode = lenfix;
          state.lenbits = 9;
          state.distcode = distfix;
          state.distbits = 5;
        }
        function updatewindow(strm, src, end, copy) {
          var dist;
          var state = strm.state;
          if (state.window === null) {
            state.wsize = 1 << state.wbits;
            state.wnext = 0;
            state.whave = 0;
            state.window = new utils.Buf8(state.wsize);
          }
          if (copy >= state.wsize) {
            utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
            state.wnext = 0;
            state.whave = state.wsize;
          } else {
            dist = state.wsize - state.wnext;
            if (dist > copy) {
              dist = copy;
            }
            utils.arraySet(state.window, src, end - copy, dist, state.wnext);
            copy -= dist;
            if (copy) {
              utils.arraySet(state.window, src, end - copy, copy, 0);
              state.wnext = copy;
              state.whave = state.wsize;
            } else {
              state.wnext += dist;
              if (state.wnext === state.wsize) {
                state.wnext = 0;
              }
              if (state.whave < state.wsize) {
                state.whave += dist;
              }
            }
          }
          return 0;
        }
        function inflate(strm, flush) {
          var state;
          var input, output;
          var next;
          var put;
          var have, left;
          var hold;
          var bits;
          var _in, _out;
          var copy;
          var from;
          var from_source;
          var here = 0;
          var here_bits, here_op, here_val;
          var last_bits, last_op, last_val;
          var len;
          var ret;
          var hbuf = new utils.Buf8(4);
          var opts;
          var n;
          var order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if (state.mode === TYPE) {
            state.mode = TYPEDO;
          }
          put = strm.next_out;
          output = strm.output;
          left = strm.avail_out;
          next = strm.next_in;
          input = strm.input;
          have = strm.avail_in;
          hold = state.hold;
          bits = state.bits;
          _in = have;
          _out = left;
          ret = Z_OK;
          inf_leave:
            for (; ; ) {
              switch (state.mode) {
                case HEAD:
                  if (state.wrap === 0) {
                    state.mode = TYPEDO;
                    break;
                  }
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.wrap & 2 && hold === 35615) {
                    state.check = 0;
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                    hold = 0;
                    bits = 0;
                    state.mode = FLAGS;
                    break;
                  }
                  state.flags = 0;
                  if (state.head) {
                    state.head.done = false;
                  }
                  if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
                    strm.msg = "incorrect header check";
                    state.mode = BAD;
                    break;
                  }
                  if ((hold & 15) !== Z_DEFLATED) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD;
                    break;
                  }
                  hold >>>= 4;
                  bits -= 4;
                  len = (hold & 15) + 8;
                  if (state.wbits === 0) {
                    state.wbits = len;
                  } else if (len > state.wbits) {
                    strm.msg = "invalid window size";
                    state.mode = BAD;
                    break;
                  }
                  state.dmax = 1 << len;
                  strm.adler = state.check = 1;
                  state.mode = hold & 512 ? DICTID : TYPE;
                  hold = 0;
                  bits = 0;
                  break;
                case FLAGS:
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.flags = hold;
                  if ((state.flags & 255) !== Z_DEFLATED) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD;
                    break;
                  }
                  if (state.flags & 57344) {
                    strm.msg = "unknown header flags set";
                    state.mode = BAD;
                    break;
                  }
                  if (state.head) {
                    state.head.text = hold >> 8 & 1;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                  state.mode = TIME;
                case TIME:
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.head) {
                    state.head.time = hold;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    hbuf[2] = hold >>> 16 & 255;
                    hbuf[3] = hold >>> 24 & 255;
                    state.check = crc32(state.check, hbuf, 4, 0);
                  }
                  hold = 0;
                  bits = 0;
                  state.mode = OS;
                case OS:
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (state.head) {
                    state.head.xflags = hold & 255;
                    state.head.os = hold >> 8;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                  state.mode = EXLEN;
                case EXLEN:
                  if (state.flags & 1024) {
                    while (bits < 16) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.length = hold;
                    if (state.head) {
                      state.head.extra_len = hold;
                    }
                    if (state.flags & 512) {
                      hbuf[0] = hold & 255;
                      hbuf[1] = hold >>> 8 & 255;
                      state.check = crc32(state.check, hbuf, 2, 0);
                    }
                    hold = 0;
                    bits = 0;
                  } else if (state.head) {
                    state.head.extra = null;
                  }
                  state.mode = EXTRA;
                case EXTRA:
                  if (state.flags & 1024) {
                    copy = state.length;
                    if (copy > have) {
                      copy = have;
                    }
                    if (copy) {
                      if (state.head) {
                        len = state.head.extra_len - state.length;
                        if (!state.head.extra) {
                          state.head.extra = new Array(state.head.extra_len);
                        }
                        utils.arraySet(state.head.extra, input, next, copy, len);
                      }
                      if (state.flags & 512) {
                        state.check = crc32(state.check, input, copy, next);
                      }
                      have -= copy;
                      next += copy;
                      state.length -= copy;
                    }
                    if (state.length) {
                      break inf_leave;
                    }
                  }
                  state.length = 0;
                  state.mode = NAME;
                case NAME:
                  if (state.flags & 2048) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    copy = 0;
                    do {
                      len = input[next + copy++];
                      if (state.head && len && state.length < 65536) {
                        state.head.name += String.fromCharCode(len);
                      }
                    } while (len && copy < have);
                    if (state.flags & 512) {
                      state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) {
                      break inf_leave;
                    }
                  } else if (state.head) {
                    state.head.name = null;
                  }
                  state.length = 0;
                  state.mode = COMMENT;
                case COMMENT:
                  if (state.flags & 4096) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    copy = 0;
                    do {
                      len = input[next + copy++];
                      if (state.head && len && state.length < 65536) {
                        state.head.comment += String.fromCharCode(len);
                      }
                    } while (len && copy < have);
                    if (state.flags & 512) {
                      state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) {
                      break inf_leave;
                    }
                  } else if (state.head) {
                    state.head.comment = null;
                  }
                  state.mode = HCRC;
                case HCRC:
                  if (state.flags & 512) {
                    while (bits < 16) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    if (hold !== (state.check & 65535)) {
                      strm.msg = "header crc mismatch";
                      state.mode = BAD;
                      break;
                    }
                    hold = 0;
                    bits = 0;
                  }
                  if (state.head) {
                    state.head.hcrc = state.flags >> 9 & 1;
                    state.head.done = true;
                  }
                  strm.adler = state.check = 0;
                  state.mode = TYPE;
                  break;
                case DICTID:
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  strm.adler = state.check = zswap32(hold);
                  hold = 0;
                  bits = 0;
                  state.mode = DICT;
                case DICT:
                  if (state.havedict === 0) {
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    return Z_NEED_DICT;
                  }
                  strm.adler = state.check = 1;
                  state.mode = TYPE;
                case TYPE:
                  if (flush === Z_BLOCK || flush === Z_TREES) {
                    break inf_leave;
                  }
                case TYPEDO:
                  if (state.last) {
                    hold >>>= bits & 7;
                    bits -= bits & 7;
                    state.mode = CHECK;
                    break;
                  }
                  while (bits < 3) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.last = hold & 1;
                  hold >>>= 1;
                  bits -= 1;
                  switch (hold & 3) {
                    case 0:
                      state.mode = STORED;
                      break;
                    case 1:
                      fixedtables(state);
                      state.mode = LEN_;
                      if (flush === Z_TREES) {
                        hold >>>= 2;
                        bits -= 2;
                        break inf_leave;
                      }
                      break;
                    case 2:
                      state.mode = TABLE;
                      break;
                    case 3:
                      strm.msg = "invalid block type";
                      state.mode = BAD;
                  }
                  hold >>>= 2;
                  bits -= 2;
                  break;
                case STORED:
                  hold >>>= bits & 7;
                  bits -= bits & 7;
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                    strm.msg = "invalid stored block lengths";
                    state.mode = BAD;
                    break;
                  }
                  state.length = hold & 65535;
                  hold = 0;
                  bits = 0;
                  state.mode = COPY_;
                  if (flush === Z_TREES) {
                    break inf_leave;
                  }
                case COPY_:
                  state.mode = COPY;
                case COPY:
                  copy = state.length;
                  if (copy) {
                    if (copy > have) {
                      copy = have;
                    }
                    if (copy > left) {
                      copy = left;
                    }
                    if (copy === 0) {
                      break inf_leave;
                    }
                    utils.arraySet(output, input, next, copy, put);
                    have -= copy;
                    next += copy;
                    left -= copy;
                    put += copy;
                    state.length -= copy;
                    break;
                  }
                  state.mode = TYPE;
                  break;
                case TABLE:
                  while (bits < 14) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.nlen = (hold & 31) + 257;
                  hold >>>= 5;
                  bits -= 5;
                  state.ndist = (hold & 31) + 1;
                  hold >>>= 5;
                  bits -= 5;
                  state.ncode = (hold & 15) + 4;
                  hold >>>= 4;
                  bits -= 4;
                  if (state.nlen > 286 || state.ndist > 30) {
                    strm.msg = "too many length or distance symbols";
                    state.mode = BAD;
                    break;
                  }
                  state.have = 0;
                  state.mode = LENLENS;
                case LENLENS:
                  while (state.have < state.ncode) {
                    while (bits < 3) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.lens[order[state.have++]] = hold & 7;
                    hold >>>= 3;
                    bits -= 3;
                  }
                  while (state.have < 19) {
                    state.lens[order[state.have++]] = 0;
                  }
                  state.lencode = state.lendyn;
                  state.lenbits = 7;
                  opts = { bits: state.lenbits };
                  ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                  state.lenbits = opts.bits;
                  if (ret) {
                    strm.msg = "invalid code lengths set";
                    state.mode = BAD;
                    break;
                  }
                  state.have = 0;
                  state.mode = CODELENS;
                case CODELENS:
                  while (state.have < state.nlen + state.ndist) {
                    for (; ; ) {
                      here = state.lencode[hold & (1 << state.lenbits) - 1];
                      here_bits = here >>> 24;
                      here_op = here >>> 16 & 255;
                      here_val = here & 65535;
                      if (here_bits <= bits) {
                        break;
                      }
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    if (here_val < 16) {
                      hold >>>= here_bits;
                      bits -= here_bits;
                      state.lens[state.have++] = here_val;
                    } else {
                      if (here_val === 16) {
                        n = here_bits + 2;
                        while (bits < n) {
                          if (have === 0) {
                            break inf_leave;
                          }
                          have--;
                          hold += input[next++] << bits;
                          bits += 8;
                        }
                        hold >>>= here_bits;
                        bits -= here_bits;
                        if (state.have === 0) {
                          strm.msg = "invalid bit length repeat";
                          state.mode = BAD;
                          break;
                        }
                        len = state.lens[state.have - 1];
                        copy = 3 + (hold & 3);
                        hold >>>= 2;
                        bits -= 2;
                      } else if (here_val === 17) {
                        n = here_bits + 3;
                        while (bits < n) {
                          if (have === 0) {
                            break inf_leave;
                          }
                          have--;
                          hold += input[next++] << bits;
                          bits += 8;
                        }
                        hold >>>= here_bits;
                        bits -= here_bits;
                        len = 0;
                        copy = 3 + (hold & 7);
                        hold >>>= 3;
                        bits -= 3;
                      } else {
                        n = here_bits + 7;
                        while (bits < n) {
                          if (have === 0) {
                            break inf_leave;
                          }
                          have--;
                          hold += input[next++] << bits;
                          bits += 8;
                        }
                        hold >>>= here_bits;
                        bits -= here_bits;
                        len = 0;
                        copy = 11 + (hold & 127);
                        hold >>>= 7;
                        bits -= 7;
                      }
                      if (state.have + copy > state.nlen + state.ndist) {
                        strm.msg = "invalid bit length repeat";
                        state.mode = BAD;
                        break;
                      }
                      while (copy--) {
                        state.lens[state.have++] = len;
                      }
                    }
                  }
                  if (state.mode === BAD) {
                    break;
                  }
                  if (state.lens[256] === 0) {
                    strm.msg = "invalid code -- missing end-of-block";
                    state.mode = BAD;
                    break;
                  }
                  state.lenbits = 9;
                  opts = { bits: state.lenbits };
                  ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                  state.lenbits = opts.bits;
                  if (ret) {
                    strm.msg = "invalid literal/lengths set";
                    state.mode = BAD;
                    break;
                  }
                  state.distbits = 6;
                  state.distcode = state.distdyn;
                  opts = { bits: state.distbits };
                  ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                  state.distbits = opts.bits;
                  if (ret) {
                    strm.msg = "invalid distances set";
                    state.mode = BAD;
                    break;
                  }
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    break inf_leave;
                  }
                case LEN_:
                  state.mode = LEN;
                case LEN:
                  if (have >= 6 && left >= 258) {
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    inflate_fast(strm, _out);
                    put = strm.next_out;
                    output = strm.output;
                    left = strm.avail_out;
                    next = strm.next_in;
                    input = strm.input;
                    have = strm.avail_in;
                    hold = state.hold;
                    bits = state.bits;
                    if (state.mode === TYPE) {
                      state.back = -1;
                    }
                    break;
                  }
                  state.back = 0;
                  for (; ; ) {
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (here_op && (here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for (; ; ) {
                      here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                      here_bits = here >>> 24;
                      here_op = here >>> 16 & 255;
                      here_val = here & 65535;
                      if (last_bits + here_bits <= bits) {
                        break;
                      }
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= last_bits;
                    bits -= last_bits;
                    state.back += last_bits;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.back += here_bits;
                  state.length = here_val;
                  if (here_op === 0) {
                    state.mode = LIT;
                    break;
                  }
                  if (here_op & 32) {
                    state.back = -1;
                    state.mode = TYPE;
                    break;
                  }
                  if (here_op & 64) {
                    strm.msg = "invalid literal/length code";
                    state.mode = BAD;
                    break;
                  }
                  state.extra = here_op & 15;
                  state.mode = LENEXT;
                case LENEXT:
                  if (state.extra) {
                    n = state.extra;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.length += hold & (1 << state.extra) - 1;
                    hold >>>= state.extra;
                    bits -= state.extra;
                    state.back += state.extra;
                  }
                  state.was = state.length;
                  state.mode = DIST;
                case DIST:
                  for (; ; ) {
                    here = state.distcode[hold & (1 << state.distbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if ((here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for (; ; ) {
                      here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                      here_bits = here >>> 24;
                      here_op = here >>> 16 & 255;
                      here_val = here & 65535;
                      if (last_bits + here_bits <= bits) {
                        break;
                      }
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= last_bits;
                    bits -= last_bits;
                    state.back += last_bits;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.back += here_bits;
                  if (here_op & 64) {
                    strm.msg = "invalid distance code";
                    state.mode = BAD;
                    break;
                  }
                  state.offset = here_val;
                  state.extra = here_op & 15;
                  state.mode = DISTEXT;
                case DISTEXT:
                  if (state.extra) {
                    n = state.extra;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    state.offset += hold & (1 << state.extra) - 1;
                    hold >>>= state.extra;
                    bits -= state.extra;
                    state.back += state.extra;
                  }
                  if (state.offset > state.dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                  state.mode = MATCH;
                case MATCH:
                  if (left === 0) {
                    break inf_leave;
                  }
                  copy = _out - left;
                  if (state.offset > copy) {
                    copy = state.offset - copy;
                    if (copy > state.whave) {
                      if (state.sane) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD;
                        break;
                      }
                    }
                    if (copy > state.wnext) {
                      copy -= state.wnext;
                      from = state.wsize - copy;
                    } else {
                      from = state.wnext - copy;
                    }
                    if (copy > state.length) {
                      copy = state.length;
                    }
                    from_source = state.window;
                  } else {
                    from_source = output;
                    from = put - state.offset;
                    copy = state.length;
                  }
                  if (copy > left) {
                    copy = left;
                  }
                  left -= copy;
                  state.length -= copy;
                  do {
                    output[put++] = from_source[from++];
                  } while (--copy);
                  if (state.length === 0) {
                    state.mode = LEN;
                  }
                  break;
                case LIT:
                  if (left === 0) {
                    break inf_leave;
                  }
                  output[put++] = state.length;
                  left--;
                  state.mode = LEN;
                  break;
                case CHECK:
                  if (state.wrap) {
                    while (bits < 32) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold |= input[next++] << bits;
                      bits += 8;
                    }
                    _out -= left;
                    strm.total_out += _out;
                    state.total += _out;
                    if (_out) {
                      strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                    }
                    _out = left;
                    if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                      strm.msg = "incorrect data check";
                      state.mode = BAD;
                      break;
                    }
                    hold = 0;
                    bits = 0;
                  }
                  state.mode = LENGTH;
                case LENGTH:
                  if (state.wrap && state.flags) {
                    while (bits < 32) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    if (hold !== (state.total & 4294967295)) {
                      strm.msg = "incorrect length check";
                      state.mode = BAD;
                      break;
                    }
                    hold = 0;
                    bits = 0;
                  }
                  state.mode = DONE;
                case DONE:
                  ret = Z_STREAM_END;
                  break inf_leave;
                case BAD:
                  ret = Z_DATA_ERROR;
                  break inf_leave;
                case MEM:
                  return Z_MEM_ERROR;
                case SYNC:
                default:
                  return Z_STREAM_ERROR;
              }
            }
          strm.next_out = put;
          strm.avail_out = left;
          strm.next_in = next;
          strm.avail_in = have;
          state.hold = hold;
          state.bits = bits;
          if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
            if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
              state.mode = MEM;
              return Z_MEM_ERROR;
            }
          }
          _in -= strm.avail_in;
          _out -= strm.avail_out;
          strm.total_in += _in;
          strm.total_out += _out;
          state.total += _out;
          if (state.wrap && _out) {
            strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
          }
          strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
          if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
            ret = Z_BUF_ERROR;
          }
          return ret;
        }
        function inflateEnd(strm) {
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          var state = strm.state;
          if (state.window) {
            state.window = null;
          }
          strm.state = null;
          return Z_OK;
        }
        function inflateGetHeader(strm, head) {
          var state;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if ((state.wrap & 2) === 0) {
            return Z_STREAM_ERROR;
          }
          state.head = head;
          head.done = false;
          return Z_OK;
        }
        function inflateSetDictionary(strm, dictionary) {
          var dictLength = dictionary.length;
          var state;
          var dictid;
          var ret;
          if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
          }
          state = strm.state;
          if (state.wrap !== 0 && state.mode !== DICT) {
            return Z_STREAM_ERROR;
          }
          if (state.mode === DICT) {
            dictid = 1;
            dictid = adler32(dictid, dictionary, dictLength, 0);
            if (dictid !== state.check) {
              return Z_DATA_ERROR;
            }
          }
          ret = updatewindow(strm, dictionary, dictLength, dictLength);
          if (ret) {
            state.mode = MEM;
            return Z_MEM_ERROR;
          }
          state.havedict = 1;
          return Z_OK;
        }
        exports3.inflateReset = inflateReset;
        exports3.inflateReset2 = inflateReset2;
        exports3.inflateResetKeep = inflateResetKeep;
        exports3.inflateInit = inflateInit;
        exports3.inflateInit2 = inflateInit2;
        exports3.inflate = inflate;
        exports3.inflateEnd = inflateEnd;
        exports3.inflateGetHeader = inflateGetHeader;
        exports3.inflateSetDictionary = inflateSetDictionary;
        exports3.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 5, "./adler32": 7, "./crc32": 9, "./inffast": 11, "./inftrees": 13 }], 13: [function(require2, module4, exports3) {
        "use strict";
        var utils = require2("../utils/common");
        var MAXBITS = 15;
        var ENOUGH_LENS = 852;
        var ENOUGH_DISTS = 592;
        var CODES = 0;
        var LENS = 1;
        var DISTS = 2;
        var lbase = [
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          13,
          15,
          17,
          19,
          23,
          27,
          31,
          35,
          43,
          51,
          59,
          67,
          83,
          99,
          115,
          131,
          163,
          195,
          227,
          258,
          0,
          0
        ];
        var lext = [
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          17,
          17,
          17,
          17,
          18,
          18,
          18,
          18,
          19,
          19,
          19,
          19,
          20,
          20,
          20,
          20,
          21,
          21,
          21,
          21,
          16,
          72,
          78
        ];
        var dbase = [
          1,
          2,
          3,
          4,
          5,
          7,
          9,
          13,
          17,
          25,
          33,
          49,
          65,
          97,
          129,
          193,
          257,
          385,
          513,
          769,
          1025,
          1537,
          2049,
          3073,
          4097,
          6145,
          8193,
          12289,
          16385,
          24577,
          0,
          0
        ];
        var dext = [
          16,
          16,
          16,
          16,
          17,
          17,
          18,
          18,
          19,
          19,
          20,
          20,
          21,
          21,
          22,
          22,
          23,
          23,
          24,
          24,
          25,
          25,
          26,
          26,
          27,
          27,
          28,
          28,
          29,
          29,
          64,
          64
        ];
        module4.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
          var bits = opts.bits;
          var len = 0;
          var sym = 0;
          var min = 0, max = 0;
          var root = 0;
          var curr = 0;
          var drop = 0;
          var left = 0;
          var used = 0;
          var huff = 0;
          var incr;
          var fill;
          var low;
          var mask;
          var next;
          var base = null;
          var base_index = 0;
          var end;
          var count = new utils.Buf16(MAXBITS + 1);
          var offs = new utils.Buf16(MAXBITS + 1);
          var extra = null;
          var extra_index = 0;
          var here_bits, here_op, here_val;
          for (len = 0; len <= MAXBITS; len++) {
            count[len] = 0;
          }
          for (sym = 0; sym < codes; sym++) {
            count[lens[lens_index + sym]]++;
          }
          root = bits;
          for (max = MAXBITS; max >= 1; max--) {
            if (count[max] !== 0) {
              break;
            }
          }
          if (root > max) {
            root = max;
          }
          if (max === 0) {
            table[table_index++] = 1 << 24 | 64 << 16 | 0;
            table[table_index++] = 1 << 24 | 64 << 16 | 0;
            opts.bits = 1;
            return 0;
          }
          for (min = 1; min < max; min++) {
            if (count[min] !== 0) {
              break;
            }
          }
          if (root < min) {
            root = min;
          }
          left = 1;
          for (len = 1; len <= MAXBITS; len++) {
            left <<= 1;
            left -= count[len];
            if (left < 0) {
              return -1;
            }
          }
          if (left > 0 && (type === CODES || max !== 1)) {
            return -1;
          }
          offs[1] = 0;
          for (len = 1; len < MAXBITS; len++) {
            offs[len + 1] = offs[len] + count[len];
          }
          for (sym = 0; sym < codes; sym++) {
            if (lens[lens_index + sym] !== 0) {
              work[offs[lens[lens_index + sym]]++] = sym;
            }
          }
          if (type === CODES) {
            base = extra = work;
            end = 19;
          } else if (type === LENS) {
            base = lbase;
            base_index -= 257;
            extra = lext;
            extra_index -= 257;
            end = 256;
          } else {
            base = dbase;
            extra = dext;
            end = -1;
          }
          huff = 0;
          sym = 0;
          len = min;
          next = table_index;
          curr = root;
          drop = 0;
          low = -1;
          used = 1 << root;
          mask = used - 1;
          if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
            return 1;
          }
          for (; ; ) {
            here_bits = len - drop;
            if (work[sym] < end) {
              here_op = 0;
              here_val = work[sym];
            } else if (work[sym] > end) {
              here_op = extra[extra_index + work[sym]];
              here_val = base[base_index + work[sym]];
            } else {
              here_op = 32 + 64;
              here_val = 0;
            }
            incr = 1 << len - drop;
            fill = 1 << curr;
            min = fill;
            do {
              fill -= incr;
              table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
            } while (fill !== 0);
            incr = 1 << len - 1;
            while (huff & incr) {
              incr >>= 1;
            }
            if (incr !== 0) {
              huff &= incr - 1;
              huff += incr;
            } else {
              huff = 0;
            }
            sym++;
            if (--count[len] === 0) {
              if (len === max) {
                break;
              }
              len = lens[lens_index + work[sym]];
            }
            if (len > root && (huff & mask) !== low) {
              if (drop === 0) {
                drop = root;
              }
              next += min;
              curr = len - drop;
              left = 1 << curr;
              while (curr + drop < max) {
                left -= count[curr + drop];
                if (left <= 0) {
                  break;
                }
                curr++;
                left <<= 1;
              }
              used += 1 << curr;
              if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
                return 1;
              }
              low = huff & mask;
              table[low] = root << 24 | curr << 16 | next - table_index | 0;
            }
          }
          if (huff !== 0) {
            table[next + huff] = len - drop << 24 | 64 << 16 | 0;
          }
          opts.bits = root;
          return 0;
        };
      }, { "../utils/common": 5 }], 14: [function(require2, module4, exports3) {
        "use strict";
        module4.exports = {
          2: "need dictionary",
          1: "stream end",
          0: "",
          "-1": "file error",
          "-2": "stream error",
          "-3": "data error",
          "-4": "insufficient memory",
          "-5": "buffer error",
          "-6": "incompatible version"
        };
      }, {}], 15: [function(require2, module4, exports3) {
        "use strict";
        function ZStream() {
          this.input = null;
          this.next_in = 0;
          this.avail_in = 0;
          this.total_in = 0;
          this.output = null;
          this.next_out = 0;
          this.avail_out = 0;
          this.total_out = 0;
          this.msg = "";
          this.state = null;
          this.data_type = 2;
          this.adler = 0;
        }
        module4.exports = ZStream;
      }, {}] }, {}, [3])(3);
    });
  }
});

// node_modules/plantuml-encoder/browser-index.js
var require_browser_index = __commonJS({
  "node_modules/plantuml-encoder/browser-index.js"(exports, module2) {
    module2.exports = {
      encode: require_plantuml_encoder().encode,
      decode: require_plantuml_decoder().decode
    };
  }
});

// node_modules/localforage/dist/localforage.js
var require_localforage = __commonJS({
  "node_modules/localforage/dist/localforage.js"(exports, module2) {
    (function(f) {
      if (typeof exports === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.localforage = f();
      }
    })(function() {
      var define2, module3, exports2;
      return function e(t, n, r) {
        function s(o2, u) {
          if (!n[o2]) {
            if (!t[o2]) {
              var a = typeof require == "function" && require;
              if (!u && a)
                return a(o2, true);
              if (i)
                return i(o2, true);
              var f = new Error("Cannot find module '" + o2 + "'");
              throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o2] = { exports: {} };
            t[o2][0].call(l.exports, function(e2) {
              var n2 = t[o2][1][e2];
              return s(n2 ? n2 : e2);
            }, l, l.exports, e, t, n, r);
          }
          return n[o2].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++)
          s(r[o]);
        return s;
      }({ 1: [function(_dereq_, module4, exports3) {
        (function(global2) {
          "use strict";
          var Mutation = global2.MutationObserver || global2.WebKitMutationObserver;
          var scheduleDrain;
          {
            if (Mutation) {
              var called = 0;
              var observer = new Mutation(nextTick);
              var element = global2.document.createTextNode("");
              observer.observe(element, {
                characterData: true
              });
              scheduleDrain = function() {
                element.data = called = ++called % 2;
              };
            } else if (!global2.setImmediate && typeof global2.MessageChannel !== "undefined") {
              var channel = new global2.MessageChannel();
              channel.port1.onmessage = nextTick;
              scheduleDrain = function() {
                channel.port2.postMessage(0);
              };
            } else if ("document" in global2 && "onreadystatechange" in global2.document.createElement("script")) {
              scheduleDrain = function() {
                var scriptEl = global2.document.createElement("script");
                scriptEl.onreadystatechange = function() {
                  nextTick();
                  scriptEl.onreadystatechange = null;
                  scriptEl.parentNode.removeChild(scriptEl);
                  scriptEl = null;
                };
                global2.document.documentElement.appendChild(scriptEl);
              };
            } else {
              scheduleDrain = function() {
                setTimeout(nextTick, 0);
              };
            }
          }
          var draining;
          var queue = [];
          function nextTick() {
            draining = true;
            var i, oldQueue;
            var len = queue.length;
            while (len) {
              oldQueue = queue;
              queue = [];
              i = -1;
              while (++i < len) {
                oldQueue[i]();
              }
              len = queue.length;
            }
            draining = false;
          }
          module4.exports = immediate;
          function immediate(task) {
            if (queue.push(task) === 1 && !draining) {
              scheduleDrain();
            }
          }
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}], 2: [function(_dereq_, module4, exports3) {
        "use strict";
        var immediate = _dereq_(1);
        function INTERNAL() {
        }
        var handlers = {};
        var REJECTED = ["REJECTED"];
        var FULFILLED = ["FULFILLED"];
        var PENDING = ["PENDING"];
        module4.exports = Promise2;
        function Promise2(resolver) {
          if (typeof resolver !== "function") {
            throw new TypeError("resolver must be a function");
          }
          this.state = PENDING;
          this.queue = [];
          this.outcome = void 0;
          if (resolver !== INTERNAL) {
            safelyResolveThenable(this, resolver);
          }
        }
        Promise2.prototype["catch"] = function(onRejected) {
          return this.then(null, onRejected);
        };
        Promise2.prototype.then = function(onFulfilled, onRejected) {
          if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) {
            return this;
          }
          var promise = new this.constructor(INTERNAL);
          if (this.state !== PENDING) {
            var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
            unwrap(promise, resolver, this.outcome);
          } else {
            this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
          }
          return promise;
        };
        function QueueItem(promise, onFulfilled, onRejected) {
          this.promise = promise;
          if (typeof onFulfilled === "function") {
            this.onFulfilled = onFulfilled;
            this.callFulfilled = this.otherCallFulfilled;
          }
          if (typeof onRejected === "function") {
            this.onRejected = onRejected;
            this.callRejected = this.otherCallRejected;
          }
        }
        QueueItem.prototype.callFulfilled = function(value) {
          handlers.resolve(this.promise, value);
        };
        QueueItem.prototype.otherCallFulfilled = function(value) {
          unwrap(this.promise, this.onFulfilled, value);
        };
        QueueItem.prototype.callRejected = function(value) {
          handlers.reject(this.promise, value);
        };
        QueueItem.prototype.otherCallRejected = function(value) {
          unwrap(this.promise, this.onRejected, value);
        };
        function unwrap(promise, func, value) {
          immediate(function() {
            var returnValue;
            try {
              returnValue = func(value);
            } catch (e) {
              return handlers.reject(promise, e);
            }
            if (returnValue === promise) {
              handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
            } else {
              handlers.resolve(promise, returnValue);
            }
          });
        }
        handlers.resolve = function(self2, value) {
          var result = tryCatch(getThen, value);
          if (result.status === "error") {
            return handlers.reject(self2, result.value);
          }
          var thenable = result.value;
          if (thenable) {
            safelyResolveThenable(self2, thenable);
          } else {
            self2.state = FULFILLED;
            self2.outcome = value;
            var i = -1;
            var len = self2.queue.length;
            while (++i < len) {
              self2.queue[i].callFulfilled(value);
            }
          }
          return self2;
        };
        handlers.reject = function(self2, error) {
          self2.state = REJECTED;
          self2.outcome = error;
          var i = -1;
          var len = self2.queue.length;
          while (++i < len) {
            self2.queue[i].callRejected(error);
          }
          return self2;
        };
        function getThen(obj) {
          var then = obj && obj.then;
          if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
            return function appyThen() {
              then.apply(obj, arguments);
            };
          }
        }
        function safelyResolveThenable(self2, thenable) {
          var called = false;
          function onError(value) {
            if (called) {
              return;
            }
            called = true;
            handlers.reject(self2, value);
          }
          function onSuccess(value) {
            if (called) {
              return;
            }
            called = true;
            handlers.resolve(self2, value);
          }
          function tryToUnwrap() {
            thenable(onSuccess, onError);
          }
          var result = tryCatch(tryToUnwrap);
          if (result.status === "error") {
            onError(result.value);
          }
        }
        function tryCatch(func, value) {
          var out = {};
          try {
            out.value = func(value);
            out.status = "success";
          } catch (e) {
            out.status = "error";
            out.value = e;
          }
          return out;
        }
        Promise2.resolve = resolve;
        function resolve(value) {
          if (value instanceof this) {
            return value;
          }
          return handlers.resolve(new this(INTERNAL), value);
        }
        Promise2.reject = reject;
        function reject(reason) {
          var promise = new this(INTERNAL);
          return handlers.reject(promise, reason);
        }
        Promise2.all = all;
        function all(iterable) {
          var self2 = this;
          if (Object.prototype.toString.call(iterable) !== "[object Array]") {
            return this.reject(new TypeError("must be an array"));
          }
          var len = iterable.length;
          var called = false;
          if (!len) {
            return this.resolve([]);
          }
          var values = new Array(len);
          var resolved = 0;
          var i = -1;
          var promise = new this(INTERNAL);
          while (++i < len) {
            allResolver(iterable[i], i);
          }
          return promise;
          function allResolver(value, i2) {
            self2.resolve(value).then(resolveFromAll, function(error) {
              if (!called) {
                called = true;
                handlers.reject(promise, error);
              }
            });
            function resolveFromAll(outValue) {
              values[i2] = outValue;
              if (++resolved === len && !called) {
                called = true;
                handlers.resolve(promise, values);
              }
            }
          }
        }
        Promise2.race = race;
        function race(iterable) {
          var self2 = this;
          if (Object.prototype.toString.call(iterable) !== "[object Array]") {
            return this.reject(new TypeError("must be an array"));
          }
          var len = iterable.length;
          var called = false;
          if (!len) {
            return this.resolve([]);
          }
          var i = -1;
          var promise = new this(INTERNAL);
          while (++i < len) {
            resolver(iterable[i]);
          }
          return promise;
          function resolver(value) {
            self2.resolve(value).then(function(response) {
              if (!called) {
                called = true;
                handlers.resolve(promise, response);
              }
            }, function(error) {
              if (!called) {
                called = true;
                handlers.reject(promise, error);
              }
            });
          }
        }
      }, { "1": 1 }], 3: [function(_dereq_, module4, exports3) {
        (function(global2) {
          "use strict";
          if (typeof global2.Promise !== "function") {
            global2.Promise = _dereq_(2);
          }
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, { "2": 2 }], 4: [function(_dereq_, module4, exports3) {
        "use strict";
        var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
          return typeof obj;
        } : function(obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
        function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
          }
        }
        function getIDB() {
          try {
            if (typeof indexedDB !== "undefined") {
              return indexedDB;
            }
            if (typeof webkitIndexedDB !== "undefined") {
              return webkitIndexedDB;
            }
            if (typeof mozIndexedDB !== "undefined") {
              return mozIndexedDB;
            }
            if (typeof OIndexedDB !== "undefined") {
              return OIndexedDB;
            }
            if (typeof msIndexedDB !== "undefined") {
              return msIndexedDB;
            }
          } catch (e) {
            return;
          }
        }
        var idb = getIDB();
        function isIndexedDBValid() {
          try {
            if (!idb || !idb.open) {
              return false;
            }
            var isSafari = typeof openDatabase !== "undefined" && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform);
            var hasFetch = typeof fetch === "function" && fetch.toString().indexOf("[native code") !== -1;
            return (!isSafari || hasFetch) && typeof indexedDB !== "undefined" && typeof IDBKeyRange !== "undefined";
          } catch (e) {
            return false;
          }
        }
        function createBlob(parts, properties) {
          parts = parts || [];
          properties = properties || {};
          try {
            return new Blob(parts, properties);
          } catch (e) {
            if (e.name !== "TypeError") {
              throw e;
            }
            var Builder = typeof BlobBuilder !== "undefined" ? BlobBuilder : typeof MSBlobBuilder !== "undefined" ? MSBlobBuilder : typeof MozBlobBuilder !== "undefined" ? MozBlobBuilder : WebKitBlobBuilder;
            var builder = new Builder();
            for (var i = 0; i < parts.length; i += 1) {
              builder.append(parts[i]);
            }
            return builder.getBlob(properties.type);
          }
        }
        if (typeof Promise === "undefined") {
          _dereq_(3);
        }
        var Promise$1 = Promise;
        function executeCallback(promise, callback) {
          if (callback) {
            promise.then(function(result) {
              callback(null, result);
            }, function(error) {
              callback(error);
            });
          }
        }
        function executeTwoCallbacks(promise, callback, errorCallback) {
          if (typeof callback === "function") {
            promise.then(callback);
          }
          if (typeof errorCallback === "function") {
            promise["catch"](errorCallback);
          }
        }
        function normalizeKey(key2) {
          if (typeof key2 !== "string") {
            console.warn(key2 + " used as a key, but it is not a string.");
            key2 = String(key2);
          }
          return key2;
        }
        function getCallback() {
          if (arguments.length && typeof arguments[arguments.length - 1] === "function") {
            return arguments[arguments.length - 1];
          }
        }
        var DETECT_BLOB_SUPPORT_STORE = "local-forage-detect-blob-support";
        var supportsBlobs = void 0;
        var dbContexts = {};
        var toString = Object.prototype.toString;
        var READ_ONLY = "readonly";
        var READ_WRITE = "readwrite";
        function _binStringToArrayBuffer(bin) {
          var length2 = bin.length;
          var buf = new ArrayBuffer(length2);
          var arr = new Uint8Array(buf);
          for (var i = 0; i < length2; i++) {
            arr[i] = bin.charCodeAt(i);
          }
          return buf;
        }
        function _checkBlobSupportWithoutCaching(idb2) {
          return new Promise$1(function(resolve) {
            var txn = idb2.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
            var blob = createBlob([""]);
            txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, "key");
            txn.onabort = function(e) {
              e.preventDefault();
              e.stopPropagation();
              resolve(false);
            };
            txn.oncomplete = function() {
              var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
              var matchedEdge = navigator.userAgent.match(/Edge\//);
              resolve(matchedEdge || !matchedChrome || parseInt(matchedChrome[1], 10) >= 43);
            };
          })["catch"](function() {
            return false;
          });
        }
        function _checkBlobSupport(idb2) {
          if (typeof supportsBlobs === "boolean") {
            return Promise$1.resolve(supportsBlobs);
          }
          return _checkBlobSupportWithoutCaching(idb2).then(function(value) {
            supportsBlobs = value;
            return supportsBlobs;
          });
        }
        function _deferReadiness(dbInfo) {
          var dbContext = dbContexts[dbInfo.name];
          var deferredOperation = {};
          deferredOperation.promise = new Promise$1(function(resolve, reject) {
            deferredOperation.resolve = resolve;
            deferredOperation.reject = reject;
          });
          dbContext.deferredOperations.push(deferredOperation);
          if (!dbContext.dbReady) {
            dbContext.dbReady = deferredOperation.promise;
          } else {
            dbContext.dbReady = dbContext.dbReady.then(function() {
              return deferredOperation.promise;
            });
          }
        }
        function _advanceReadiness(dbInfo) {
          var dbContext = dbContexts[dbInfo.name];
          var deferredOperation = dbContext.deferredOperations.pop();
          if (deferredOperation) {
            deferredOperation.resolve();
            return deferredOperation.promise;
          }
        }
        function _rejectReadiness(dbInfo, err) {
          var dbContext = dbContexts[dbInfo.name];
          var deferredOperation = dbContext.deferredOperations.pop();
          if (deferredOperation) {
            deferredOperation.reject(err);
            return deferredOperation.promise;
          }
        }
        function _getConnection(dbInfo, upgradeNeeded) {
          return new Promise$1(function(resolve, reject) {
            dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();
            if (dbInfo.db) {
              if (upgradeNeeded) {
                _deferReadiness(dbInfo);
                dbInfo.db.close();
              } else {
                return resolve(dbInfo.db);
              }
            }
            var dbArgs = [dbInfo.name];
            if (upgradeNeeded) {
              dbArgs.push(dbInfo.version);
            }
            var openreq = idb.open.apply(idb, dbArgs);
            if (upgradeNeeded) {
              openreq.onupgradeneeded = function(e) {
                var db = openreq.result;
                try {
                  db.createObjectStore(dbInfo.storeName);
                  if (e.oldVersion <= 1) {
                    db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
                  }
                } catch (ex) {
                  if (ex.name === "ConstraintError") {
                    console.warn('The database "' + dbInfo.name + '" has been upgraded from version ' + e.oldVersion + " to version " + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
                  } else {
                    throw ex;
                  }
                }
              };
            }
            openreq.onerror = function(e) {
              e.preventDefault();
              reject(openreq.error);
            };
            openreq.onsuccess = function() {
              var db = openreq.result;
              db.onversionchange = function(e) {
                e.target.close();
              };
              resolve(db);
              _advanceReadiness(dbInfo);
            };
          });
        }
        function _getOriginalConnection(dbInfo) {
          return _getConnection(dbInfo, false);
        }
        function _getUpgradedConnection(dbInfo) {
          return _getConnection(dbInfo, true);
        }
        function _isUpgradeNeeded(dbInfo, defaultVersion) {
          if (!dbInfo.db) {
            return true;
          }
          var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
          var isDowngrade = dbInfo.version < dbInfo.db.version;
          var isUpgrade = dbInfo.version > dbInfo.db.version;
          if (isDowngrade) {
            if (dbInfo.version !== defaultVersion) {
              console.warn('The database "' + dbInfo.name + `" can't be downgraded from version ` + dbInfo.db.version + " to version " + dbInfo.version + ".");
            }
            dbInfo.version = dbInfo.db.version;
          }
          if (isUpgrade || isNewStore) {
            if (isNewStore) {
              var incVersion = dbInfo.db.version + 1;
              if (incVersion > dbInfo.version) {
                dbInfo.version = incVersion;
              }
            }
            return true;
          }
          return false;
        }
        function _encodeBlob(blob) {
          return new Promise$1(function(resolve, reject) {
            var reader = new FileReader();
            reader.onerror = reject;
            reader.onloadend = function(e) {
              var base64 = btoa(e.target.result || "");
              resolve({
                __local_forage_encoded_blob: true,
                data: base64,
                type: blob.type
              });
            };
            reader.readAsBinaryString(blob);
          });
        }
        function _decodeBlob(encodedBlob) {
          var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
          return createBlob([arrayBuff], { type: encodedBlob.type });
        }
        function _isEncodedBlob(value) {
          return value && value.__local_forage_encoded_blob;
        }
        function _fullyReady(callback) {
          var self2 = this;
          var promise = self2._initReady().then(function() {
            var dbContext = dbContexts[self2._dbInfo.name];
            if (dbContext && dbContext.dbReady) {
              return dbContext.dbReady;
            }
          });
          executeTwoCallbacks(promise, callback, callback);
          return promise;
        }
        function _tryReconnect(dbInfo) {
          _deferReadiness(dbInfo);
          var dbContext = dbContexts[dbInfo.name];
          var forages = dbContext.forages;
          for (var i = 0; i < forages.length; i++) {
            var forage = forages[i];
            if (forage._dbInfo.db) {
              forage._dbInfo.db.close();
              forage._dbInfo.db = null;
            }
          }
          dbInfo.db = null;
          return _getOriginalConnection(dbInfo).then(function(db) {
            dbInfo.db = db;
            if (_isUpgradeNeeded(dbInfo)) {
              return _getUpgradedConnection(dbInfo);
            }
            return db;
          }).then(function(db) {
            dbInfo.db = dbContext.db = db;
            for (var i2 = 0; i2 < forages.length; i2++) {
              forages[i2]._dbInfo.db = db;
            }
          })["catch"](function(err) {
            _rejectReadiness(dbInfo, err);
            throw err;
          });
        }
        function createTransaction(dbInfo, mode, callback, retries) {
          if (retries === void 0) {
            retries = 1;
          }
          try {
            var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
            callback(null, tx);
          } catch (err) {
            if (retries > 0 && (!dbInfo.db || err.name === "InvalidStateError" || err.name === "NotFoundError")) {
              return Promise$1.resolve().then(function() {
                if (!dbInfo.db || err.name === "NotFoundError" && !dbInfo.db.objectStoreNames.contains(dbInfo.storeName) && dbInfo.version <= dbInfo.db.version) {
                  if (dbInfo.db) {
                    dbInfo.version = dbInfo.db.version + 1;
                  }
                  return _getUpgradedConnection(dbInfo);
                }
              }).then(function() {
                return _tryReconnect(dbInfo).then(function() {
                  createTransaction(dbInfo, mode, callback, retries - 1);
                });
              })["catch"](callback);
            }
            callback(err);
          }
        }
        function createDbContext() {
          return {
            forages: [],
            db: null,
            dbReady: null,
            deferredOperations: []
          };
        }
        function _initStorage(options) {
          var self2 = this;
          var dbInfo = {
            db: null
          };
          if (options) {
            for (var i in options) {
              dbInfo[i] = options[i];
            }
          }
          var dbContext = dbContexts[dbInfo.name];
          if (!dbContext) {
            dbContext = createDbContext();
            dbContexts[dbInfo.name] = dbContext;
          }
          dbContext.forages.push(self2);
          if (!self2._initReady) {
            self2._initReady = self2.ready;
            self2.ready = _fullyReady;
          }
          var initPromises = [];
          function ignoreErrors() {
            return Promise$1.resolve();
          }
          for (var j = 0; j < dbContext.forages.length; j++) {
            var forage = dbContext.forages[j];
            if (forage !== self2) {
              initPromises.push(forage._initReady()["catch"](ignoreErrors));
            }
          }
          var forages = dbContext.forages.slice(0);
          return Promise$1.all(initPromises).then(function() {
            dbInfo.db = dbContext.db;
            return _getOriginalConnection(dbInfo);
          }).then(function(db) {
            dbInfo.db = db;
            if (_isUpgradeNeeded(dbInfo, self2._defaultConfig.version)) {
              return _getUpgradedConnection(dbInfo);
            }
            return db;
          }).then(function(db) {
            dbInfo.db = dbContext.db = db;
            self2._dbInfo = dbInfo;
            for (var k = 0; k < forages.length; k++) {
              var forage2 = forages[k];
              if (forage2 !== self2) {
                forage2._dbInfo.db = dbInfo.db;
                forage2._dbInfo.version = dbInfo.version;
              }
            }
          });
        }
        function getItem2(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.get(key2);
                  req.onsuccess = function() {
                    var value = req.result;
                    if (value === void 0) {
                      value = null;
                    }
                    if (_isEncodedBlob(value)) {
                      value = _decodeBlob(value);
                    }
                    resolve(value);
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function iterate(iterator, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.openCursor();
                  var iterationNumber = 1;
                  req.onsuccess = function() {
                    var cursor = req.result;
                    if (cursor) {
                      var value = cursor.value;
                      if (_isEncodedBlob(value)) {
                        value = _decodeBlob(value);
                      }
                      var result = iterator(value, cursor.key, iterationNumber++);
                      if (result !== void 0) {
                        resolve(result);
                      } else {
                        cursor["continue"]();
                      }
                    } else {
                      resolve();
                    }
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function setItem2(key2, value, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            var dbInfo;
            self2.ready().then(function() {
              dbInfo = self2._dbInfo;
              if (toString.call(value) === "[object Blob]") {
                return _checkBlobSupport(dbInfo.db).then(function(blobSupport) {
                  if (blobSupport) {
                    return value;
                  }
                  return _encodeBlob(value);
                });
              }
              return value;
            }).then(function(value2) {
              createTransaction(self2._dbInfo, READ_WRITE, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  if (value2 === null) {
                    value2 = void 0;
                  }
                  var req = store.put(value2, key2);
                  transaction.oncomplete = function() {
                    if (value2 === void 0) {
                      value2 = null;
                    }
                    resolve(value2);
                  };
                  transaction.onabort = transaction.onerror = function() {
                    var err2 = req.error ? req.error : req.transaction.error;
                    reject(err2);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function removeItem(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_WRITE, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store["delete"](key2);
                  transaction.oncomplete = function() {
                    resolve();
                  };
                  transaction.onerror = function() {
                    reject(req.error);
                  };
                  transaction.onabort = function() {
                    var err2 = req.error ? req.error : req.transaction.error;
                    reject(err2);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function clear(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_WRITE, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.clear();
                  transaction.oncomplete = function() {
                    resolve();
                  };
                  transaction.onabort = transaction.onerror = function() {
                    var err2 = req.error ? req.error : req.transaction.error;
                    reject(err2);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function length(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.count();
                  req.onsuccess = function() {
                    resolve(req.result);
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function key(n, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            if (n < 0) {
              resolve(null);
              return;
            }
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var advanced = false;
                  var req = store.openKeyCursor();
                  req.onsuccess = function() {
                    var cursor = req.result;
                    if (!cursor) {
                      resolve(null);
                      return;
                    }
                    if (n === 0) {
                      resolve(cursor.key);
                    } else {
                      if (!advanced) {
                        advanced = true;
                        cursor.advance(n);
                      } else {
                        resolve(cursor.key);
                      }
                    }
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function keys(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.openKeyCursor();
                  var keys2 = [];
                  req.onsuccess = function() {
                    var cursor = req.result;
                    if (!cursor) {
                      resolve(keys2);
                      return;
                    }
                    keys2.push(cursor.key);
                    cursor["continue"]();
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function dropInstance(options, callback) {
          callback = getCallback.apply(this, arguments);
          var currentConfig = this.config();
          options = typeof options !== "function" && options || {};
          if (!options.name) {
            options.name = options.name || currentConfig.name;
            options.storeName = options.storeName || currentConfig.storeName;
          }
          var self2 = this;
          var promise;
          if (!options.name) {
            promise = Promise$1.reject("Invalid arguments");
          } else {
            var isCurrentDb = options.name === currentConfig.name && self2._dbInfo.db;
            var dbPromise = isCurrentDb ? Promise$1.resolve(self2._dbInfo.db) : _getOriginalConnection(options).then(function(db) {
              var dbContext = dbContexts[options.name];
              var forages = dbContext.forages;
              dbContext.db = db;
              for (var i = 0; i < forages.length; i++) {
                forages[i]._dbInfo.db = db;
              }
              return db;
            });
            if (!options.storeName) {
              promise = dbPromise.then(function(db) {
                _deferReadiness(options);
                var dbContext = dbContexts[options.name];
                var forages = dbContext.forages;
                db.close();
                for (var i = 0; i < forages.length; i++) {
                  var forage = forages[i];
                  forage._dbInfo.db = null;
                }
                var dropDBPromise = new Promise$1(function(resolve, reject) {
                  var req = idb.deleteDatabase(options.name);
                  req.onerror = function() {
                    var db2 = req.result;
                    if (db2) {
                      db2.close();
                    }
                    reject(req.error);
                  };
                  req.onblocked = function() {
                    console.warn('dropInstance blocked for database "' + options.name + '" until all open connections are closed');
                  };
                  req.onsuccess = function() {
                    var db2 = req.result;
                    if (db2) {
                      db2.close();
                    }
                    resolve(db2);
                  };
                });
                return dropDBPromise.then(function(db2) {
                  dbContext.db = db2;
                  for (var i2 = 0; i2 < forages.length; i2++) {
                    var _forage = forages[i2];
                    _advanceReadiness(_forage._dbInfo);
                  }
                })["catch"](function(err) {
                  (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function() {
                  });
                  throw err;
                });
              });
            } else {
              promise = dbPromise.then(function(db) {
                if (!db.objectStoreNames.contains(options.storeName)) {
                  return;
                }
                var newVersion = db.version + 1;
                _deferReadiness(options);
                var dbContext = dbContexts[options.name];
                var forages = dbContext.forages;
                db.close();
                for (var i = 0; i < forages.length; i++) {
                  var forage = forages[i];
                  forage._dbInfo.db = null;
                  forage._dbInfo.version = newVersion;
                }
                var dropObjectPromise = new Promise$1(function(resolve, reject) {
                  var req = idb.open(options.name, newVersion);
                  req.onerror = function(err) {
                    var db2 = req.result;
                    db2.close();
                    reject(err);
                  };
                  req.onupgradeneeded = function() {
                    var db2 = req.result;
                    db2.deleteObjectStore(options.storeName);
                  };
                  req.onsuccess = function() {
                    var db2 = req.result;
                    db2.close();
                    resolve(db2);
                  };
                });
                return dropObjectPromise.then(function(db2) {
                  dbContext.db = db2;
                  for (var j = 0; j < forages.length; j++) {
                    var _forage2 = forages[j];
                    _forage2._dbInfo.db = db2;
                    _advanceReadiness(_forage2._dbInfo);
                  }
                })["catch"](function(err) {
                  (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function() {
                  });
                  throw err;
                });
              });
            }
          }
          executeCallback(promise, callback);
          return promise;
        }
        var asyncStorage = {
          _driver: "asyncStorage",
          _initStorage,
          _support: isIndexedDBValid(),
          iterate,
          getItem: getItem2,
          setItem: setItem2,
          removeItem,
          clear,
          length,
          key,
          keys,
          dropInstance
        };
        function isWebSQLValid() {
          return typeof openDatabase === "function";
        }
        var BASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var BLOB_TYPE_PREFIX = "~~local_forage_type~";
        var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;
        var SERIALIZED_MARKER = "__lfsc__:";
        var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;
        var TYPE_ARRAYBUFFER = "arbf";
        var TYPE_BLOB = "blob";
        var TYPE_INT8ARRAY = "si08";
        var TYPE_UINT8ARRAY = "ui08";
        var TYPE_UINT8CLAMPEDARRAY = "uic8";
        var TYPE_INT16ARRAY = "si16";
        var TYPE_INT32ARRAY = "si32";
        var TYPE_UINT16ARRAY = "ur16";
        var TYPE_UINT32ARRAY = "ui32";
        var TYPE_FLOAT32ARRAY = "fl32";
        var TYPE_FLOAT64ARRAY = "fl64";
        var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;
        var toString$1 = Object.prototype.toString;
        function stringToBuffer(serializedString) {
          var bufferLength = serializedString.length * 0.75;
          var len = serializedString.length;
          var i;
          var p = 0;
          var encoded1, encoded2, encoded3, encoded4;
          if (serializedString[serializedString.length - 1] === "=") {
            bufferLength--;
            if (serializedString[serializedString.length - 2] === "=") {
              bufferLength--;
            }
          }
          var buffer = new ArrayBuffer(bufferLength);
          var bytes = new Uint8Array(buffer);
          for (i = 0; i < len; i += 4) {
            encoded1 = BASE_CHARS.indexOf(serializedString[i]);
            encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
            encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
            encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);
            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
          }
          return buffer;
        }
        function bufferToString(buffer) {
          var bytes = new Uint8Array(buffer);
          var base64String = "";
          var i;
          for (i = 0; i < bytes.length; i += 3) {
            base64String += BASE_CHARS[bytes[i] >> 2];
            base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
            base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
            base64String += BASE_CHARS[bytes[i + 2] & 63];
          }
          if (bytes.length % 3 === 2) {
            base64String = base64String.substring(0, base64String.length - 1) + "=";
          } else if (bytes.length % 3 === 1) {
            base64String = base64String.substring(0, base64String.length - 2) + "==";
          }
          return base64String;
        }
        function serialize(value, callback) {
          var valueType = "";
          if (value) {
            valueType = toString$1.call(value);
          }
          if (value && (valueType === "[object ArrayBuffer]" || value.buffer && toString$1.call(value.buffer) === "[object ArrayBuffer]")) {
            var buffer;
            var marker = SERIALIZED_MARKER;
            if (value instanceof ArrayBuffer) {
              buffer = value;
              marker += TYPE_ARRAYBUFFER;
            } else {
              buffer = value.buffer;
              if (valueType === "[object Int8Array]") {
                marker += TYPE_INT8ARRAY;
              } else if (valueType === "[object Uint8Array]") {
                marker += TYPE_UINT8ARRAY;
              } else if (valueType === "[object Uint8ClampedArray]") {
                marker += TYPE_UINT8CLAMPEDARRAY;
              } else if (valueType === "[object Int16Array]") {
                marker += TYPE_INT16ARRAY;
              } else if (valueType === "[object Uint16Array]") {
                marker += TYPE_UINT16ARRAY;
              } else if (valueType === "[object Int32Array]") {
                marker += TYPE_INT32ARRAY;
              } else if (valueType === "[object Uint32Array]") {
                marker += TYPE_UINT32ARRAY;
              } else if (valueType === "[object Float32Array]") {
                marker += TYPE_FLOAT32ARRAY;
              } else if (valueType === "[object Float64Array]") {
                marker += TYPE_FLOAT64ARRAY;
              } else {
                callback(new Error("Failed to get type for BinaryArray"));
              }
            }
            callback(marker + bufferToString(buffer));
          } else if (valueType === "[object Blob]") {
            var fileReader = new FileReader();
            fileReader.onload = function() {
              var str = BLOB_TYPE_PREFIX + value.type + "~" + bufferToString(this.result);
              callback(SERIALIZED_MARKER + TYPE_BLOB + str);
            };
            fileReader.readAsArrayBuffer(value);
          } else {
            try {
              callback(JSON.stringify(value));
            } catch (e) {
              console.error("Couldn't convert value into a JSON string: ", value);
              callback(null, e);
            }
          }
        }
        function deserialize(value) {
          if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
            return JSON.parse(value);
          }
          var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
          var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);
          var blobType;
          if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
            var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
            blobType = matcher[1];
            serializedString = serializedString.substring(matcher[0].length);
          }
          var buffer = stringToBuffer(serializedString);
          switch (type) {
            case TYPE_ARRAYBUFFER:
              return buffer;
            case TYPE_BLOB:
              return createBlob([buffer], { type: blobType });
            case TYPE_INT8ARRAY:
              return new Int8Array(buffer);
            case TYPE_UINT8ARRAY:
              return new Uint8Array(buffer);
            case TYPE_UINT8CLAMPEDARRAY:
              return new Uint8ClampedArray(buffer);
            case TYPE_INT16ARRAY:
              return new Int16Array(buffer);
            case TYPE_UINT16ARRAY:
              return new Uint16Array(buffer);
            case TYPE_INT32ARRAY:
              return new Int32Array(buffer);
            case TYPE_UINT32ARRAY:
              return new Uint32Array(buffer);
            case TYPE_FLOAT32ARRAY:
              return new Float32Array(buffer);
            case TYPE_FLOAT64ARRAY:
              return new Float64Array(buffer);
            default:
              throw new Error("Unkown type: " + type);
          }
        }
        var localforageSerializer = {
          serialize,
          deserialize,
          stringToBuffer,
          bufferToString
        };
        function createDbTable(t, dbInfo, callback, errorCallback) {
          t.executeSql("CREATE TABLE IF NOT EXISTS " + dbInfo.storeName + " (id INTEGER PRIMARY KEY, key unique, value)", [], callback, errorCallback);
        }
        function _initStorage$1(options) {
          var self2 = this;
          var dbInfo = {
            db: null
          };
          if (options) {
            for (var i in options) {
              dbInfo[i] = typeof options[i] !== "string" ? options[i].toString() : options[i];
            }
          }
          var dbInfoPromise = new Promise$1(function(resolve, reject) {
            try {
              dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
            } catch (e) {
              return reject(e);
            }
            dbInfo.db.transaction(function(t) {
              createDbTable(t, dbInfo, function() {
                self2._dbInfo = dbInfo;
                resolve();
              }, function(t2, error) {
                reject(error);
              });
            }, reject);
          });
          dbInfo.serializer = localforageSerializer;
          return dbInfoPromise;
        }
        function tryExecuteSql(t, dbInfo, sqlStatement, args, callback, errorCallback) {
          t.executeSql(sqlStatement, args, callback, function(t2, error) {
            if (error.code === error.SYNTAX_ERR) {
              t2.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [dbInfo.storeName], function(t3, results) {
                if (!results.rows.length) {
                  createDbTable(t3, dbInfo, function() {
                    t3.executeSql(sqlStatement, args, callback, errorCallback);
                  }, errorCallback);
                } else {
                  errorCallback(t3, error);
                }
              }, errorCallback);
            } else {
              errorCallback(t2, error);
            }
          }, errorCallback);
        }
        function getItem$1(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT * FROM " + dbInfo.storeName + " WHERE key = ? LIMIT 1", [key2], function(t2, results) {
                  var result = results.rows.length ? results.rows.item(0).value : null;
                  if (result) {
                    result = dbInfo.serializer.deserialize(result);
                  }
                  resolve(result);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function iterate$1(iterator, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT * FROM " + dbInfo.storeName, [], function(t2, results) {
                  var rows = results.rows;
                  var length2 = rows.length;
                  for (var i = 0; i < length2; i++) {
                    var item = rows.item(i);
                    var result = item.value;
                    if (result) {
                      result = dbInfo.serializer.deserialize(result);
                    }
                    result = iterator(result, item.key, i + 1);
                    if (result !== void 0) {
                      resolve(result);
                      return;
                    }
                  }
                  resolve();
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function _setItem(key2, value, callback, retriesLeft) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              if (value === void 0) {
                value = null;
              }
              var originalValue = value;
              var dbInfo = self2._dbInfo;
              dbInfo.serializer.serialize(value, function(value2, error) {
                if (error) {
                  reject(error);
                } else {
                  dbInfo.db.transaction(function(t) {
                    tryExecuteSql(t, dbInfo, "INSERT OR REPLACE INTO " + dbInfo.storeName + " (key, value) VALUES (?, ?)", [key2, value2], function() {
                      resolve(originalValue);
                    }, function(t2, error2) {
                      reject(error2);
                    });
                  }, function(sqlError) {
                    if (sqlError.code === sqlError.QUOTA_ERR) {
                      if (retriesLeft > 0) {
                        resolve(_setItem.apply(self2, [key2, originalValue, callback, retriesLeft - 1]));
                        return;
                      }
                      reject(sqlError);
                    }
                  });
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function setItem$1(key2, value, callback) {
          return _setItem.apply(this, [key2, value, callback, 1]);
        }
        function removeItem$1(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "DELETE FROM " + dbInfo.storeName + " WHERE key = ?", [key2], function() {
                  resolve();
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function clear$1(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "DELETE FROM " + dbInfo.storeName, [], function() {
                  resolve();
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function length$1(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT COUNT(key) as c FROM " + dbInfo.storeName, [], function(t2, results) {
                  var result = results.rows.item(0).c;
                  resolve(result);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function key$1(n, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT key FROM " + dbInfo.storeName + " WHERE id = ? LIMIT 1", [n + 1], function(t2, results) {
                  var result = results.rows.length ? results.rows.item(0).key : null;
                  resolve(result);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function keys$1(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT key FROM " + dbInfo.storeName, [], function(t2, results) {
                  var keys2 = [];
                  for (var i = 0; i < results.rows.length; i++) {
                    keys2.push(results.rows.item(i).key);
                  }
                  resolve(keys2);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function getAllStoreNames(db) {
          return new Promise$1(function(resolve, reject) {
            db.transaction(function(t) {
              t.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function(t2, results) {
                var storeNames = [];
                for (var i = 0; i < results.rows.length; i++) {
                  storeNames.push(results.rows.item(i).name);
                }
                resolve({
                  db,
                  storeNames
                });
              }, function(t2, error) {
                reject(error);
              });
            }, function(sqlError) {
              reject(sqlError);
            });
          });
        }
        function dropInstance$1(options, callback) {
          callback = getCallback.apply(this, arguments);
          var currentConfig = this.config();
          options = typeof options !== "function" && options || {};
          if (!options.name) {
            options.name = options.name || currentConfig.name;
            options.storeName = options.storeName || currentConfig.storeName;
          }
          var self2 = this;
          var promise;
          if (!options.name) {
            promise = Promise$1.reject("Invalid arguments");
          } else {
            promise = new Promise$1(function(resolve) {
              var db;
              if (options.name === currentConfig.name) {
                db = self2._dbInfo.db;
              } else {
                db = openDatabase(options.name, "", "", 0);
              }
              if (!options.storeName) {
                resolve(getAllStoreNames(db));
              } else {
                resolve({
                  db,
                  storeNames: [options.storeName]
                });
              }
            }).then(function(operationInfo) {
              return new Promise$1(function(resolve, reject) {
                operationInfo.db.transaction(function(t) {
                  function dropTable(storeName) {
                    return new Promise$1(function(resolve2, reject2) {
                      t.executeSql("DROP TABLE IF EXISTS " + storeName, [], function() {
                        resolve2();
                      }, function(t2, error) {
                        reject2(error);
                      });
                    });
                  }
                  var operations = [];
                  for (var i = 0, len = operationInfo.storeNames.length; i < len; i++) {
                    operations.push(dropTable(operationInfo.storeNames[i]));
                  }
                  Promise$1.all(operations).then(function() {
                    resolve();
                  })["catch"](function(e) {
                    reject(e);
                  });
                }, function(sqlError) {
                  reject(sqlError);
                });
              });
            });
          }
          executeCallback(promise, callback);
          return promise;
        }
        var webSQLStorage = {
          _driver: "webSQLStorage",
          _initStorage: _initStorage$1,
          _support: isWebSQLValid(),
          iterate: iterate$1,
          getItem: getItem$1,
          setItem: setItem$1,
          removeItem: removeItem$1,
          clear: clear$1,
          length: length$1,
          key: key$1,
          keys: keys$1,
          dropInstance: dropInstance$1
        };
        function isLocalStorageValid() {
          try {
            return typeof localStorage !== "undefined" && "setItem" in localStorage && !!localStorage.setItem;
          } catch (e) {
            return false;
          }
        }
        function _getKeyPrefix(options, defaultConfig) {
          var keyPrefix = options.name + "/";
          if (options.storeName !== defaultConfig.storeName) {
            keyPrefix += options.storeName + "/";
          }
          return keyPrefix;
        }
        function checkIfLocalStorageThrows() {
          var localStorageTestKey = "_localforage_support_test";
          try {
            localStorage.setItem(localStorageTestKey, true);
            localStorage.removeItem(localStorageTestKey);
            return false;
          } catch (e) {
            return true;
          }
        }
        function _isLocalStorageUsable() {
          return !checkIfLocalStorageThrows() || localStorage.length > 0;
        }
        function _initStorage$2(options) {
          var self2 = this;
          var dbInfo = {};
          if (options) {
            for (var i in options) {
              dbInfo[i] = options[i];
            }
          }
          dbInfo.keyPrefix = _getKeyPrefix(options, self2._defaultConfig);
          if (!_isLocalStorageUsable()) {
            return Promise$1.reject();
          }
          self2._dbInfo = dbInfo;
          dbInfo.serializer = localforageSerializer;
          return Promise$1.resolve();
        }
        function clear$2(callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var keyPrefix = self2._dbInfo.keyPrefix;
            for (var i = localStorage.length - 1; i >= 0; i--) {
              var key2 = localStorage.key(i);
              if (key2.indexOf(keyPrefix) === 0) {
                localStorage.removeItem(key2);
              }
            }
          });
          executeCallback(promise, callback);
          return promise;
        }
        function getItem$2(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var result = localStorage.getItem(dbInfo.keyPrefix + key2);
            if (result) {
              result = dbInfo.serializer.deserialize(result);
            }
            return result;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function iterate$2(iterator, callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var keyPrefix = dbInfo.keyPrefix;
            var keyPrefixLength = keyPrefix.length;
            var length2 = localStorage.length;
            var iterationNumber = 1;
            for (var i = 0; i < length2; i++) {
              var key2 = localStorage.key(i);
              if (key2.indexOf(keyPrefix) !== 0) {
                continue;
              }
              var value = localStorage.getItem(key2);
              if (value) {
                value = dbInfo.serializer.deserialize(value);
              }
              value = iterator(value, key2.substring(keyPrefixLength), iterationNumber++);
              if (value !== void 0) {
                return value;
              }
            }
          });
          executeCallback(promise, callback);
          return promise;
        }
        function key$2(n, callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var result;
            try {
              result = localStorage.key(n);
            } catch (error) {
              result = null;
            }
            if (result) {
              result = result.substring(dbInfo.keyPrefix.length);
            }
            return result;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function keys$2(callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var length2 = localStorage.length;
            var keys2 = [];
            for (var i = 0; i < length2; i++) {
              var itemKey = localStorage.key(i);
              if (itemKey.indexOf(dbInfo.keyPrefix) === 0) {
                keys2.push(itemKey.substring(dbInfo.keyPrefix.length));
              }
            }
            return keys2;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function length$2(callback) {
          var self2 = this;
          var promise = self2.keys().then(function(keys2) {
            return keys2.length;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function removeItem$2(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            localStorage.removeItem(dbInfo.keyPrefix + key2);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function setItem$2(key2, value, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = self2.ready().then(function() {
            if (value === void 0) {
              value = null;
            }
            var originalValue = value;
            return new Promise$1(function(resolve, reject) {
              var dbInfo = self2._dbInfo;
              dbInfo.serializer.serialize(value, function(value2, error) {
                if (error) {
                  reject(error);
                } else {
                  try {
                    localStorage.setItem(dbInfo.keyPrefix + key2, value2);
                    resolve(originalValue);
                  } catch (e) {
                    if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
                      reject(e);
                    }
                    reject(e);
                  }
                }
              });
            });
          });
          executeCallback(promise, callback);
          return promise;
        }
        function dropInstance$2(options, callback) {
          callback = getCallback.apply(this, arguments);
          options = typeof options !== "function" && options || {};
          if (!options.name) {
            var currentConfig = this.config();
            options.name = options.name || currentConfig.name;
            options.storeName = options.storeName || currentConfig.storeName;
          }
          var self2 = this;
          var promise;
          if (!options.name) {
            promise = Promise$1.reject("Invalid arguments");
          } else {
            promise = new Promise$1(function(resolve) {
              if (!options.storeName) {
                resolve(options.name + "/");
              } else {
                resolve(_getKeyPrefix(options, self2._defaultConfig));
              }
            }).then(function(keyPrefix) {
              for (var i = localStorage.length - 1; i >= 0; i--) {
                var key2 = localStorage.key(i);
                if (key2.indexOf(keyPrefix) === 0) {
                  localStorage.removeItem(key2);
                }
              }
            });
          }
          executeCallback(promise, callback);
          return promise;
        }
        var localStorageWrapper = {
          _driver: "localStorageWrapper",
          _initStorage: _initStorage$2,
          _support: isLocalStorageValid(),
          iterate: iterate$2,
          getItem: getItem$2,
          setItem: setItem$2,
          removeItem: removeItem$2,
          clear: clear$2,
          length: length$2,
          key: key$2,
          keys: keys$2,
          dropInstance: dropInstance$2
        };
        var sameValue = function sameValue2(x, y) {
          return x === y || typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y);
        };
        var includes = function includes2(array, searchElement) {
          var len = array.length;
          var i = 0;
          while (i < len) {
            if (sameValue(array[i], searchElement)) {
              return true;
            }
            i++;
          }
          return false;
        };
        var isArray = Array.isArray || function(arg) {
          return Object.prototype.toString.call(arg) === "[object Array]";
        };
        var DefinedDrivers = {};
        var DriverSupport = {};
        var DefaultDrivers = {
          INDEXEDDB: asyncStorage,
          WEBSQL: webSQLStorage,
          LOCALSTORAGE: localStorageWrapper
        };
        var DefaultDriverOrder = [DefaultDrivers.INDEXEDDB._driver, DefaultDrivers.WEBSQL._driver, DefaultDrivers.LOCALSTORAGE._driver];
        var OptionalDriverMethods = ["dropInstance"];
        var LibraryMethods = ["clear", "getItem", "iterate", "key", "keys", "length", "removeItem", "setItem"].concat(OptionalDriverMethods);
        var DefaultConfig = {
          description: "",
          driver: DefaultDriverOrder.slice(),
          name: "localforage",
          size: 4980736,
          storeName: "keyvaluepairs",
          version: 1
        };
        function callWhenReady(localForageInstance, libraryMethod) {
          localForageInstance[libraryMethod] = function() {
            var _args = arguments;
            return localForageInstance.ready().then(function() {
              return localForageInstance[libraryMethod].apply(localForageInstance, _args);
            });
          };
        }
        function extend() {
          for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
              for (var _key in arg) {
                if (arg.hasOwnProperty(_key)) {
                  if (isArray(arg[_key])) {
                    arguments[0][_key] = arg[_key].slice();
                  } else {
                    arguments[0][_key] = arg[_key];
                  }
                }
              }
            }
          }
          return arguments[0];
        }
        var LocalForage = function() {
          function LocalForage2(options) {
            _classCallCheck(this, LocalForage2);
            for (var driverTypeKey in DefaultDrivers) {
              if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
                var driver = DefaultDrivers[driverTypeKey];
                var driverName = driver._driver;
                this[driverTypeKey] = driverName;
                if (!DefinedDrivers[driverName]) {
                  this.defineDriver(driver);
                }
              }
            }
            this._defaultConfig = extend({}, DefaultConfig);
            this._config = extend({}, this._defaultConfig, options);
            this._driverSet = null;
            this._initDriver = null;
            this._ready = false;
            this._dbInfo = null;
            this._wrapLibraryMethodsWithReady();
            this.setDriver(this._config.driver)["catch"](function() {
            });
          }
          LocalForage2.prototype.config = function config(options) {
            if ((typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
              if (this._ready) {
                return new Error("Can't call config() after localforage has been used.");
              }
              for (var i in options) {
                if (i === "storeName") {
                  options[i] = options[i].replace(/\W/g, "_");
                }
                if (i === "version" && typeof options[i] !== "number") {
                  return new Error("Database version must be a number.");
                }
                this._config[i] = options[i];
              }
              if ("driver" in options && options.driver) {
                return this.setDriver(this._config.driver);
              }
              return true;
            } else if (typeof options === "string") {
              return this._config[options];
            } else {
              return this._config;
            }
          };
          LocalForage2.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
            var promise = new Promise$1(function(resolve, reject) {
              try {
                var driverName = driverObject._driver;
                var complianceError = new Error("Custom driver not compliant; see https://mozilla.github.io/localForage/#definedriver");
                if (!driverObject._driver) {
                  reject(complianceError);
                  return;
                }
                var driverMethods = LibraryMethods.concat("_initStorage");
                for (var i = 0, len = driverMethods.length; i < len; i++) {
                  var driverMethodName = driverMethods[i];
                  var isRequired = !includes(OptionalDriverMethods, driverMethodName);
                  if ((isRequired || driverObject[driverMethodName]) && typeof driverObject[driverMethodName] !== "function") {
                    reject(complianceError);
                    return;
                  }
                }
                var configureMissingMethods = function configureMissingMethods2() {
                  var methodNotImplementedFactory = function methodNotImplementedFactory2(methodName) {
                    return function() {
                      var error = new Error("Method " + methodName + " is not implemented by the current driver");
                      var promise2 = Promise$1.reject(error);
                      executeCallback(promise2, arguments[arguments.length - 1]);
                      return promise2;
                    };
                  };
                  for (var _i = 0, _len = OptionalDriverMethods.length; _i < _len; _i++) {
                    var optionalDriverMethod = OptionalDriverMethods[_i];
                    if (!driverObject[optionalDriverMethod]) {
                      driverObject[optionalDriverMethod] = methodNotImplementedFactory(optionalDriverMethod);
                    }
                  }
                };
                configureMissingMethods();
                var setDriverSupport = function setDriverSupport2(support) {
                  if (DefinedDrivers[driverName]) {
                    console.info("Redefining LocalForage driver: " + driverName);
                  }
                  DefinedDrivers[driverName] = driverObject;
                  DriverSupport[driverName] = support;
                  resolve();
                };
                if ("_support" in driverObject) {
                  if (driverObject._support && typeof driverObject._support === "function") {
                    driverObject._support().then(setDriverSupport, reject);
                  } else {
                    setDriverSupport(!!driverObject._support);
                  }
                } else {
                  setDriverSupport(true);
                }
              } catch (e) {
                reject(e);
              }
            });
            executeTwoCallbacks(promise, callback, errorCallback);
            return promise;
          };
          LocalForage2.prototype.driver = function driver() {
            return this._driver || null;
          };
          LocalForage2.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
            var getDriverPromise = DefinedDrivers[driverName] ? Promise$1.resolve(DefinedDrivers[driverName]) : Promise$1.reject(new Error("Driver not found."));
            executeTwoCallbacks(getDriverPromise, callback, errorCallback);
            return getDriverPromise;
          };
          LocalForage2.prototype.getSerializer = function getSerializer(callback) {
            var serializerPromise = Promise$1.resolve(localforageSerializer);
            executeTwoCallbacks(serializerPromise, callback);
            return serializerPromise;
          };
          LocalForage2.prototype.ready = function ready(callback) {
            var self2 = this;
            var promise = self2._driverSet.then(function() {
              if (self2._ready === null) {
                self2._ready = self2._initDriver();
              }
              return self2._ready;
            });
            executeTwoCallbacks(promise, callback, callback);
            return promise;
          };
          LocalForage2.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
            var self2 = this;
            if (!isArray(drivers)) {
              drivers = [drivers];
            }
            var supportedDrivers = this._getSupportedDrivers(drivers);
            function setDriverToConfig() {
              self2._config.driver = self2.driver();
            }
            function extendSelfWithDriver(driver) {
              self2._extend(driver);
              setDriverToConfig();
              self2._ready = self2._initStorage(self2._config);
              return self2._ready;
            }
            function initDriver(supportedDrivers2) {
              return function() {
                var currentDriverIndex = 0;
                function driverPromiseLoop() {
                  while (currentDriverIndex < supportedDrivers2.length) {
                    var driverName = supportedDrivers2[currentDriverIndex];
                    currentDriverIndex++;
                    self2._dbInfo = null;
                    self2._ready = null;
                    return self2.getDriver(driverName).then(extendSelfWithDriver)["catch"](driverPromiseLoop);
                  }
                  setDriverToConfig();
                  var error = new Error("No available storage method found.");
                  self2._driverSet = Promise$1.reject(error);
                  return self2._driverSet;
                }
                return driverPromiseLoop();
              };
            }
            var oldDriverSetDone = this._driverSet !== null ? this._driverSet["catch"](function() {
              return Promise$1.resolve();
            }) : Promise$1.resolve();
            this._driverSet = oldDriverSetDone.then(function() {
              var driverName = supportedDrivers[0];
              self2._dbInfo = null;
              self2._ready = null;
              return self2.getDriver(driverName).then(function(driver) {
                self2._driver = driver._driver;
                setDriverToConfig();
                self2._wrapLibraryMethodsWithReady();
                self2._initDriver = initDriver(supportedDrivers);
              });
            })["catch"](function() {
              setDriverToConfig();
              var error = new Error("No available storage method found.");
              self2._driverSet = Promise$1.reject(error);
              return self2._driverSet;
            });
            executeTwoCallbacks(this._driverSet, callback, errorCallback);
            return this._driverSet;
          };
          LocalForage2.prototype.supports = function supports(driverName) {
            return !!DriverSupport[driverName];
          };
          LocalForage2.prototype._extend = function _extend(libraryMethodsAndProperties) {
            extend(this, libraryMethodsAndProperties);
          };
          LocalForage2.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
            var supportedDrivers = [];
            for (var i = 0, len = drivers.length; i < len; i++) {
              var driverName = drivers[i];
              if (this.supports(driverName)) {
                supportedDrivers.push(driverName);
              }
            }
            return supportedDrivers;
          };
          LocalForage2.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
            for (var i = 0, len = LibraryMethods.length; i < len; i++) {
              callWhenReady(this, LibraryMethods[i]);
            }
          };
          LocalForage2.prototype.createInstance = function createInstance(options) {
            return new LocalForage2(options);
          };
          return LocalForage2;
        }();
        var localforage_js = new LocalForage();
        module4.exports = localforage_js;
      }, { "3": 3 }] }, {}, [4])(4);
    });
  }
});

// src/main.ts
__export(exports, {
  default: () => PlantumlPlugin
});
var import_obsidian6 = __toModule(require("obsidian"));

// src/settings.ts
var import_obsidian = __toModule(require("obsidian"));
var DEFAULT_SETTINGS = {
  server_url: "https://www.plantuml.com/plantuml",
  header: "",
  debounce: 3,
  localJar: "",
  javaPath: "java",
  dotPath: "dot",
  defaultProcessor: "png",
  cache: 60,
  exportPath: ""
};
var PlantUMLSettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Server URL").setDesc("PlantUML Server URL").addText((text) => text.setPlaceholder(DEFAULT_SETTINGS.server_url).setValue(this.plugin.settings.server_url).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.server_url = value;
      yield this.plugin.saveSettings();
    })));
    if (import_obsidian.Platform.isDesktopApp) {
      const jarDesc = new DocumentFragment();
      jarDesc.createDiv().innerHTML = "Path to local JAR<br>Supports:<ul><li>Absolute path</li><li>Path relative to vault</li><li>Path relative to users home directory <code>~/</code></li></ul>";
      new import_obsidian.Setting(containerEl).setName("Local JAR").setDesc(jarDesc).addText((text) => text.setPlaceholder(DEFAULT_SETTINGS.localJar).setValue(this.plugin.settings.localJar).onChange((value) => __async(this, null, function* () {
        this.plugin.settings.localJar = value;
        yield this.plugin.saveSettings();
      })));
      new import_obsidian.Setting(containerEl).setName("Java path").setDesc("Path to Java executable").addText((text) => text.setPlaceholder(DEFAULT_SETTINGS.javaPath).setValue(this.plugin.settings.javaPath).onChange((value) => __async(this, null, function* () {
        this.plugin.settings.javaPath = value;
        yield this.plugin.saveSettings();
      })));
      new import_obsidian.Setting(containerEl).setName("Dot path").setDesc("Path to dot executable").addText((text) => text.setPlaceholder(DEFAULT_SETTINGS.dotPath).setValue(this.plugin.settings.dotPath).onChange((value) => __async(this, null, function* () {
        this.plugin.settings.dotPath = value;
        yield this.plugin.saveSettings();
      })));
      new import_obsidian.Setting(containerEl).setName("Diagram export path").setDesc("Path where exported diagrams will be saved relative to the vault root. Leave blank to save along side the note.").addText((text) => text.setPlaceholder(DEFAULT_SETTINGS.exportPath).setValue(this.plugin.settings.exportPath).onChange((value) => __async(this, null, function* () {
        this.plugin.settings.exportPath = value;
        yield this.plugin.saveSettings();
      })));
    }
    new import_obsidian.Setting(containerEl).setName("Default processor for includes").setDesc("Any .pu/.puml files linked will use this processor").addDropdown((dropdown) => {
      dropdown.addOption("png", "PNG").addOption("svg", "SVG").setValue(this.plugin.settings.defaultProcessor).onChange((value) => __async(this, null, function* () {
        this.plugin.settings.defaultProcessor = value;
        yield this.plugin.saveSettings();
      }));
    });
    new import_obsidian.Setting(containerEl).setName("Header").setDesc("Included at the head in every diagram. Useful for specifying a common theme (.puml file)").addTextArea((text) => {
      text.setPlaceholder("!include https://raw.githubusercontent.com/....puml\n").setValue(this.plugin.settings.header).onChange((value) => __async(this, null, function* () {
        this.plugin.settings.header = value;
        yield this.plugin.saveSettings();
      }));
      text.inputEl.setAttr("rows", 4);
      text.inputEl.addClass("puml-settings-area");
    });
    new import_obsidian.Setting(containerEl).setName("Cache").setDesc("in days. Only applicable when generating diagrams locally").addSlider((slider) => {
      slider.setLimits(10, 360, 10).setValue(this.plugin.settings.cache).setDynamicTooltip().onChange((value) => __async(this, null, function* () {
        this.plugin.settings.cache = value;
        yield this.plugin.saveSettings();
      }));
    });
    new import_obsidian.Setting(containerEl).setName("Debounce").setDesc("How often should the diagram refresh in seconds").addText((text) => text.setPlaceholder(String(DEFAULT_SETTINGS.debounce)).setValue(String(this.plugin.settings.debounce)).onChange((value) => __async(this, null, function* () {
      if (!isNaN(Number(value)) || value === void 0) {
        this.plugin.settings.debounce = Number(value || DEFAULT_SETTINGS.debounce);
        yield this.plugin.saveSettings();
      } else {
        new import_obsidian.Notice("Please specify a valid number");
      }
    })));
  }
};

// src/processors/localProcessors.ts
var plantuml = __toModule(require_browser_index());

// src/functions.ts
var Replacer = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  replaceNonBreakingSpaces(text) {
    const lines = text.split(/\r?\n/);
    const resultLines = [];
    if (text.startsWith("@startmindmap")) {
      for (const line of lines) {
        resultLines.push(line.replace(/\s+/g, " "));
      }
    } else {
      resultLines.push(...lines);
    }
    const result = resultLines.join("\r\n");
    return result.replace(/&nbsp;/gi, " ");
  }
  replaceLinks(text, path, filetype) {
    return text.replace(/\[\[\[([\s\S]*?)\]\]\]/g, (_, args) => {
      const split = args.split("|");
      const file = this.plugin.app.metadataCache.getFirstLinkpathDest(split[0], path);
      if (!file) {
        return "File with name: " + split[0] + " not found";
      }
      let alias = file.basename;
      if (filetype === "png") {
        const url = this.plugin.app.getObsidianUrl(file);
        if (split[1]) {
          alias = split[1];
        }
        return "[[" + url + " " + alias + "]]";
      }
      return "[[" + file.basename + "]]";
    });
  }
  getFullPath(path) {
    if (path.length === 0) {
      return this.plugin.app.vault.adapter.getFullPath("");
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (!file) {
      return this.plugin.app.vault.adapter.getFullPath("");
    }
    const folder = this.plugin.app.vault.getDirectParent(file);
    return this.plugin.app.vault.adapter.getFullPath(folder.path);
  }
  getPath(ctx) {
    return this.getFullPath(ctx ? ctx.sourcePath : "");
  }
};
function insertImageWithMap(el, image, map, encodedDiagram) {
  el.empty();
  const img = document.createElement("img");
  if (image.startsWith("http")) {
    img.src = image;
  } else {
    img.src = "data:image/png;base64," + image;
  }
  img.useMap = "#" + encodedDiagram;
  if (map.contains("map")) {
    el.innerHTML = map;
    el.children[0].setAttr("name", encodedDiagram);
  }
  el.appendChild(img);
}
function insertAsciiImage(el, image) {
  el.empty();
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  pre.appendChild(code);
  code.setText(image);
  el.appendChild(pre);
}
function insertSvgImage(el, image) {
  el.empty();
  const parser = new DOMParser();
  const svg = parser.parseFromString(image, "image/svg+xml");
  const links = svg.getElementsByTagName("a");
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    link.addClass("internal-link");
  }
  el.insertAdjacentHTML("beforeend", svg.documentElement.outerHTML);
}

// src/const.ts
var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="100" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><defs><linearGradient id="svgIDc" x1="-33.423" x2="-33.353" y1="-250.911" y2="-250.858" gradientTransform="matrix(37.134 26.001 13.575 -19.387 4673.473 -3982.019)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#767676"/><stop offset="1"/></linearGradient><linearGradient id="svgIDa" x1="-32.107" x2="-32.028" y1="-242.563" y2="-242.586" gradientTransform="matrix(81.081 56.774 17.306 -24.715 6804.021 -4149.644)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0079b9"/><stop offset="1"/></linearGradient><linearGradient id="svgIDd" x1="-33.282" x2="-33.224" y1="-243.423" y2="-243.455" gradientTransform="matrix(60.003 42.015 34.184 -48.82 10343.005 -10469.084)" href="#svgIDa"/><linearGradient id="svgIDb" x1="12.356" x2="14.011" y1="26.268" y2="26.268" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#595959"/><stop offset=".087" stop-color="#6e6e6e"/><stop offset=".242" stop-color="#8c8c8c"/><stop offset=".405" stop-color="#a4a4a4"/><stop offset=".577" stop-color="#b5b5b5"/><stop offset=".765" stop-color="#bfbfbf"/><stop offset="1" stop-color="#c2c2c2"/></linearGradient><linearGradient id="svgIDe" x1="18.291" x2="19.946" y1="26.171" y2="26.171" href="#svgIDb"/><linearGradient id="svgIDf" x1="24.44" x2="26.096" y1="26.171" y2="26.171" href="#svgIDb"/></defs><path fill="#1c0a42" d="m20.305 17.872l6.855 4.546l-5.44 3.075l-6.859-4.494l5.444-3.127z"/><path d="m21.716 25.619l-.055-.036l-7.005-4.59l5.653-3.247l7.056 4.68Zm-6.65-4.613l6.658 4.362l5.231-2.957L20.3 18Z"/><path fill="url(#svgIDc)" d="m26.401 11.909l3.017 1.683l-2.348 1.496l-2.857-1.841l2.188-1.338z"/><path d="m27.069 15.215l-3.058-1.97l2.387-1.46l3.228 1.8Zm-2.654-1.966l2.655 1.711l2.138-1.36l-2.8-1.565Z"/><path fill="#ffbd3f" d="m14.498 17.807l6.856 4.547l-5.44 3.075l-6.859-4.494l5.443-3.128z"/><path d="m15.91 25.554l-.055-.036l-7.005-4.589l5.65-3.248l7.056 4.68Zm-6.65-4.613l6.658 4.359l5.231-2.957l-6.654-4.413Z"/><path fill="#a11f40" d="m7.99 17.966l6.964 4.4l-5.377 3.138l-7.359-4.655l5.772-2.883z"/><path d="M9.575 25.629L2 20.838l6-3l7.164 4.527ZM2.436 20.86l7.144 4.518l5.168-3.016l-6.764-4.273Z"/><path fill="url(#svgIDa)" d="m2.111 21.021l7.332 4.494v3.548l-7.332-4.731v-3.311z"/><path d="M9.55 29.26L2 24.391v-3.562l7.55 4.626Zm-7.332-4.986l7.118 4.592v-3.291l-7.118-4.362Z"/><path fill="url(#svgIDd)" d="m24.071 13.343l2.938 1.879v6.909l-2.938-1.884v-6.904z"/><path d="m27.063 22.229l-3.045-1.953v-7.031l3.045 1.947Zm-2.938-2.012l2.831 1.815v-6.781l-2.831-1.81Z"/><path fill="#fff" d="M27.149 22.526v-7.332l2.365-1.419v15.374H9.646v-3.548l5.44-3.075l.699 3.075h.011l5.676-3.075l.419 3.075h.054l5.204-3.075z"/><path d="M29.621 29.256H9.539v-3.718l5.62-3.177l.7 3.083l5.7-3.087l.422 3.1l5.061-2.991v-7.333l2.58-1.548Zm-19.868-.215h19.654V13.964l-2.151 1.29v7.332l-.053.031l-5.229 3.09H21.8l-.411-3.014l-5.564 3.014H15.7l-.686-3.018l-5.26 2.973Z"/><rect width="1.656" height="1.656" x="12.356" y="25.44" fill="url(#svgIDb)" rx=".215" ry=".215"/><path d="M13.8 27.2h-1.23a.322.322 0 0 1-.322-.322v-1.223a.322.322 0 0 1 .322-.322h1.23a.322.322 0 0 1 .322.322v1.226a.322.322 0 0 1-.322.319Zm-1.23-1.653a.108.108 0 0 0-.107.107v1.226a.108.108 0 0 0 .107.107h1.23a.108.108 0 0 0 .107-.107v-1.225a.108.108 0 0 0-.107-.107Z"/><rect width="1.656" height="1.656" x="18.291" y="25.343" fill="url(#svgIDe)" rx=".215" ry=".215"/><path d="M19.732 27.106h-1.227a.322.322 0 0 1-.322-.322v-1.226a.322.322 0 0 1 .322-.322h1.226a.322.322 0 0 1 .322.322v1.226a.322.322 0 0 1-.321.322Zm-1.226-1.656a.108.108 0 0 0-.107.107v1.226a.108.108 0 0 0 .107.107h1.226a.108.108 0 0 0 .107-.107v-1.225a.108.108 0 0 0-.107-.107Z"/><rect width="1.656" height="1.656" x="24.44" y="25.343" fill="url(#svgIDf)" rx=".215" ry=".215"/><path d="M25.881 27.106h-1.226a.322.322 0 0 1-.322-.322v-1.226a.322.322 0 0 1 .322-.322h1.226a.322.322 0 0 1 .322.322v1.226a.322.322 0 0 1-.322.322Zm-1.226-1.656a.108.108 0 0 0-.107.107v1.226a.108.108 0 0 0 .107.107h1.226a.108.108 0 0 0 .107-.107v-1.225a.108.108 0 0 0-.107-.107Z"/><path fill="#ea2d2e" d="M27.215 11.23c-.052.069-.417-.262-.653-.526a4.408 4.408 0 0 1-.516-.73A2.6 2.6 0 0 1 25.7 9.2a2.358 2.358 0 0 1-.052-.682a2.959 2.959 0 0 1 .129-.749a3.142 3.142 0 0 1 .787-1.207a15.532 15.532 0 0 0 1.283-1.4a3.062 3.062 0 0 0 .479-.927a3.979 3.979 0 0 0 .151-.855c.019-.364-.025-.593.023-.613s.215.274.287.564a3.167 3.167 0 0 1-.458 2.1a6.9 6.9 0 0 1-1.094 1.448a2.8 2.8 0 0 0-.849 1.234a2.466 2.466 0 0 0-.086.687a3.465 3.465 0 0 0 .476 1.542c.288.572.48.833.439.888Z"/><path d="M27.193 11.266c-.124 0-.492-.365-.651-.544a4.478 4.478 0 0 1-.52-.734a2.628 2.628 0 0 1-.346-.781a2.375 2.375 0 0 1-.053-.69a2.978 2.978 0 0 1 .13-.756a3.208 3.208 0 0 1 .793-1.216c.294-.331.5-.528.659-.686a4.393 4.393 0 0 0 .622-.711a3.052 3.052 0 0 0 .476-.919a3.951 3.951 0 0 0 .15-.849c.008-.159 0-.294 0-.393c0-.159-.006-.225.038-.243a.05.05 0 0 1 .043 0a1.226 1.226 0 0 1 .28.579a3.167 3.167 0 0 1-.46 2.121a6.928 6.928 0 0 1-1.1 1.453c-.055.06-.109.116-.162.171a2.3 2.3 0 0 0-.681 1.052a2.47 2.47 0 0 0-.082.673a3.458 3.458 0 0 0 .473 1.53c.114.231.215.415.289.549c.129.235.178.323.142.369a.051.051 0 0 1-.04.02ZM28.512 2.8a.863.863 0 0 0 0 .19c0 .1.007.236 0 .4a4.021 4.021 0 0 1-.152.861a3.106 3.106 0 0 1-.483.934a4.437 4.437 0 0 1-.629.719c-.162.158-.364.354-.657.683a3.168 3.168 0 0 0-.782 1.2a2.933 2.933 0 0 0-.128.743a2.325 2.325 0 0 0 .052.675a2.59 2.59 0 0 0 .341.767a4.422 4.422 0 0 0 .513.725a2.035 2.035 0 0 0 .611.526a1.183 1.183 0 0 0-.147-.31a12.935 12.935 0 0 1-.29-.551a3.5 3.5 0 0 1-.483-1.562a2.53 2.53 0 0 1 .084-.688a2.375 2.375 0 0 1 .694-1.075c.052-.055.106-.111.161-.171a6.879 6.879 0 0 0 1.09-1.442a3.119 3.119 0 0 0 .456-2.083a1.281 1.281 0 0 0-.251-.541Z"/><path fill="#ea2d2e" d="M29.972 6.087c-.019-.088-.432-.04-.766.073a2.6 2.6 0 0 0-1.059.722a2.8 2.8 0 0 0-.916 1.855a2.972 2.972 0 0 0 .258 1.06c.221.572.455.773.444 1.225c-.007.3-.114.484-.048.549s.314-.1.462-.313a1.8 1.8 0 0 0 .259-1.022c-.046-.815-.6-1.015-.608-1.8a1.858 1.858 0 0 1 .129-.676c.443-1.251 1.881-1.508 1.845-1.673Z"/><path d="M27.934 11.617a.094.094 0 0 1-.069-.026c-.046-.046-.03-.122-.005-.237a1.718 1.718 0 0 0 .045-.331a1.374 1.374 0 0 0-.214-.72a5 5 0 0 1-.228-.495a2.98 2.98 0 0 1-.259-1.07a2.81 2.81 0 0 1 .923-1.874a2.64 2.64 0 0 1 1.07-.729a1.482 1.482 0 0 1 .766-.1a.065.065 0 0 1 .037.046c.015.07-.092.121-.306.224a2.73 2.73 0 0 0-1.542 1.463a1.827 1.827 0 0 0-.127.667a1.645 1.645 0 0 0 .291.885a1.889 1.889 0 0 1 .317.914a1.814 1.814 0 0 1-.264 1.039a.809.809 0 0 1-.421.342Zm1.889-5.549a2.117 2.117 0 0 0-.608.117a2.588 2.588 0 0 0-1.048.715a2.764 2.764 0 0 0-.909 1.837a2.935 2.935 0 0 0 .256 1.05a4.955 4.955 0 0 0 .225.49a1.433 1.433 0 0 1 .22.745a1.765 1.765 0 0 1-.047.341c-.019.091-.035.163-.009.188a.046.046 0 0 0 .038.01a.769.769 0 0 0 .382-.32a1.793 1.793 0 0 0 .254-1.005a1.844 1.844 0 0 0-.31-.89a1.711 1.711 0 0 1-.3-.911a1.877 1.877 0 0 1 .13-.686a2.776 2.776 0 0 1 1.573-1.492c.126-.061.283-.136.277-.164l-.008-.007a.264.264 0 0 0-.116-.018Z"/></svg>';
var OutputType = /* @__PURE__ */ ((OutputType2) => {
  OutputType2["PNG"] = "png";
  OutputType2["SVG"] = "svg";
  OutputType2["ASCII"] = "txt";
  return OutputType2;
})(OutputType || {});

// src/processors/localProcessors.ts
var localforage = __toModule(require_localforage());
var LocalProcessors = class {
  constructor(plugin) {
    this.ascii = (source, el, ctx) => __async(this, null, function* () {
      const encodedDiagram = plantuml.encode(source);
      const item = yield localforage.getItem("ascii-" + encodedDiagram);
      if (item) {
        insertAsciiImage(el, item);
        yield localforage.setItem("ts-" + encodedDiagram, Date.now());
        return;
      }
      const image = yield this.generateLocalImage(source, OutputType.ASCII, this.plugin.replacer.getPath(ctx));
      insertAsciiImage(el, image);
      yield localforage.setItem("ascii-" + encodedDiagram, image);
      yield localforage.setItem("ts-" + encodedDiagram, Date.now());
    });
    this.png = (source, el, ctx) => __async(this, null, function* () {
      const encodedDiagram = plantuml.encode(source);
      const item = yield localforage.getItem("png-" + encodedDiagram);
      if (item) {
        const map2 = yield localforage.getItem("map-" + encodedDiagram);
        insertImageWithMap(el, item, map2, encodedDiagram);
        yield localforage.setItem("ts-" + encodedDiagram, Date.now());
        return;
      }
      const path = this.plugin.replacer.getPath(ctx);
      const image = yield this.generateLocalImage(source, OutputType.PNG, path);
      const map = yield this.generateLocalMap(source, path);
      yield localforage.setItem("png-" + encodedDiagram, image);
      yield localforage.setItem("map-" + encodedDiagram, map);
      yield localforage.setItem("ts-" + encodedDiagram, Date.now());
      insertImageWithMap(el, image, map, encodedDiagram);
    });
    this.svg = (source, el, ctx) => __async(this, null, function* () {
      const encodedDiagram = plantuml.encode(source);
      const item = yield localforage.getItem("svg-" + encodedDiagram);
      if (item) {
        insertSvgImage(el, item);
        yield localforage.setItem("ts-" + encodedDiagram, Date.now());
        return;
      }
      const image = yield this.generateLocalImage(source, OutputType.SVG, this.plugin.replacer.getPath(ctx));
      yield localforage.setItem("svg-" + encodedDiagram, image);
      yield localforage.setItem("ts-" + encodedDiagram, Date.now());
      insertSvgImage(el, image);
    });
    this.plugin = plugin;
  }
  generateLocalMap(source, path) {
    return __async(this, null, function* () {
      const { exec } = require("child_process");
      const args = this.resolveLocalJarCmd().concat(["-pipemap"]);
      const child = exec(args.join(" "), { encoding: "binary", cwd: path });
      let stdout = "";
      if (child.stdout) {
        child.stdout.on("data", (data) => {
          stdout += data;
        });
      }
      return new Promise((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) {
            resolve(stdout);
            return;
          } else if (code === 1) {
            console.log(stdout);
            reject(new Error(`an error occurred`));
          } else {
            reject(new Error(`child exited with code ${code}`));
          }
        });
        child.stdin.write(source);
        child.stdin.end();
      });
    });
  }
  generateLocalImage(source, type, path) {
    return __async(this, null, function* () {
      const { ChildProcess, exec } = require("child_process");
      const args = this.resolveLocalJarCmd().concat(["-t" + type, "-pipe"]);
      let child;
      if (type === OutputType.PNG) {
        child = exec(args.join(" "), { encoding: "binary", cwd: path });
      } else {
        child = exec(args.join(" "), { encoding: "utf-8", cwd: path });
      }
      let stdout;
      let stderr;
      if (child.stdout) {
        child.stdout.on("data", (data) => {
          if (stdout === void 0) {
            stdout = data;
          } else
            stdout += data;
        });
      }
      if (child.stderr) {
        child.stderr.on("data", (data) => {
          if (stderr === void 0) {
            stderr = data;
          } else
            stderr += data;
        });
      }
      return new Promise((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (code) => {
          if (stdout === void 0) {
            return;
          }
          if (code === 0) {
            if (type === OutputType.PNG) {
              const buf = new Buffer(stdout, "binary");
              resolve(buf.toString("base64"));
              return;
            }
            resolve(stdout);
            return;
          } else if (code === 1) {
            console.error(stdout);
            reject(new Error(stderr));
          } else {
            if (type === OutputType.PNG) {
              const buf = new Buffer(stdout, "binary");
              resolve(buf.toString("base64"));
              return;
            }
            resolve(stdout);
            return;
          }
        });
        child.stdin.write(source, "utf-8");
        child.stdin.end();
      });
    });
  }
  resolveLocalJarCmd() {
    const jarFromSettings = this.plugin.settings.localJar;
    const { isAbsolute, resolve } = require("path");
    const { userInfo } = require("os");
    let jarFullPath;
    const path = this.plugin.replacer.getFullPath("");
    if (jarFromSettings[0] === "~") {
      jarFullPath = userInfo().homedir + jarFromSettings.slice(1);
    } else {
      if (isAbsolute(jarFromSettings)) {
        jarFullPath = jarFromSettings;
      } else {
        jarFullPath = resolve(path, jarFromSettings);
      }
    }
    if (jarFullPath.length == 0) {
      throw Error("Invalid local jar file");
    }
    if (jarFullPath.endsWith(".jar")) {
      return [
        this.plugin.settings.javaPath,
        "-jar",
        '"' + jarFullPath + '"',
        "-Djava.awt.headless=true",
        "-charset",
        "utf-8",
        "-graphvizdot",
        '"' + this.plugin.settings.dotPath + '"'
      ];
    }
    return [
      jarFullPath,
      "-Djava.awt.headless=true",
      "-charset",
      "utf-8",
      "-graphvizdot",
      '"' + this.plugin.settings.dotPath + '"'
    ];
  }
};

// src/processors/debouncedProcessors.ts
var import_obsidian2 = __toModule(require("obsidian"));

// node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== "undefined" && typeof msCrypto.getRandomValues === "function" && msCrypto.getRandomValues.bind(msCrypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/esm-browser/regex.js
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

// node_modules/uuid/dist/esm-browser/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default = validate;

// node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).substr(1));
}
var i;
function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  if (!validate_default(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}
var stringify_default = stringify;

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return stringify_default(rnds);
}
var v4_default = v4;

// src/processors/debouncedProcessors.ts
var DebouncedProcessors = class {
  constructor(plugin) {
    this.SECONDS_TO_MS_FACTOR = 1e3;
    this.debounceMap = /* @__PURE__ */ new Map();
    this.default = (source, el, ctx) => __async(this, null, function* () {
      yield this.png(source, el, ctx);
    });
    this.png = (source, el, ctx) => __async(this, null, function* () {
      yield this.processor(source, el, ctx, "png", this.plugin.getProcessor().png);
    });
    this.ascii = (source, el, ctx) => __async(this, null, function* () {
      yield this.processor(source, el, ctx, "ascii", this.plugin.getProcessor().ascii);
    });
    this.svg = (source, el, ctx) => __async(this, null, function* () {
      yield this.processor(source, el, ctx, "svg", this.plugin.getProcessor().svg);
    });
    this.processor = (source, el, ctx, filetype, processor) => __async(this, null, function* () {
      const originalSource = source;
      el.dataset.filetype = filetype;
      el.createEl("h6", { text: "Generating PlantUML diagram", cls: "puml-loading" });
      if (el.dataset.plantumlDebounce) {
        const debounceId = el.dataset.plantumlDebounce;
        if (this.debounceMap.has(debounceId)) {
          this.debounceMap.get(debounceId)(source, el, ctx);
        }
      } else {
        const func = (0, import_obsidian2.debounce)(processor, this.debounceTime, true);
        const uuid = v4_default();
        el.dataset.plantumlDebouce = uuid;
        this.debounceMap.set(uuid, func);
        source = this.plugin.replacer.replaceNonBreakingSpaces(source);
        source = this.plugin.replacer.replaceLinks(source, this.plugin.replacer.getPath(ctx), filetype);
        source = this.plugin.settings.header + "\r\n" + source;
        yield processor(source, el, ctx);
        el.addEventListener("contextmenu", (event) => {
          const menu = new import_obsidian2.Menu().addItem((item) => {
            item.setTitle("Copy diagram source").setIcon("clipboard-copy").onClick(() => __async(this, null, function* () {
              yield navigator.clipboard.writeText(originalSource);
            }));
          }).addItem((item) => {
            item.setTitle("Copy diagram").setIcon("image").onClick(() => __async(this, null, function* () {
              console.log(el);
              const img = el.querySelector("img");
              if (img) {
                this.renderToBlob(img, "An error occurred while copying image to clipboard", (blob) => __async(this, null, function* () {
                  yield navigator.clipboard.write([
                    new ClipboardItem({
                      "image/png": blob
                    })
                  ]);
                  new import_obsidian2.Notice("Diagram copied to clipboard");
                }));
              }
              const svg = el.querySelector("svg");
              if (svg) {
                yield navigator.clipboard.writeText(svg.outerHTML);
                new import_obsidian2.Notice("Diagram copied to clipboard");
              }
              const code = el.querySelector("code");
              if (code) {
                yield navigator.clipboard.writeText(code.innerText);
                new import_obsidian2.Notice("Diagram copied to clipboard");
              }
            }));
          }).addItem((item) => {
            item.setTitle("Export diagram").setIcon("image-file").onClick(() => __async(this, null, function* () {
              const img = el.querySelector("img");
              if (img) {
                this.renderToBlob(img, "An error occurred while exporting the diagram", (blob) => __async(this, null, function* () {
                  const filename = yield this.getFilePath(source, ctx, "png");
                  const buffer = yield blob.arrayBuffer();
                  const file = this.getFile(filename);
                  if (file) {
                    yield this.plugin.app.vault.modifyBinary(file, buffer);
                  } else {
                    yield this.plugin.app.vault.createBinary(filename, buffer);
                  }
                  new import_obsidian2.Notice(`Diagram exported to '${filename}'`);
                }));
              }
              const svg = el.querySelector("svg");
              if (svg) {
                yield this.saveTextFile(source, ctx, "svg", svg.outerHTML);
              }
              const code = el.querySelector("code");
              if (code) {
                yield this.saveTextFile(source, ctx, "txt", code.innerText);
              }
            }));
          });
          menu.showAtMouseEvent(event);
        });
      }
    });
    this.renderToBlob = (img, errorMessage, handleBlob) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = img.src;
      image.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        try {
          canvas.toBlob((blob) => __async(this, null, function* () {
            try {
              yield handleBlob(blob);
            } catch (error) {
              new import_obsidian2.Notice(errorMessage);
              console.error(error);
            }
          }));
        } catch (error) {
          new import_obsidian2.Notice(errorMessage);
          console.error(error);
        }
      });
    };
    this.getFilename = (source, ctx) => {
      const startuml = source.match(/@startuml (.+)/i);
      if ((startuml == null ? void 0 : startuml.length) >= 2) {
        return `${startuml[1].trim()}`;
      }
      const now = new Date().toISOString().replace(/[:T]+/g, "-");
      const filename = this.plugin.app.vault.getAbstractFileByPath(ctx.sourcePath).name;
      return `${filename.substring(0, filename.lastIndexOf("."))}-${now.substring(0, now.lastIndexOf("."))}`;
    };
    this.getFolder = (ctx) => __async(this, null, function* () {
      let exportPath = this.plugin.settings.exportPath;
      if (!exportPath.startsWith("/")) {
        const documentPath = this.plugin.app.vault.getAbstractFileByPath(ctx.sourcePath).parent;
        exportPath = `${documentPath.path}/${exportPath}`;
      }
      const exists = yield this.plugin.app.vault.adapter.exists(exportPath);
      if (!exists) {
        this.plugin.app.vault.createFolder(exportPath);
      }
      return exportPath;
    });
    this.getFilePath = (source, ctx, type) => __async(this, null, function* () {
      const filename = this.getFilename(source, ctx);
      const path = yield this.getFolder(ctx);
      return `${path}${filename}.${type}`;
    });
    this.getFile = (fileName) => {
      let fName = fileName;
      if (fName.startsWith("/")) {
        fName = fName.substring(1);
      }
      const folderOrFile = this.plugin.app.vault.getAbstractFileByPath(fName);
      if (folderOrFile instanceof import_obsidian2.TFile) {
        return folderOrFile;
      }
      return void 0;
    };
    this.saveTextFile = (source, ctx, type, data) => __async(this, null, function* () {
      try {
        const filename = yield this.getFilePath(source, ctx, type);
        const file = this.getFile(filename);
        if (file) {
          yield this.plugin.app.vault.modify(file, data);
        } else {
          yield this.plugin.app.vault.create(filename, data);
        }
        new import_obsidian2.Notice(`Diagram exported to '${filename}'`);
      } catch (error) {
        new import_obsidian2.Notice("An error occurred while while exporting the diagram");
        console.error(error);
      }
    });
    this.plugin = plugin;
    const debounceTime = plugin.settings.debounce;
    this.debounceTime = debounceTime * this.SECONDS_TO_MS_FACTOR;
  }
};

// src/processors/serverProcessor.ts
var import_obsidian3 = __toModule(require("obsidian"));
var plantuml2 = __toModule(require_browser_index());
var ServerProcessor = class {
  constructor(plugin) {
    this.svg = (source, el, _) => __async(this, null, function* () {
      let url = this.plugin.settings.server_url;
      if (url.length == 0) {
        url = DEFAULT_SETTINGS.server_url;
      }
      const imageUrlBase = url + "/svg/";
      const encodedDiagram = plantuml2.encode(source);
      (0, import_obsidian3.request)({ url: imageUrlBase + encodedDiagram, method: "GET" }).then((value) => {
        insertSvgImage(el, value);
      }).catch((error) => {
        if (error)
          console.error(error);
      });
    });
    this.png = (source, el, _) => __async(this, null, function* () {
      let url = this.plugin.settings.server_url;
      if (url.length == 0) {
        url = DEFAULT_SETTINGS.server_url;
      }
      const imageUrlBase = url + "/png/";
      const encodedDiagram = plantuml2.encode(source);
      const image = imageUrlBase + encodedDiagram;
      const mapUrlBase = url + "/map/";
      const map = yield (0, import_obsidian3.request)({ url: mapUrlBase + encodedDiagram, method: "GET" });
      insertImageWithMap(el, image, map, encodedDiagram);
    });
    this.ascii = (source, el, _) => __async(this, null, function* () {
      let url = this.plugin.settings.server_url;
      if (url.length == 0) {
        url = DEFAULT_SETTINGS.server_url;
      }
      const asciiUrlBase = url + "/txt/";
      const encodedDiagram = plantuml2.encode(source);
      const result = yield (0, import_obsidian3.request)({ url: asciiUrlBase + encodedDiagram });
      if (result.startsWith("\uFFFDPNG")) {
        const text = document.createElement("p");
        text.style.color = "red";
        text.innerText = "Your configured PlantUML Server does not support ASCII Art";
        el.appendChild(text);
        return;
      }
      insertAsciiImage(el, result);
    });
    this.plugin = plugin;
  }
};

// src/PumlView.ts
var import_obsidian4 = __toModule(require("obsidian"));
var import_view = __toModule(require("@codemirror/view"));
var import_state = __toModule(require("@codemirror/state"));
var import_search = __toModule(require("@codemirror/search"));
var import_commands = __toModule(require("@codemirror/commands"));
var VIEW_TYPE = "plantuml";
var views = [];
var syncAnnotation = import_state.Annotation.define();
function syncDispatch(from) {
  return (tr) => {
    views[from].update([tr]);
    if (tr.changes && tr.annotation && !tr.changes.empty && !tr.annotation(syncAnnotation)) {
      for (let i = 0; i < views.length; i++) {
        if (i !== from) {
          views[i].dispatch({
            changes: tr.changes,
            annotations: syncAnnotation.of(true)
          });
        }
      }
    }
  };
}
var PumlView = class extends import_obsidian4.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.dispatchId = -1;
    this.extensions = [
      (0, import_view.highlightActiveLine)(),
      (0, import_view.highlightActiveLineGutter)(),
      (0, import_search.highlightSelectionMatches)(),
      (0, import_view.drawSelection)(),
      import_view.keymap.of([...import_commands.defaultKeymap, import_commands.indentWithTab]),
      (0, import_commands.history)(),
      (0, import_search.search)(),
      import_view.EditorView.updateListener.of((v) => __async(this, null, function* () {
        if (v.docChanged) {
          this.requestSave();
          yield this.renderPreview();
        }
      }))
    ];
    this.plugin = plugin;
    this.debounced = (0, import_obsidian4.debounce)(this.plugin.getProcessor().png, this.plugin.settings.debounce * 1e3, true);
    this.sourceEl = this.contentEl.createDiv({ cls: "plantuml-source-view", attr: { "style": "display: block" } });
    this.previewEl = this.contentEl.createDiv({ cls: "plantuml-preview-view", attr: { "style": "display: none" } });
    const vault = this.app.vault;
    if (vault.getConfig("showLineNumber")) {
      this.extensions.push((0, import_view.lineNumbers)());
    }
    if (vault.getConfig("lineWrap")) {
      this.extensions.push(import_view.EditorView.lineWrapping);
    }
    this.editor = new import_view.EditorView({
      state: import_state.EditorState.create({
        extensions: this.extensions,
        doc: this.data
      }),
      parent: this.sourceEl,
      dispatch: syncDispatch(views.length)
    });
    this.dispatchId = views.push(this.editor) - 1;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getState() {
    return super.getState();
  }
  setState(state, result) {
    if (state.mode === "preview") {
      this.currentView = "preview";
      (0, import_obsidian4.setIcon)(this.changeModeButton, "pencil");
      this.changeModeButton.setAttribute("aria-label", "Edit (Ctrl+Click to edit in new pane)");
      this.previewEl.style.setProperty("display", "block");
      this.sourceEl.style.setProperty("display", "none");
      this.renderPreview();
    } else {
      this.currentView = "source";
      (0, import_obsidian4.setIcon)(this.changeModeButton, "lines-of-text");
      this.changeModeButton.setAttribute("aria-label", "Preview (Ctrl+Click to open in new pane)");
      this.previewEl.style.setProperty("display", "none");
      this.sourceEl.style.setProperty("display", "block");
    }
    return super.setState(state, result);
  }
  onload() {
    return __async(this, null, function* () {
      this.changeModeButton = this.addAction("lines-of-text", "Preview (Ctrl+Click to open in new pane)", (evt) => this.switchMode(evt), 17);
      const defaultViewMode = this.app.vault.getConfig("defaultViewMode");
      this.currentView = defaultViewMode;
      yield this.setState(__spreadProps(__spreadValues({}, this.getState()), { mode: defaultViewMode }), {});
    });
  }
  onunload() {
    views.remove(views[this.dispatchId]);
    this.editor.destroy();
  }
  switchMode(arg) {
    return __async(this, null, function* () {
      let mode = arg;
      if (!mode || mode instanceof MouseEvent)
        mode = this.currentView === "source" ? "preview" : "source";
      if (arg instanceof MouseEvent) {
        if (import_obsidian4.Keymap.isModEvent(arg)) {
          this.app.workspace.duplicateLeaf(this.leaf).then(() => __async(this, null, function* () {
            var _a, _b;
            const viewState = (_a = this.app.workspace.activeLeaf) == null ? void 0 : _a.getViewState();
            if (viewState) {
              viewState.state = __spreadProps(__spreadValues({}, viewState.state), { mode });
              yield (_b = this.app.workspace.activeLeaf) == null ? void 0 : _b.setViewState(viewState);
            }
          }));
        } else {
          yield this.setState(__spreadProps(__spreadValues({}, this.getState()), { mode }), {});
        }
      }
    });
  }
  getViewData() {
    return this.editor.state.sliceDoc();
  }
  setViewData(data, clear) {
    return __async(this, null, function* () {
      this.data = data;
      if (clear) {
        this.editor.setState(import_state.EditorState.create({
          doc: data,
          extensions: this.extensions
        }));
      } else {
        this.editor.dispatch({
          changes: {
            from: 0,
            to: this.editor.state.doc.length,
            insert: data
          }
        });
      }
      if (this.currentView === "preview")
        this.renderPreview();
    });
  }
  clear() {
    this.previewEl.empty();
    this.data = null;
  }
  getDisplayText() {
    if (this.file)
      return this.file.basename;
    else
      return "PlantUML (no file)";
  }
  canAcceptExtension(extension) {
    return extension == "puml";
  }
  getIcon() {
    return "document-plantuml";
  }
  renderPreview() {
    return __async(this, null, function* () {
      if (this.currentView !== "preview")
        return;
      this.previewEl.empty();
      const loadingHeader = this.previewEl.createEl("h1", { text: "Loading" });
      const previewDiv = this.previewEl.createDiv();
      this.debounced(this.getViewData(), previewDiv, null);
      loadingHeader.remove();
    });
  }
};

// src/main.ts
var import_localforage = __toModule(require_localforage());

// src/embed.ts
var import_obsidian5 = __toModule(require("obsidian"));
var PumlEmbed = class extends import_obsidian5.Component {
  constructor(plugin, file, ctx) {
    super();
    this.plugin = plugin;
    this.file = file;
    this.ctx = ctx;
  }
  loadFile() {
    return __async(this, null, function* () {
      const data = yield this.plugin.app.vault.cachedRead(this.file);
      yield this.plugin.getProcessor().png(data, this.ctx.containerEl, null);
    });
  }
};

// src/main.ts
var PlantumlPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.hover = {
      linkText: null,
      sourcePath: null
    };
  }
  getProcessor() {
    if (import_obsidian6.Platform.isMobileApp) {
      return this.serverProcessor;
    }
    if (this.settings.localJar.length > 0) {
      return this.localProcessor;
    }
    return this.serverProcessor;
  }
  onload() {
    return __async(this, null, function* () {
      console.log("loading plugin plantuml");
      yield this.loadSettings();
      this.addSettingTab(new PlantUMLSettingsTab(this));
      this.replacer = new Replacer(this);
      this.serverProcessor = new ServerProcessor(this);
      if (import_obsidian6.Platform.isDesktopApp) {
        this.localProcessor = new LocalProcessors(this);
      }
      const processor = new DebouncedProcessors(this);
      (0, import_obsidian6.addIcon)("document-" + VIEW_TYPE, LOGO_SVG);
      this.registerView(VIEW_TYPE, (leaf) => {
        return new PumlView(leaf, this);
      });
      this.registerExtensions(["puml", "pu"], VIEW_TYPE);
      this.registerMarkdownCodeBlockProcessor("plantuml", processor.default);
      this.registerMarkdownCodeBlockProcessor("plantuml-png", processor.png);
      this.registerMarkdownCodeBlockProcessor("plantuml-ascii", processor.ascii);
      this.registerMarkdownCodeBlockProcessor("plantuml-svg", processor.svg);
      this.registerMarkdownCodeBlockProcessor("puml", processor.default);
      this.registerMarkdownCodeBlockProcessor("puml-png", processor.png);
      this.registerMarkdownCodeBlockProcessor("puml-svg", processor.svg);
      this.registerMarkdownCodeBlockProcessor("puml-ascii", processor.ascii);
      this.registerMarkdownCodeBlockProcessor("plantuml-map", processor.png);
      this.app.embedRegistry.registerExtensions(["puml", "pu"], (ctx, file, subpath) => new PumlEmbed(this, file, ctx));
      this.cleanupLocalStorage();
      import_localforage.default.config({
        name: "puml",
        description: "PlantUML plugin"
      });
      yield this.cleanupCache();
      this.observer = new MutationObserver((mutation) => __async(this, null, function* () {
        if (mutation.length !== 1)
          return;
        if (mutation[0].addedNodes.length !== 1)
          return;
        if (this.hover.linkText === null)
          return;
        if (mutation[0].addedNodes[0].className !== "popover hover-popover file-embed is-loaded")
          return;
        const file = this.app.metadataCache.getFirstLinkpathDest(this.hover.linkText, this.hover.sourcePath);
        if (!file)
          return;
        if (file.extension !== "puml" && file.extension !== "pu")
          return;
        const fileContent = yield this.app.vault.read(file);
        const imgDiv = createDiv();
        if (this.settings.defaultProcessor === "png") {
          yield this.getProcessor().png(fileContent, imgDiv, null);
        } else {
          yield this.getProcessor().svg(fileContent, imgDiv, null);
        }
        const node = mutation[0].addedNodes[0];
        node.empty();
        const div = createDiv("", (element) => __async(this, null, function* () {
          element.appendChild(imgDiv);
          element.setAttribute("src", file.path);
          element.onClickEvent((event) => {
            event.stopImmediatePropagation();
            const leaf = this.app.workspace.getLeaf(event.ctrlKey);
            leaf.setViewState({
              type: VIEW_TYPE,
              state: { file: file.path }
            });
          });
        }));
        node.appendChild(div);
      }));
      this.registerEvent(this.app.workspace.on("hover-link", (event) => __async(this, null, function* () {
        const linkText = event.linktext;
        if (!linkText)
          return;
        const sourcePath = event.sourcePath;
        if (!linkText.endsWith(".puml") && !linkText.endsWith(".pu")) {
          return;
        }
        this.hover.linkText = linkText;
        this.hover.sourcePath = sourcePath;
      })));
      this.observer.observe(document, { childList: true, subtree: true });
    });
  }
  cleanupCache() {
    return __async(this, null, function* () {
      yield import_localforage.default.iterate((value, key) => {
        if (key.startsWith("ts-")) {
          const encoded = key.split("-")[1];
          if (value < new Date().getTime() - this.settings.cache * 24 * 60 * 60 * 1e3) {
            import_localforage.default.removeItem("png-" + encoded);
            import_localforage.default.removeItem("svg-" + encoded);
            import_localforage.default.removeItem("map-" + encoded);
            import_localforage.default.removeItem("ascii-" + encoded);
          }
        }
      });
    });
  }
  cleanupLocalStorage() {
    for (const key of Object.keys(localStorage)) {
      if (key.endsWith("-map") || key.endsWith("-png") || key.endsWith("-svg") || key.endsWith("ascii")) {
        localStorage.removeItem(key);
      }
    }
  }
  onunload() {
    return __async(this, null, function* () {
      console.log("unloading plugin plantuml");
      this.observer.disconnect();
      this.app.embedRegistry.unregisterExtensions(["puml", "pu"]);
    });
  }
  loadSettings() {
    return __async(this, null, function* () {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
    });
  }
  saveSettings() {
    return __async(this, null, function* () {
      yield this.saveData(this.settings);
    });
  }
  onExternalSettingsChange() {
    return __async(this, null, function* () {
      yield this.loadSettings();
    });
  }
};
/*!
    localForage -- Offline Storage, Improved
    Version 1.10.0
    https://localforage.github.io/localForage
    (c) 2013-2017 Mozilla, Apache License 2.0
*/


/* nosourcemap */
```

### `.cursor/.obsidian/plugins/obsidian-plantuml/manifest.json`

```json
{
	"id": "obsidian-plantuml",
	"name": "PlantUML",
	"version": "1.8.0",
	"minAppVersion": "1.5.7",
	"description": "Render PlantUML Diagrams",
	"author": "Johannes Theiner",
	"authorUrl": "https://github.com/joethei/",
	"isDesktopOnly": false
}
```

### `.cursor/.obsidian/plugins/obsidian-plantuml/styles.css`

```css
.puml-settings-area {
    margin-left: 5px;
    margin-right: 5px;
    font-size: 14px;
    width: 100%;
}

.plantuml-source-view .cm-activeLine {
    background-color: unset !important;
}

.plantuml-source-view .cm-gutters {
    background-color: unset !important;
}

.plantuml-source-view .cm-cursor {
    border-left: 1.2px solid var(--text-muted);
}

.plantuml-source-view .cm-selectionBackground {
    background-color: var(--text-selection) !important;
}

.puml-loading {
    color: var(--text-accent);
}

.internal-embed.file-embed[src$=".puml"] {
    display: none;
}

.internal-embed.file-embed[src$=".pu"] {
    display: none;
}

.puml-error {
    color: var(--text-error);
}
```

### `.cursor/.obsidian/workspace.json`

```json
{
  "main": {
    "id": "98ac477e13cf0dfa",
    "type": "split",
    "children": [
      {
        "id": "0f6cd1522fa0f0f0",
        "type": "tabs",
        "children": [
          {
            "id": "e6679f819ac522a0",
            "type": "leaf",
            "state": {
              "type": "markdown",
              "state": {
                "file": "skills/orchestrating/SKILL.md",
                "mode": "source",
                "source": false
              },
              "icon": "lucide-file",
              "title": "SKILL"
            }
          }
        ]
      }
    ],
    "direction": "vertical"
  },
  "left": {
    "id": "d30898defcac3226",
    "type": "split",
    "children": [
      {
        "id": "e1ccb7b99ea8f7bb",
        "type": "tabs",
        "children": [
          {
            "id": "3241923c4e9150dc",
            "type": "leaf",
            "state": {
              "type": "file-explorer",
              "state": {
                "sortOrder": "alphabetical",
                "autoReveal": false
              },
              "icon": "lucide-folder-closed",
              "title": "文件列表"
            }
          },
          {
            "id": "4ae9ffa20ba910a4",
            "type": "leaf",
            "state": {
              "type": "search",
              "state": {
                "query": "",
                "matchingCase": false,
                "explainSearch": false,
                "collapseAll": false,
                "extraContext": false,
                "sortOrder": "alphabetical"
              },
              "icon": "lucide-search",
              "title": "搜索"
            }
          },
          {
            "id": "da2a436427873987",
            "type": "leaf",
            "state": {
              "type": "bookmarks",
              "state": {},
              "icon": "lucide-bookmark",
              "title": "书签"
            }
          }
        ]
      }
    ],
    "direction": "horizontal",
    "width": 300
  },
  "right": {
    "id": "c032c128a9fca802",
    "type": "split",
    "children": [
      {
        "id": "9f590c6c0895ec2a",
        "type": "tabs",
        "children": [
          {
            "id": "8e13dc9d1c546c23",
            "type": "leaf",
            "state": {
              "type": "backlink",
              "state": {
                "file": "skills/orchestrating/SKILL.md",
                "collapseAll": false,
                "extraContext": false,
                "sortOrder": "alphabetical",
                "showSearch": false,
                "searchQuery": "",
                "backlinkCollapsed": false,
                "unlinkedCollapsed": true
              },
              "icon": "links-coming-in",
              "title": "SKILL 的反向链接列表"
            }
          },
          {
            "id": "6fde6afd13994191",
            "type": "leaf",
            "state": {
              "type": "outgoing-link",
              "state": {
                "file": "skills/orchestrating/SKILL.md",
                "linksCollapsed": false,
                "unlinkedCollapsed": true
              },
              "icon": "links-going-out",
              "title": "SKILL 的出链列表"
            }
          },
          {
            "id": "b6741d71d3fb6b03",
            "type": "leaf",
            "state": {
              "type": "tag",
              "state": {
                "sortOrder": "frequency",
                "useHierarchy": true,
                "showSearch": false,
                "searchQuery": ""
              },
              "icon": "lucide-tags",
              "title": "标签"
            }
          },
          {
            "id": "a4fcb2598bfff279",
            "type": "leaf",
            "state": {
              "type": "all-properties",
              "state": {
                "sortOrder": "frequency",
                "showSearch": false,
                "searchQuery": ""
              },
              "icon": "lucide-archive",
              "title": "添加笔记属性"
            }
          },
          {
            "id": "5d82c7a904d89a48",
            "type": "leaf",
            "state": {
              "type": "outline",
              "state": {
                "file": "skills/orchestrating/SKILL.md",
                "followCursor": false,
                "showSearch": false,
                "searchQuery": ""
              },
              "icon": "lucide-list",
              "title": "SKILL 的大纲"
            }
          }
        ]
      }
    ],
    "direction": "horizontal",
    "width": 300,
    "collapsed": true
  },
  "left-ribbon": {
    "hiddenItems": {
      "switcher:打开快速切换": false,
      "graph:查看关系图谱": false,
      "canvas:新建白板": false,
      "daily-notes:打开/创建今天的日记": false,
      "templates:插入模板": false,
      "command-palette:打开命令面板": false,
      "bases:新建数据库": false
    }
  },
  "active": "e6679f819ac522a0",
  "lastOpenFiles": [
    "skills/delivery-archive/SKILL.md",
    "skills/delivery-archive",
    "agents/ImplementationDesign.md",
    "agents/IntentionDesign.md",
    "agents/CodingAndReparing.md",
    "skills/orchestrating/SKILL.md",
    "skills/orchestrating/BC4F271.tmp",
    "未命名.base",
    "未命名 1.base"
  ]
}
```

### `.cursor/agents/ArchimateLanguagistAudit.md`

````markdown
---
name: archimate-linguist-audit
description: Audit design/KG/SystemArchitecture.json for ArchiMate semantics, schema compliance, and graph wording. Use for architecture graph review or ArchiMate language audit.
model: inherit
readonly: true
---
## Current Stage

Intent Design audit

## Role

You are a specialist auditor for `design/KG/SystemArchitecture.json` from the perspective of an ArchiMate languagist. Your job is to inspect the knowledge graph for ArchiMate language misuse, semantic drift, schema violations, weak wording, inconsistent traceability, and view-model mismatches, then return a precise audit report without editing repository files unless the caller explicitly asks for fixes.

## Evidence Order

Read sources in this order:

1. `design/KG/SystemArchitecture.json`
2. `.argo/schema/SystemArchitecture.schema.json`
3. `OVERALL_ARCHITECTURE.md`
4. Relevant local `ARCHITECTURE.md` files only when they are needed as implementation evidence

Treat the graph and schema as the primary contracts. Treat implementation contracts and code as evidence, not as automatic overrides of explicit graph semantics.

## Audit Focus

Inspect at least these dimensions:

1. **Schema compliance**
   - Required fields
   - Disallowed extra properties
   - Enum correctness
   - Field shape consistency

2. **ArchiMate language correctness**
   - Whether each element type matches the described concept
   - Whether each relationship name matches the intended source-target semantics
   - Whether composition, serving, association, realization, assignment, aggregation, and access are being used precisely rather than loosely
   - Whether directionality is semantically correct rather than merely plausible

3. **Linguistic precision**
   - Ambiguous or overloaded wording in `name`, `description`, `statement`, `browser_path`, and testcase text
   - Informal phrasing that hides architecture semantics
   - Text that describes implementation evidence but fails to express the modeled intent cleanly

4. **Graph coherence**
   - Parent-child consistency
   - Relationship references to missing or mismatched elements
   - Views that omit required supporting relationships or include semantically suspicious groupings
   - Testcase placement that does not align with the owning element's role

5. **Traceability quality**
   - Weak or missing evidence pointers
   - Acceptance criteria that are not expressed as stable entrypoints when the repository already materializes them
   - Descriptions that rely on evidence pointers instead of carrying enough architectural meaning themselves

## Operational Rules

1. Do not edit files, rewrite the graph, or silently normalize defects unless the caller explicitly asks for a repair.
2. Preserve ArchiMate semantics instead of translating them into informal naming intuition.
3. Prefer minimal, high-confidence findings over speculative criticism.
4. Distinguish repository-confirmed facts from assumptions.
5. When a defect is primarily linguistic, explain why the wording is semantically dangerous, not merely stylistically weak.
6. When a defect is primarily schema-related, cite the exact property or structural rule that is violated.
7. When a defect is primarily relationship-related, cite the source element, target element, relationship name, and the semantic reason it is suspicious.
8. If useful, call the unified `argo` MCP tool `validateSystemArchitecture` for confirmation, but do not stop at validator success; semantic defects still matter even when the JSON is schema-valid.
9. Use the unified `argo` MCP server as the authoritative mutation grammar reference for proposed graph changes. Default to dry-run / preview checks and do not write files unless the caller explicitly asks for a repair.

## Recommended Procedure

1. Read the graph and schema first.
2. Build a compact mental map of elements, relationships, views, and testcase ownership.
3. Check structural validity against the schema and repository-native validation commands if available.
4. Audit ArchiMate element typing and relationship semantics.
5. Audit wording quality and view coherence.
6. Return a ranked findings list with minimal correction guidance.

## Required Output

Return these sections in order:

1. **Scope audited**
2. **Overall judgment** with one short verdict
3. **Findings**
   - For each finding include:
     - severity: `blocking`, `major`, `minor`, or `note`
     - location: exact JSON path or graph object identifier
     - category: `schema`, `archimate-semantics`, `wording`, `view-coherence`, or `traceability`
     - problem
     - why it matters
     - minimal correction
4. **Confirmed strengths**
5. **Open assumptions** if any

Prefer concrete JSON paths such as:

```text
elements[id=intent-backend-runtime]
relationships[id=rel-cli-backend]
views[view_id=view-current-state-overview]
```

If no material defects are found, explicitly say that the graph is structurally and semantically acceptable for the audited scope, then list only notes and strengths.
````

### `.cursor/agents/CodingAndReparing.md`

````markdown
---
name: CodingAndReparing
description: Coding/Repair stage fix implementation from failure records and handoff without rewriting frozen tests. Use when test failures exist or user asks to implement/fix code.
model: inherit
readonly: false
---
### Current Stage

Coding/Repair

## Domain Ontology:

```plantuml
@startuml CodingAndReparing_Cognition
skinparam classAttributeIconSize 0
title Coding/Repair Domain Ontology

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

  abstract class ImplementationContract {
    +path
    +declaredStableElements
    +declaredDependencies
    +declaredImplementsMappings
  }

  class RootImplementationContract {
    +path = "OVERALL_ARCHITECTURE.md"
    +rootRules
    +stableElementMap
    +implementsMappings
  }

  class LocalImplementationContract {
    +path = "ARCHITECTURE.md"
    +localResponsibilities
    +localDependencies
    +ownedTests
  }

  class StableArchitectureElement {
    +path
    +contractPath
    +responsibility
    +publicBoundary
  }

  class InterfaceBoundary {
    +providedCapabilities
    +consumedCapabilities
    +allowedDependencies
  }

  class ImplementationDependency {
    +sourceStableElement
    +targetStableElement
    +direction
    +reason
  }

  class ImplementsMapping {
    +implementationElement
    +intentElement
    +directOrIndirect
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

  class ProductionBehavior {
    +input
    +stateTransition
    +output
    +sideEffect
    +errorBehavior
  }

  class ExternalInterface {
    +endpointOrCommand
    +requestContract
    +responseContract
    +documentedInIntroduction
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
    +testcaseToFunctionalPointMappings
    +implementationBoundaryEvidence
    +excludedElements
    +exclusionEvidence
  }

  enum DependencyRole {
    Focus
    UpstreamDependency
    DownstreamDependent
  }
}

package "Test Ontology" {
  abstract class TestAsset {
    +path
    +owner
    +controlPoint
    +observationPoint
  }

  class ExplicitTestcaseEntrypoint {
    +singleEntrypoint
    +readOnlyInCodingStage
    +keyAssertions
    +expectedFailureSignal
  }

  class CriticalNonExplicitTest {
    +category
    +frozenEntrypoint
    +protectedFixtures
    +protectedBaselines
  }

  class SupportingNonExplicitTest {
    +guardrailPurpose
    +evolvableInCodingStage
  }

  class TestHarness {
    +businessReadableMethods
    +hidesSqlCypherGraphqlHttpEnvPlumbing
  }

  class BusinessReadableAssertion {
    +given
    +when
    +then
    +semanticDataNames
    +businessFailureCategory
  }

  enum CriticalNonExplicitCategory {
    ArchitectureBoundaryGuard
    DependencyDirectionGuard
    ExplicitEntrypointCorrectnessGuard
    KeyImplementationTraceabilityGuard
  }

  class TestEnvironment {
    +requiredServices
    +requiredFixtures
    +requiredConfiguration
  }

  class ArchitectureTestRun {
    +entrypoints
    +result
    +remainingFailures
  }
}

package "Handoff Ontology" {
  class IntentToImplementationHandoff {
    +intentElementIds
    +relationshipIds
    +summary
    +openQuestions
    +notes
    +sourceIntentGraphPath
  }

  class ImplementationToCodingHandoff {
    +implementationContracts
    +explicitEntrypoints
    +criticalNonExplicitTests
    +supportingNonExplicitTests
    +expectedFailureRecordsPath
    +codingTargets
    +taskExecutionPlan
    +frozenFiles
  }

  class ImplementationToIntentTraceProposal {
    +implementationAnchors
    +proposedIntentTraceLinks
  }
}

package "Repair Ontology" {
  class TestFailureRecord {
    +testcase
    +acceptanceCriteriaEntrypoint
    +failureSignal
    +failingObservation
  }

  class RepairTask {
    +targetArchitectureEntity
    +targetFailureRecord
    +requiredBehaviorChange
    +traceability
  }

  class ArchitectureDrift {
    +conflictingCodeReality
    +violatedContract
    +repairDirection
  }
}

package "Forbidden Shortcut Ontology" {
  class TestOnlyBusinessCodeShortcut {
    +testStub
    +testBranch
    +testSwitch
    +assertionOnlyReturnField
    +testBackdoor
    +mockOrFixtureFakePass
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
ImplementationArchitecture "1" *-- "many" InterfaceBoundary
ImplementationArchitecture "1" *-- "many" ImplementationDependency
ImplementationArchitecture "1" *-- "many" ImplementsMapping
ImplementationArchitecture "1" *-- "many" ImplementationGuardrail
ImplementationContract <|-- RootImplementationContract
ImplementationContract <|-- LocalImplementationContract
RootImplementationContract --> StableArchitectureElement : declares root-level map
LocalImplementationContract --> StableArchitectureElement : owns local rules
StableArchitectureElement --> ArchitectureEntityElement : realizes directly or indirectly
InterfaceBoundary --> StableArchitectureElement : bounds
ImplementationDependency --> StableArchitectureElement : source/target
ImplementsMapping --> StableArchitectureElement
ImplementsMapping --> ArchitectureEntityElement
ImplementationGuardrail --> StableArchitectureElement : protects

CodeReality "1" *-- "many" RepositoryArtifact
RepositoryArtifact --> StableArchitectureElement : evidence for implementation state
RepositoryArtifact --> ProductionBehavior : implements
ProductionBehavior --> ExternalInterface : may expose
CodeReality --> ImplementationArchitecture : may conform to or drift from
ArchitectureDrift --> ImplementationContract : violates
ArchitectureDrift --> RepositoryArtifact : observed in

DependencySubgraph "1" o-- "1" ArchitectureEntityElement : focus
DependencySubgraph "1" o-- "many" ArchitectureEntityElement : upstream/dependent
CoverageMatrix --> DependencySubgraph : describes coverage over
CoverageMatrix --> DependencyRole : classifies each element
CoverageMatrix --> ExplicitAcceptanceTestcase : records mounted baselines

TestAsset <|-- ExplicitTestcaseEntrypoint
TestAsset <|-- CriticalNonExplicitTest
TestAsset <|-- SupportingNonExplicitTest
ExplicitAcceptanceTestcase --> ExplicitTestcaseEntrypoint : physicalized as
ExplicitTestcaseEntrypoint --> BusinessReadableAssertion : contains
ExplicitTestcaseEntrypoint --> TestHarness : uses
CriticalNonExplicitTest --> CriticalNonExplicitCategory : classified by
StableArchitectureElement "1" o-- "many" TestAsset : owns
ArchitectureTestRun --> ExplicitTestcaseEntrypoint : executes
ArchitectureTestRun --> TestEnvironment : requires
SupportingNonExplicitTest --> RepairTask : may verify local repair
TestOnlyBusinessCodeShortcut --> ProductionBehavior : forbidden contamination

IntentToImplementationHandoff --> ArchitectureEntityElement : scopes elements for downstream implementation
ImplementationToCodingHandoff --> RootImplementationContract
ImplementationToCodingHandoff --> LocalImplementationContract
ImplementationToCodingHandoff --> TestAsset
ImplementationToCodingHandoff --> RepairTask : defines queue
ImplementationToIntentTraceProposal --> ImplementsMapping : proposes upstream trace changes
TestFailureRecord --> ExplicitTestcaseEntrypoint : records failing acceptance boundary
TestFailureRecord --> RepairTask : creates
RepairTask --> ArchitectureEntityElement : traceable to
RepairTask --> RepositoryArtifact : modifies allowed files
RepairTask --> ProductionBehavior : repairs real behavior
RepairTask --> ArchitectureDrift : may resolve

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
  3. Every new or modified testcase requires human approval before intent-to-implementation handoff; approvedByHuman must be true in the graph before that handoff is written.
  4. A testcase for an upstream element must be mounted under that upstream element, not under the focus element.
end note

note bottom of CoverageMatrix
  Logic rules:
  1. Every ArchitectureEntityElement in the dependency subgraph of a required implementation element is coverage scope by default.
  2. Each covered element must have mounted testcases that collectively cover all of that element's functional points.
  3. Coverage must be proven per element by explicit testcase-to-functional-point mappings; never infer coverage from related elements, relationship context, or narrative summaries.
  4. Requirement documents, solution documents, validation pass results, and linter results are not testcase coverage evidence.
  5. Exclusions require evidence-backed reasons.
end note

note bottom of ImplementationArchitecture
  Logic rules:
  1. Implementation architecture is expressed by repository contracts and stable layout.
  2. Stable elements are high-level boundaries, not mirrors of every source file or function.
  3. Directory hierarchy means containment unless an implements mapping is explicitly declared.
  4. Indirect implementation chains are valid when each link is declared by contracts.
  5. Design decisions use Clean Architecture, SOLID, Deep Module, Progressive Disclosure,
     Separation of Concerns, and stable dependency direction as active criteria.
end note

note bottom of ImplementationContract
  Logic rules:
  1. OVERALL_ARCHITECTURE.md is the single root contract for root-level rules.
  2. Local ARCHITECTURE.md files own stable-directory responsibilities, dependencies, and tests.
  3. Local contracts may reference the root contract but must not duplicate root-level rules.
end note

note bottom of ExplicitTestcaseEntrypoint
  Logic rules:
  1. Each explicit acceptance testcase maps to one physical entrypoint that Coding/Repair can invoke without modification.
  2. The entrypoint must contain executable key assertions, not placeholders.
  3. Expected failures are valid only when they expose missing implementation through readable failure signals.
  4. Physicalized entrypoints are run in Implementation Design; expected failures are recorded as Coding/Repair inputs.
end note

note bottom of BusinessReadableAssertion
  Logic rules:
  1. Explicit testcase bodies use GIVEN / WHEN / THEN.
  2. Test bodies use Harness abstractions rather than low-level plumbing.
  3. Names and failure categories must express business meaning.
end note

note bottom of TestAsset
  Logic rules:
  1. Every test asset must preserve control point and observation point.
  2. Test assets are owned by stable architecture elements per contract.
  3. Explicit testcase entrypoints and critical non-explicit tests are read-only in Coding/Repair.
  4. Supporting non-explicit tests may be added or refined only inside contract-allowed locations.
  5. design/KG/SystemArchitecture.json, frozen test assets, and contract documents listed in frozenFiles or implementationContracts are not edited in Coding/Repair; contract-allowed source and configuration files declared by those contracts remain editable.
end note

note bottom of RepairTask
  Logic rules:
  1. Every repair task must trace to a handoff item, failure record, explicit testcase, or dependency-subgraph entity.
  2. Repairs follow dependency order: upstream dependencies, shared contracts, and prerequisite entrypoints before downstream capabilities.
  3. Repair changes the real production behavior with the minimum code needed.
  4. Simplicity first: no speculative features, single-use abstractions, unrequested configurability, or impossible-scenario handling.
  5. If the implementation can be much smaller while preserving behavior, rewrite toward the smaller real-behavior repair.
end note

note bottom of TestOnlyBusinessCodeShortcut
  Logic rules:
  Business code must not contain test-only branches, switches, backdoors,
  assertion-only fields, or fake mock/fixture paths to make tests pass.
end note

note bottom of ArchitectureTestRun
  Logic rules:
  1. Existing failing entrypoints are rerun until repaired.
  2. Full explicit architecture tests must pass before completion.
  3. Test environment problems are resolved rather than used to skip tests.
end note
@enduml
```
## Behavior:

```plantuml
@startuml CodingAndReparing_Action
title CodingAndReparing Event-Driven Action Flow

start
:Load design/persistant-memory/coding-and-repairing.md, design/KG/SystemArchitecture.json, implementation contracts, handoff, and failure records; recognize incoming EVENT
[acts on: IntentArchitecture, ImplementationArchitecture, ImplementationToCodingHandoff, TestFailureRecord, CodeReality];
:Enforce Coding/Repair stage communication and edit guardrails
[acts on: ImplementationToCodingHandoff, TestFailureRecord, TestAsset, CodeReality];
note right
  Stage guardrails:
  1. Read design/KG/ImplementationToCodingHandoff.json before changing code.
  2. If the handoff is missing, incomplete, or conflicts with repository state so work cannot execute, report an Implementation Design gap instead of skipping it.
  3. Use the handoff, expectedFailureRecordsPath, and failure records as the repair queue; do not patch from isolated local errors without architecture context.
  4. User-facing responses begin with "Derek".
  5. If test-environment setup blocks execution, stop and ask the human partner for help, with a suggested next step when useful.
end note

if (EVENT: Handoff repair queue or failure records?) then (repair)
  :Build traceable repair queue from design/KG/ImplementationToCodingHandoff.json, handoff.expectedFailureRecordsPath, OVERALL_ARCHITECTURE.md, **/ARCHITECTURE.md, and existing tests
  [acts on: RepairTask, ImplementationToCodingHandoff, TestFailureRecord, ExplicitTestcaseEntrypoint, ImplementationContract];
  :MCP tool: argo.getIntentElementContext when repair queue spans multiple intent-linked elements or upstream dependencies
  Read dependency subgraph to choose repair order
  [acts on: DependencySubgraph, ArchitectureEntityElement, RepairTask];
  :Modify contract-allowed source or configuration files to repair real production behavior while preserving frozen assets
  [acts on: ProductionBehavior, RepositoryArtifact, RepairTask, ExplicitTestcaseEntrypoint, CriticalNonExplicitTest];
  :Add or refine only contract-allowed supporting test files when useful
  [acts on: SupportingNonExplicitTest, TestAsset.controlPoint, TestAsset.observationPoint];
  if (External interface changes?) then (yes)
    :Update INTRODUCTION.md to match the real interface
    [acts on: ExternalInterface];
  endif
  :Run the relevant existing entrypoints and update repair state
  [acts on: ExplicitTestcaseEntrypoint, TestFailureRecord, ArchitectureTestRun];
  :MCP tool: argo.runArchitectureTests
  Run full explicit architecture tests before completion
  [acts on: ArchitectureTestRun, ExplicitTestcaseEntrypoint];

elseif (EVENT: Architecture test regression?) then (regression)
  :Trace regression to contract, dependency subgraph, or production behavior drift
  [acts on: ArchitectureTestRun, ArchitectureDrift, ImplementationContract, ProductionBehavior];
  :MCP tool: argo.getIntentElementContext when regression maps to an intent element
  Read focused dependency subgraph
  [acts on: DependencySubgraph, ArchitectureEntityElement, RepairTask];
  :Modify the minimum contract-allowed implementation files and rerun affected tests
  [acts on: RepairTask, RepositoryArtifact, ProductionBehavior, ExplicitTestcaseEntrypoint];
  :MCP tool: argo.runArchitectureTests
  Run full explicit architecture tests before completion
  [acts on: ArchitectureTestRun, ExplicitTestcaseEntrypoint];

elseif (EVENT: Test environment blocker?) then (environment)
  :Stop coding work and ask the human partner for environment help without skipping required tests
  [acts on: TestEnvironment, ArchitectureTestRun];
  :Rerun the blocked existing entrypoints after environment recovery
  [acts on: ArchitectureTestRun, ExplicitTestcaseEntrypoint, TestFailureRecord];
else (other)
  :Ask for the missing coding or repair event frame before editing code
  [acts on: RepairTask, CodeReality, ImplementationToCodingHandoff];
endif

:Report code changes, preserved frozen assets, test results, and remaining repair risks
[acts on: RepositoryArtifact, CriticalNonExplicitTest, SupportingNonExplicitTest, ArchitectureTestRun, TestEnvironment];
note right
  Report guardrails:
  1. State whether ImplementationToCodingHandoff was read and obeyed; if not, name the gap.
  2. Use concrete repository paths for contracts, changed files, frozen tests, supporting tests, fixtures, and entrypoints.
  3. Put user-facing path lists in a separate text block, one path per line.
  4. Include external interface changes and INTRODUCTION.md updates when applicable.
  5. Include added or refined non-explicit tests with control point and observation point.
  6. Include which intent dependency subgraph drove repair order and how the implementation followed it.
  7. Include current test execution results and how the test environment was identified or why it remains blocked.
end note
:Write session-level repair decisions and repeated-error solutions to design/persistant-memory/coding-and-repairing.md
[acts on: RepairTask, ArchitectureDrift, CodeReality];
stop
@enduml
```
````

### `.cursor/agents/ImplementationDesign.md`

````markdown
---
name: ImplementationDesign
description: Implementation Design stage materialize architecture contracts, explicit testcase entrypoints, and ImplementationToCoding handoff. Use after intent is clarified.
model: inherit
readonly: false
---
### Current Stage

Implementation Design

## Domain Ontology:

```plantuml
@startuml ImplementationDesign_Cognition
skinparam classAttributeIconSize 0
title Implementation Design Domain Ontology

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

  abstract class ImplementationContract {
    +path
    +declaredStableElements
    +declaredDependencies
    +declaredImplementsMappings
  }

  class RootImplementationContract {
    +path = "OVERALL_ARCHITECTURE.md"
    +rootRules
    +stableElementMap
    +implementsMappings
  }

  class LocalImplementationContract {
    +path = "ARCHITECTURE.md"
    +localResponsibilities
    +localDependencies
    +ownedTests
  }

  class StableArchitectureElement {
    +path
    +contractPath
    +responsibility
    +publicBoundary
  }

  class InterfaceBoundary {
    +providedCapabilities
    +consumedCapabilities
    +allowedDependencies
  }

  class ImplementationDependency {
    +sourceStableElement
    +targetStableElement
    +direction
    +reason
  }

  class ImplementsMapping {
    +implementationElement
    +intentElement
    +directOrIndirect
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
    +testcaseToFunctionalPointMappings
    +implementationBoundaryEvidence
    +excludedElements
    +exclusionEvidence
  }

  enum DependencyRole {
    Focus
    UpstreamDependency
    DownstreamDependent
  }
}

package "Test Ontology" {
  abstract class TestAsset {
    +path
    +owner
    +controlPoint
    +observationPoint
  }

  class ExplicitTestcaseEntrypoint {
    +singleEntrypoint
    +readOnlyInCodingStage
    +keyAssertions
    +expectedFailureSignal
  }

  class CriticalNonExplicitTest {
    +category
    +frozenEntrypoint
    +protectedFixtures
    +protectedBaselines
  }

  class SupportingNonExplicitTest {
    +guardrailPurpose
    +evolvableInCodingStage
  }

  class TestHarness {
    +businessReadableMethods
    +hidesSqlCypherGraphqlHttpEnvPlumbing
  }

  class BusinessReadableAssertion {
    +given
    +when
    +then
    +semanticDataNames
    +businessFailureCategory
  }

  enum CriticalNonExplicitCategory {
    ArchitectureBoundaryGuard
    DependencyDirectionGuard
    ExplicitEntrypointCorrectnessGuard
    KeyImplementationTraceabilityGuard
  }
}

package "Handoff Ontology" {
  class IntentToImplementationHandoff {
    +intentElementIds
    +relationshipIds
    +summary
    +openQuestions
    +notes
    +sourceIntentGraphPath
  }

  class ImplementationToCodingHandoff {
    +implementationContracts
    +explicitEntrypoints
    +criticalNonExplicitTests
    +supportingNonExplicitTests
    +expectedFailureRecordsPath
    +codingTargets
    +taskExecutionPlan
    +frozenFiles
  }

  class ImplementationToIntentTraceProposal {
    +implementationAnchors
    +proposedIntentTraceLinks
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
ImplementationArchitecture "1" *-- "many" InterfaceBoundary
ImplementationArchitecture "1" *-- "many" ImplementationDependency
ImplementationArchitecture "1" *-- "many" ImplementsMapping
ImplementationArchitecture "1" *-- "many" ImplementationGuardrail
ImplementationContract <|-- RootImplementationContract
ImplementationContract <|-- LocalImplementationContract
RootImplementationContract --> StableArchitectureElement : declares root-level map
LocalImplementationContract --> StableArchitectureElement : owns local rules
StableArchitectureElement --> ArchitectureEntityElement : realizes directly or indirectly
InterfaceBoundary --> StableArchitectureElement : bounds
ImplementationDependency --> StableArchitectureElement : source/target
ImplementsMapping --> StableArchitectureElement
ImplementsMapping --> ArchitectureEntityElement
ImplementationGuardrail --> StableArchitectureElement : protects

CodeReality "1" *-- "many" RepositoryArtifact
RepositoryArtifact --> StableArchitectureElement : evidence for implementation state
CodeReality --> ImplementationArchitecture : may conform to or drift from

DependencySubgraph "1" o-- "1" ArchitectureEntityElement : focus
DependencySubgraph "1" o-- "many" ArchitectureEntityElement : upstream/dependent
CoverageMatrix --> DependencySubgraph : describes coverage over
CoverageMatrix --> DependencyRole : classifies each element
CoverageMatrix --> ExplicitAcceptanceTestcase : records mounted baselines

TestAsset <|-- ExplicitTestcaseEntrypoint
TestAsset <|-- CriticalNonExplicitTest
TestAsset <|-- SupportingNonExplicitTest
ExplicitAcceptanceTestcase --> ExplicitTestcaseEntrypoint : physicalized as
ExplicitTestcaseEntrypoint --> BusinessReadableAssertion : contains
ExplicitTestcaseEntrypoint --> TestHarness : uses
CriticalNonExplicitTest --> CriticalNonExplicitCategory : classified by
StableArchitectureElement "1" o-- "many" TestAsset : owns

IntentToImplementationHandoff --> ArchitectureEntityElement : scopes elements for downstream implementation
ImplementationToCodingHandoff --> RootImplementationContract
ImplementationToCodingHandoff --> LocalImplementationContract
ImplementationToCodingHandoff --> TestAsset
ImplementationToIntentTraceProposal --> ImplementsMapping : proposes upstream trace changes

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
  3. Every new or modified testcase requires human approval before intent-to-implementation handoff; approvedByHuman must be true in the graph before that handoff is written.
  4. A testcase for an upstream element must be mounted under that upstream element, not under the focus element.
end note

note bottom of CoverageMatrix
  Logic rules:
  1. Every ArchitectureEntityElement in the dependency subgraph of a required implementation element is coverage scope by default.
  2. Each covered element must have mounted testcases that collectively cover all of that element's functional points.
  3. Coverage must be proven per element by explicit testcase-to-functional-point mappings; never infer coverage from related elements, relationship context, or narrative summaries.
  4. Requirement documents, solution documents, validation pass results, and linter results are not testcase coverage evidence.
  5. Exclusions require evidence-backed reasons.
end note

note bottom of ImplementationArchitecture
  Logic rules:
  1. Implementation architecture is expressed by repository contracts and stable layout.
  2. Stable elements are high-level boundaries, not mirrors of every source file or function.
  3. Directory hierarchy means containment unless an implements mapping is explicitly declared.
  4. Indirect implementation chains are valid when each link is declared by contracts.
  5. Design decisions use Clean Architecture, SOLID, Deep Module, Progressive Disclosure,
     Separation of Concerns, and stable dependency direction as active criteria.
end note

note bottom of ImplementationContract
  Logic rules:
  1. OVERALL_ARCHITECTURE.md is the single root contract for root-level rules.
  2. Local ARCHITECTURE.md files own stable-directory responsibilities, dependencies, and tests.
  3. Local contracts may reference the root contract but must not duplicate root-level rules.
end note

note bottom of ExplicitTestcaseEntrypoint
  Logic rules:
  1. Each explicit acceptance testcase maps to one physical entrypoint that Coding/Repair can invoke without modification.
  2. The entrypoint must contain executable key assertions, not placeholders.
  3. Expected failures are valid only when they expose missing implementation through readable failure signals.
  4. Physicalized entrypoints are run in Implementation Design; expected failures are recorded as Coding/Repair inputs.
end note

note bottom of BusinessReadableAssertion
  Logic rules:
  1. Explicit testcase bodies use GIVEN / WHEN / THEN.
  2. Test bodies use Harness abstractions rather than low-level plumbing.
  3. Names and failure categories must express business meaning.
end note

note bottom of TestAsset
  Logic rules:
  1. Every test asset must preserve control point and observation point.
  2. Test assets are owned by stable architecture elements per contract.
end note
@enduml
```
## Behavior:

```plantuml
@startuml ImplementationDesign_Action
title ImplementationDesign Event-Driven Action Flow

start
:Load design/persistant-memory/implementation-design.md, design/KG/SystemArchitecture.json, and design/KG/IntentToImplementationHandoff.json; recognize incoming EVENT
[acts on: IntentArchitecture, IntentToImplementationHandoff, ImplementationArchitecture, CodeReality];
:Enforce Implementation Design stage communication and edit guardrails
[acts on: IntentArchitecture, ImplementationArchitecture, ImplementationToCodingHandoff, CodeReality];
note right
  Stage guardrails:
  1. Do not directly edit design/KG/SystemArchitecture.json; report required intent graph changes as upstream Intent Design gaps or trace proposals.
  2. Do not implement business behavior unless explicitly requested; this stage owns contracts, boundaries, testcase entrypoints, and guardrails.
  3. Ask the user only for high-leverage decisions about decomposition, interfaces, dependency direction, explicit entrypoint freezing, or critical guardrails.
  4. Each user decision request must include recommendation, alternatives, reasons, and tradeoffs.
  5. User-facing responses begin with "Derek".
  6. If test-environment setup blocks evidence gathering or entrypoint execution, stop and ask the human partner for help, with a suggested next step when useful.
end note

if (EVENT: Intent-to-implementation handoff received?) then (handoff)
  :Interpret intent scope and current implementation architecture at stable-boundary level
  [acts on: IntentElement, ExplicitAcceptanceTestcase, ImplementationArchitecture, StableArchitectureElement, ImplementationContract];
  if (Scope is anchored to intent elements?) then (yes)
    :MCP tool: argo.getIntentElementContext
    Read dependency subgraph for boundary and testcase ownership decisions
    [acts on: DependencySubgraph, IntentElement, StableArchitectureElement, TestAsset];
  endif
  :Identify high-leverage implementation decisions and resolve them with the user when repository evidence cannot decide
  [acts on: ImplementationArchitecture, InterfaceBoundary, ImplementationDependency, ExplicitTestcaseEntrypoint, CriticalNonExplicitTest];
  :Write or update OVERALL_ARCHITECTURE.md and relevant **/ARCHITECTURE.md contracts for stable boundaries, dependency direction, and implements mappings
  [acts on: RootImplementationContract, LocalImplementationContract, StableArchitectureElement, InterfaceBoundary, ImplementationDependency, ImplementsMapping];
  :If ExplicitAcceptanceTestcase entries are missing, mounted under the wrong element, or lack concrete entrypoints, report upstream Intent Design gap or write ImplementationToIntentTraceProposal
  [acts on: IntentArchitecture, ExplicitAcceptanceTestcase, ImplementationToIntentTraceProposal];
  :Write contract-owned explicit testcase entrypoints and selected guardrails at approved test paths
  [acts on: ExplicitTestcaseEntrypoint, BusinessReadableAssertion, TestHarness, CriticalNonExplicitTest, SupportingNonExplicitTest];
  :Run representative physicalized entrypoints to classify pass, expected failure, or design blocker
  [acts on: ExplicitTestcaseEntrypoint, CodeReality, ImplementationToCodingHandoff];
  :Write design/KG/ImplementationToCodingHandoff.json from contracts, frozenFiles, expectedFailureRecordsPath, and taskExecutionPlan
  [acts on: ImplementationToCodingHandoff, ImplementationContract, TestAsset];
  :MCP tool: argo.validateStageHandoff
  stage = "implementation-to-coding"
  Validate implementation handoff
  [acts on: ImplementationToCodingHandoff];

elseif (EVENT: Implementation architecture audit?) then (audit)
  :Audit stable boundaries, contract consistency, dependency direction, and test ownership
  [acts on: ImplementationArchitecture, ImplementationContract, StableArchitectureElement, ImplementationDependency, TestAsset];
  if (Audit needs intent context?) then (yes)
    :MCP tool: argo.getIntentElementContext
    Read relevant dependency subgraph
    [acts on: DependencySubgraph, IntentElement, ImplementsMapping];
  endif
  :Classify audit findings as contract drift, missing intent coverage, misplaced tests, or code drift
  [acts on: ImplementationArchitecture, IntentArchitecture, CodeReality, TestAsset];
  if (Implementation anchors need upstream intent trace review?) then (yes)
    :Write design/KG/ImplementationToIntentTraceProposal.json for Intent Design review
    [acts on: ImplementationToIntentTraceProposal, ImplementsMapping];
  endif

elseif (EVENT: Test entrypoint or guardrail gap?) then (test gap)
  :Write the minimal contract-owned testcase or guardrail asset that closes the gap
  [acts on: ExplicitTestcaseEntrypoint, CriticalNonExplicitTest, SupportingNonExplicitTest, TestAsset, StableArchitectureElement];
  :Update affected OVERALL_ARCHITECTURE.md, **/ARCHITECTURE.md, and design/KG/ImplementationToCodingHandoff.json when appropriate
  [acts on: ImplementationContract, ImplementationToCodingHandoff];
  :MCP tool: argo.validateStageHandoff
  stage = "implementation-to-coding"
  Validate updated handoff when emitted
  [acts on: ImplementationToCodingHandoff];
else (other)
  :Ask for the missing implementation-design event frame before changing contracts or tests
  [acts on: ImplementationArchitecture, TestAsset, CodeReality];
endif

:Report contracts, paths, user decisions, testcase physicalization, dependency-subgraph coverage, execution results, and open implementation gaps
[acts on: ImplementationArchitecture, ImplementationToCodingHandoff, TestAsset, DependencySubgraph];
note right
  Report guardrails:
  1. Use concrete repository paths for contracts, entrypoints, fixtures, baselines, and handoff artifacts.
  2. Put user-facing path lists in a separate text block, one path per line.
  3. Include explicit testcase control points, observation points, GIVEN/WHEN/THEN readability, Harness abstraction, and expected failure signals.
  4. Include critical non-explicit test category, files listed in frozenFiles, protected fixtures, protected baselines, expectedFailureRecordsPath, and remaining blockers.
end note
:Write session-level decisions, contract changes, and open architecture risks to design/persistant-memory/implementation-design.md
[acts on: ImplementationArchitecture, ImplementationToCodingHandoff, TestAsset];
stop
@enduml
```
````

### `.cursor/agents/IntentionDesign.md`

````markdown
---
name: IntentionDesign
description: Intent Design stage clarify requirements, update intent architecture, and produce IntentToImplementation handoff. Use when starting intent work or redesigning SystemArchitecture.json.
model: inherit
readonly: false
---
### Current stage: Intent Design.

## Domain Ontology:

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

  abstract class ImplementationContract {
    +path
    +declaredStableElements
    +declaredDependencies
    +declaredImplementsMappings
  }

  class RootImplementationContract {
    +path = "OVERALL_ARCHITECTURE.md"
    +rootRules
    +stableElementMap
    +implementsMappings
  }

  class LocalImplementationContract {
    +path = "ARCHITECTURE.md"
    +localResponsibilities
    +localDependencies
    +ownedTests
  }

  class StableArchitectureElement {
    +path
    +contractPath
    +responsibility
    +publicBoundary
  }

  class InterfaceBoundary {
    +providedCapabilities
    +consumedCapabilities
    +allowedDependencies
  }

  class ImplementationDependency {
    +sourceStableElement
    +targetStableElement
    +direction
    +reason
  }

  class ImplementsMapping {
    +implementationElement
    +intentElement
    +directOrIndirect
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
    +testcaseToFunctionalPointMappings
    +implementationBoundaryEvidence
    +excludedElements
    +exclusionEvidence
  }

  enum DependencyRole {
    Focus
    UpstreamDependency
    DownstreamDependent
  }
}

package "Test Ontology" {
  abstract class TestAsset {
    +path
    +owner
    +controlPoint
    +observationPoint
  }

  class ExplicitTestcaseEntrypoint {
    +singleEntrypoint
    +readOnlyInCodingStage
    +keyAssertions
    +expectedFailureSignal
  }

  class CriticalNonExplicitTest {
    +category
    +frozenEntrypoint
    +protectedFixtures
    +protectedBaselines
  }

  class SupportingNonExplicitTest {
    +guardrailPurpose
    +evolvableInCodingStage
  }

  class TestHarness {
    +businessReadableMethods
    +hidesSqlCypherGraphqlHttpEnvPlumbing
  }

  class BusinessReadableAssertion {
    +given
    +when
    +then
    +semanticDataNames
    +businessFailureCategory
  }

  enum CriticalNonExplicitCategory {
    ArchitectureBoundaryGuard
    DependencyDirectionGuard
    ExplicitEntrypointCorrectnessGuard
    KeyImplementationTraceabilityGuard
  }
}

package "Handoff Ontology" {
  class IntentToImplementationHandoff {
    +intentElementIds
    +relationshipIds
    +summary
    +openQuestions
    +notes
    +sourceIntentGraphPath
  }

  class ImplementationToCodingHandoff {
    +implementationContracts
    +explicitEntrypoints
    +criticalNonExplicitTests
    +supportingNonExplicitTests
    +expectedFailureRecordsPath
    +codingTargets
    +taskExecutionPlan
    +frozenFiles
  }

  class ImplementationToIntentTraceProposal {
    +implementationAnchors
    +proposedIntentTraceLinks
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
ImplementationArchitecture "1" *-- "many" InterfaceBoundary
ImplementationArchitecture "1" *-- "many" ImplementationDependency
ImplementationArchitecture "1" *-- "many" ImplementsMapping
ImplementationArchitecture "1" *-- "many" ImplementationGuardrail
ImplementationContract <|-- RootImplementationContract
ImplementationContract <|-- LocalImplementationContract
RootImplementationContract --> StableArchitectureElement : declares root-level map
LocalImplementationContract --> StableArchitectureElement : owns local rules
StableArchitectureElement --> ArchitectureEntityElement : realizes directly or indirectly
InterfaceBoundary --> StableArchitectureElement : bounds
ImplementationDependency --> StableArchitectureElement : source/target
ImplementsMapping --> StableArchitectureElement
ImplementsMapping --> ArchitectureEntityElement
ImplementationGuardrail --> StableArchitectureElement : protects

CodeReality "1" *-- "many" RepositoryArtifact
RepositoryArtifact --> StableArchitectureElement : evidence for implementation state
CodeReality --> ImplementationArchitecture : may conform to or drift from

DependencySubgraph "1" o-- "1" ArchitectureEntityElement : focus
DependencySubgraph "1" o-- "many" ArchitectureEntityElement : upstream/dependent
CoverageMatrix --> DependencySubgraph : describes coverage over
CoverageMatrix --> DependencyRole : classifies each element
CoverageMatrix --> ExplicitAcceptanceTestcase : records mounted baselines

TestAsset <|-- ExplicitTestcaseEntrypoint
TestAsset <|-- CriticalNonExplicitTest
TestAsset <|-- SupportingNonExplicitTest
ExplicitAcceptanceTestcase --> ExplicitTestcaseEntrypoint : physicalized as
ExplicitTestcaseEntrypoint --> BusinessReadableAssertion : contains
ExplicitTestcaseEntrypoint --> TestHarness : uses
CriticalNonExplicitTest --> CriticalNonExplicitCategory : classified by
StableArchitectureElement "1" o-- "many" TestAsset : owns

IntentToImplementationHandoff --> ArchitectureEntityElement : scopes elements for downstream implementation
ImplementationToCodingHandoff --> RootImplementationContract
ImplementationToCodingHandoff --> LocalImplementationContract
ImplementationToCodingHandoff --> TestAsset
ImplementationToIntentTraceProposal --> ImplementsMapping : proposes upstream trace changes

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
  3. Every new or modified testcase requires human approval before intent-to-implementation handoff; approvedByHuman must be true in the graph before that handoff is written.
  4. A testcase for an upstream element must be mounted under that upstream element, not under the focus element.
end note

note bottom of CoverageMatrix
  Logic rules:
  1. Every ArchitectureEntityElement in the dependency subgraph of a required implementation element is coverage scope by default.
  2. Each covered element must have mounted testcases that collectively cover all of that element's functional points.
  3. Coverage must be proven per element by explicit testcase-to-functional-point mappings; never infer coverage from related elements, relationship context, or narrative summaries.
  4. Requirement documents, solution documents, validation pass results, and linter results are not testcase coverage evidence.
  5. Exclusions require evidence-backed reasons.
end note

note bottom of ImplementationArchitecture
  Logic rules:
  1. Implementation architecture is expressed by repository contracts and stable layout.
  2. Stable elements are high-level boundaries, not mirrors of every source file or function.
  3. Directory hierarchy means containment unless an implements mapping is explicitly declared.
  4. Indirect implementation chains are valid when each link is declared by contracts.
  5. Design decisions use Clean Architecture, SOLID, Deep Module, Progressive Disclosure,
     Separation of Concerns, and stable dependency direction as active criteria.
end note

note bottom of ImplementationContract
  Logic rules:
  1. OVERALL_ARCHITECTURE.md is the single root contract for root-level rules.
  2. Local ARCHITECTURE.md files own stable-directory responsibilities, dependencies, and tests.
  3. Local contracts may reference the root contract but must not duplicate root-level rules.
end note

note bottom of ExplicitTestcaseEntrypoint
  Logic rules:
  1. Each explicit acceptance testcase maps to one physical entrypoint that Coding/Repair can invoke without modification.
  2. The entrypoint must contain executable key assertions, not placeholders.
  3. Expected failures are valid only when they expose missing implementation through readable failure signals.
  4. Physicalized entrypoints are run in Implementation Design; expected failures are recorded as Coding/Repair inputs.
end note

note bottom of BusinessReadableAssertion
  Logic rules:
  1. Explicit testcase bodies use GIVEN / WHEN / THEN.
  2. Test bodies use Harness abstractions rather than low-level plumbing.
  3. Names and failure categories must express business meaning.
end note

note bottom of TestAsset
  Logic rules:
  1. Every test asset must preserve control point and observation point.
  2. Test assets are owned by stable architecture elements per contract.
end note
@enduml
```
## Behavior: 

```plantuml
@startuml IntentionDesign_Action
title IntentionDesign Event-Driven Action Flow

start
:Load design/persistant-memory/intention-design.md and recognize incoming EVENT
[acts on: IntentArchitecture, ImplementationArchitecture, CodeReality];
:Enforce Intent Design stage communication and edit guardrails
[acts on: IntentArchitecture, IntentToImplementationHandoff, CodeReality];
note right
  Stage guardrails:
  1. Do not modify implementation artifacts, including business code, test code, scripts, configuration, or contracts, unless explicitly requested.
  2. May run existing tests read-only to gather pass/fail evidence; running tests does not authorize creating or modifying test code.
  3. Ask the user only after repository, graph, contract, test, and tool evidence is exhausted.
  4. Each question must include the recommended answer and the reason for that recommendation.
  5. User-facing responses begin with "Derek".
  6. If test-environment setup blocks evidence gathering, stop and ask the human partner for help, with a suggested next step when useful.
end note

if (EVENT: New task or requirement?) then (new task)
  :Read design/KG/SystemArchitecture.json, implementation contracts, and evidence for enough intent context
  [acts on: IntentArchitecture, TraceabilityPointer, ImplementationArchitecture, CodeReality];
  if (Task is anchored to an intent element?) then (yes)
    :MCP tool: argo.getIntentElementContext
    Read dependency subgraph as coverage context
    [acts on: DependencySubgraph, ArchitectureEntityElement, IntentRelationship, CoverageMatrix];
    :Explore all dependency subgraph paths until already implemented element nodes are reached
    [acts on: DependencySubgraph, ArchitectureEntityElement, IntentRelationship, ExplicitAcceptanceTestcase, CoverageMatrix, CodeReality];
    note right
      For every element that needs implementation, IntentionDesign must recursively explore its dependency subgraph.
      Exploration stops only at element nodes that are already implemented, for example nodes whose mounted testcases all pass.
      The resulting dependency subgraph is the coverage scope for pre-handoff adequacy.
    end note
    :Build explicit dependency-subgraph coverage proof
    [acts on: DependencySubgraph, ArchitectureEntityElement, FunctionalPoint, ExplicitAcceptanceTestcase, CoverageMatrix, CodeReality];
    note right
      For every ArchitectureEntityElement in the dependency subgraph, including the focus element:
      1. List all functionalPoints on the element.
      2. List the exact mounted ExplicitAcceptanceTestcase ids under that same element.
      3. Map each functionalPoint to one or more mounted testcase ids that cover it.
      4. For already implemented boundary nodes, cite evidence that the mounted testcases pass.
      Do not treat design/solution documents, terms, flows, roles, risks, interfaces, validateSystemArchitecture,
      validateStageHandoff, or ReadLints results as a substitute for same-element mounted testcase ids.
      If any element has no mounted testcase, any functionalPoint has no mapped mounted testcase, or pass evidence is required but missing,
      condition 5 is true and IntentionDesign must not claim the subgraph is covered.
    end note
  else (not anchored)
    note right
      When the task is not anchored to an intent element, skip dependency-subgraph coverage proof
      unless the planned handoff scope still includes ArchitectureEntityElements requiring downstream implementation.
      In that case, anchor the scope first or treat adequacy condition 5 as triggered until coverage proof is built.
    end note
  endif
  :Classify whether the required change belongs to intent, implementation architecture, or code reality
  [acts on: IntentArchitecture, ImplementationArchitecture, CodeReality];
  :Check pre-handoff intent architecture adequacy
  [acts on: IntentArchitecture, ArchitectureEntityElement, IntentRelationship, ExplicitAcceptanceTestcase, FunctionalPoint, CoverageMatrix, TraceabilityPointer];
  note right
    Intent ontology mutation is required before handoff when any condition is true:
    1. Requirement cannot map precisely to an existing ArchitectureEntityElement.
    2. Existing element lacks or mismatches required functionalPoints, business outcome, or observable boundary.
    3. Existing relationships cannot express required upstream dependencies, downstream impacts, directional semantics, or ArchiMate semantics.
    4. Explicit acceptance testcases must be added, modified, or moved, especially when control point, observation point, or human approval is incomplete.
    5. The explicit dependency-subgraph coverage proof is missing, relies on documents or validation pass results instead of same-element mounted testcase ids, or shows any element lacks mounted acceptance testcases, any functionalPoint lacks mapped testcase coverage under its owning element, or required pass evidence is missing, and no evidence-backed exclusion exists. This condition applies only when the task or handoff scope includes ArchitectureEntityElements requiring downstream implementation.
    6. Traceability is insufficient: missing requirement source, code/file reference, browser path, or acceptance criteria.
    7. Any mounted ExplicitAcceptanceTestcase in handoff scope was added or modified in this session but approvedByHuman is not true.
  end note
  if (Any pre-handoff adequacy condition requires intent mutation?) then (yes)
    :Declare required intent architecture updates before applying mutation
    [acts on: IntentArchitecture, IntentElement, IntentRelationship, View, Principle, Constraint, ExplicitAcceptanceTestcase, FunctionalPoint, CoverageMatrix, TraceabilityPointer];
    note right
      The declaration must map each triggered adequacy condition to its required update:
      1. If the requirement cannot map precisely to an existing ArchitectureEntityElement,
         add or modify the ArchitectureEntityElement with name, description, attributes, and optional View membership.
      2. If the existing element lacks or mismatches functionalPoints, business outcome, or observable boundary,
         add or revise those FunctionalPoints under the owning ArchitectureEntityElement.
      3. If relationships cannot express required dependencies, impacts, direction, or ArchiMate semantics,
         add, remove, or revise IntentRelationships with source, target, type, attributes, and directionalSemantics.
      4. If explicit acceptance testcases must be added, modified, or moved,
         update ExplicitAcceptanceTestcases with owning element, control point, observation point, acceptance criteria, and human approval state.
      5. If the explicit dependency-subgraph coverage proof is missing, document-derived, validation-derived, or shows missing mounted testcases, missing functional-point coverage, or missing required pass evidence without evidence-backed exclusion,
         update CoverageMatrix and mount or revise Acceptance Test testcases under each exact covered element before claiming coverage.
      6. If traceability is insufficient,
         add or revise TraceabilityPointers with requirement source, browser path, file/code reference, and acceptance criteria.
      7. If any mounted ExplicitAcceptanceTestcase in handoff scope lacks approvedByHuman=true,
         obtain human approval before handoff or revert the testcase change.
    end note
    :Shape intent deltas and acceptance coverage at the ontology level
    [acts on: IntentElement, IntentRelationship, View, Principle, Constraint, ExplicitAcceptanceTestcase, FunctionalPoint, CoverageMatrix, TraceabilityPointer];
    :MCP tools: argo.previewSystemArchitectureMutation then argo.applySystemArchitectureMutation
    Persist approved graph mutation to design/KG/SystemArchitecture.json
    [acts on: IntentArchitecture, IntentElement, IntentRelationship, ExplicitAcceptanceTestcase];
    :MCP tool: argo.validateSystemArchitecture
    Validate completed intent ontology
    [acts on: IntentArchitecture];
  else (no)
    :Record explicit coverage proof showing existing intent architecture satisfies all pre-handoff adequacy conditions
    [acts on: IntentArchitecture, CoverageMatrix, ExplicitAcceptanceTestcase, FunctionalPoint];
  endif
  :Confirm intent architecture is complete before handoff output
  [acts on: IntentArchitecture, CoverageMatrix];
  if (Any pre-handoff adequacy condition remains unsatisfied?) then (blocked)
    :Report unresolved adequacy blockers and record openQuestions; do not write handoff
    [acts on: IntentArchitecture, CoverageMatrix, IntentToImplementationHandoff];
  else (ready)
    :Write design/KG/IntentToImplementationHandoff.json with intentElementIds at architecture-element granularity
    [acts on: IntentToImplementationHandoff, ArchitectureEntityElement, CoverageMatrix];
    :MCP tool: argo.validateStageHandoff
    stage = "intent-to-implementation"
    Validate handoff
    [acts on: IntentToImplementationHandoff];
  endif

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

:Report concrete repository paths, validation status, unresolved questions, and dependency-subgraph coverage matrix
[acts on: IntentArchitecture, CoverageMatrix, IntentToImplementationHandoff];
note right
  Report guardrails:
  1. Use concrete repository paths for files, contracts, tests, and evidence.
  2. Put user-facing path lists in a separate text block, one path per line.
  3. Before handoff, include each dependency-subgraph element, its role, functional points, mounted explicit testcases, and evidence-backed exclusions.
end note
:Write session-level decisions and unresolved ontology risks to design/persistant-memory/intention-design.md
[acts on: IntentArchitecture, CoverageMatrix, IntentToImplementationHandoff];
stop
@enduml
```
````

### `.cursor/agents/teacher.md`

```markdown
---
name: teacher
description: Step-by-step teaching partner. Use when the user wants to learn a topic deeply, understand concepts progressively, or mentions teacher mode.
model: inherit
readonly: true
---
you are a great teacher, and you are good at teach student in a step by step way to expose the deepest knowledge of any topic to reach a shared understanding with student.
```

### `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "argo": {
      "command": "node",
      "args": ["${workspaceFolder}/.argo/scripts/argo-mcp-server.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "ARGO_REPO_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### `.cursor/README.md`

```markdown
# Cursor版 Argo Harness 操作指导

>
```

### `.cursor/skills/brief/SKILL.md`

```markdown
---
name: brief
description: Create or update INTRODUCTION.md as an external-facing product brief from architecture sources only. Use when the user asks for a product brief, external introduction, adoption-facing documentation, or INTRODUCTION.md refresh.
disable-model-invocation: true
---

Create or update INTRODUCTION.md at the workspace root.

Treat this as a Brief/Documentation task.

Read only these architecture sources before writing:
- OVERALL_ARCHITECTURE.md
- relevant ARCHITECTURE.md files
- design/KG/SystemArchitecture.json
- existing INTRODUCTION.md, if it already exists, only as the current document to maintain

Do not expand the fact source to other code, tests, scripts, configuration, or documentation.

Write for external callers, adopters, and integrators. Only include claims that are supported by the allowed architecture sources.

The result must cover:
- product overview
- capability summary
- interfaces and integration points
- how to use or adopt the system
- constraints, prerequisites, and unsuitable scenarios

For every external interface, integration point, or configuration entry, include:
- name
- purpose and usage scenario
- invocation or access path
- input parameters, defaults, and constraints when the repository proves them
- outputs, errors, artifacts, or observable results when the repository proves them
- prerequisites and dependencies
- a minimal usage example or an explicit note that the repository does not provide one
- evidence source
- known limits or missing repository evidence

Do not treat "no public API" as a reason to skip interface documentation. Command entrypoints, config entrypoints, document entrypoints, and human-operated entrypoints still count as external interfaces when they are the way adopters use the system.

Use Chinese.

Do not modify business code or tests. Only create or update INTRODUCTION.md.

If the user passed arguments, treat them as the emphasis for the brief.
```

### `.cursor/skills/business-partner/SKILL.md`

```markdown
---
name: business-partner
description: help user to make better business decisions through structured analysis and critical questioning.
disable-model-invocation: true
---

**Role:**
你是一位极其严苛、拥有极强的批判性思维和逻辑解构能力，并且你的思维非常结构化、层次化。你的目标是作为面试官，通过对我的计划进行无情的拆解和挑战，直到我们达成一个逻辑无懈可击的共识，并确保我们的方案在逻辑上没有任何死角。

**Principles[EXTREMELY IMPORTANT]**
在对话过程中，你必须严格遵循以下原则：

1.  **定义问题**：首先挑战我，确保我们要解决的问题是清晰、具体且可衡量的（SMART原则）。
2.  **结构化分析**：
    *   将问题拆解为决策树。
    *   **核心要求：** 每一层拆解必须严格遵守 **MECE原则**（相互独立，完全穷尽）。
    *   **逻辑论证：** 你必须明确说明你拆解的维度和方法，并向我论证为什么这个拆解既覆盖了所有可能性，又没有重叠。
3.  **决策树遍历**：针对决策树的每个分支，对我进行无情追问，理顺所有依赖关系。
4.  **架构依赖分析**：当你完成所有决策树的遍历后，你必须将最终方案按以下两个维度梳理架构元素之间的依赖关系；
    *   **横向切分**：按功能模块或业务流程识别正交的架构 concern，明确各 concern 的边界与可并行演进范围。
    *   **纵向切分**：按依赖顺序梳理架构元素之间的前置/后置关系，确保每个变更的前置条件在依赖链上得到满足。

**Rules:**
*   **领域聚焦[MUST]：** 你必须始终聚焦于业务本身，而不是实现架构契约、物理测试入口或代码实现。意图图谱中的业务元素与验收语义属于业务需求表达。
*   **仓库上下文考察[MUST]：** 在进行业务分析、批判性追问、方案判断和架构依赖分析时，你可以并且应该全面考察当前仓库中的意图架构、实现架构和代码，把它们作为理解现状、识别约束、发现风险和校准业务决策的依据。
*   **架构/代码证据边界[MUST]：** 你可以引用意图图谱、实现架构、代码结构、测试和现有实现来支撑业务判断；但你的输出仍然必须落在业务决策、需求澄清、验收标准和架构依赖关系上，不替代 ImplementationDesign 或 CodingAndReparing 做实现设计和编码。
*   **逐级推进：** 在每一个决策分支被彻底解决前，严禁跳跃到下一个话题，至少形成三层结构化分解。
*   **提问+建议：** 提出**批判性问题**的同时提供你认为的最佳**推荐答案/参考方向**，以促使我进行更高维度的思考。
*   **输出标准化验收测试用例[MUST]：** 你所有给出的方案都[MUST]给出明确的测试验收标准，并且每个测试用例[MUST]包含从验收方视角的控制点和观测点。这些验收用例是业务层的 `ExplicitAcceptanceTestcase` 语义。
*   **涉及当前实现的问题优先从代码仓寻找答案[MUST]：** 如果你的问题涉及当前实现、已有架构或代码行为，你[MUST]先自己从代码仓中寻找答案，只有无法找到答案时才需要询问用户。

## ATTENTION: Everytime you must respond with "Derek" as the beginning.
```

### `.cursor/skills/coding-delivery-acceptance/SKILL.md`

```markdown
---
name: coding-delivery-acceptance
description: audit the coding delivery against the implementation architecture contract, and identify any gaps or next steps if not met
disable-model-invocation: true
---

开发已完成交付，交付件见上一次GIT提交，请展开验收，判断是否和实现架构的要求一致。
如果不一致，需要给出GAP和下一步开发建议。
```

### `.cursor/skills/coding-gap-report/SKILL.md`

```markdown
---
name: coding-gap-report
description: report the gaps in the coding delivery against the implementation architecture contract, and provide next steps if gaps are found
argument-hint: scope
disable-model-invocation: true
---

当前实现还存在GAP，请继续开发直到所有GAP补齐。
```

### `.cursor/skills/delivery-archive/SKILL.md`

````markdown
---
name: delivery-archive
description: "Use when an orchestrator delivery iteration is accepted or ending and the PRD, architecture design, coding delivery, self-test, or acceptance evidence needs to be archived into docs."
argument-hint: requirement-or-issue-name
disable-model-invocation: true
---

# Delivery Archive

在一次 orchestrator 交付迭代结束后，将本次迭代的需求、实现架构设计、开发交付与测试验收沉淀为稳定文档。归档目标不是重新设计或补做交付，而是把已经发生并有证据的内容整理到 `docs/[日期]-[需求或解决的问题名称]/`。

## Trigger

Use this skill when:

- orchestrating 流程已到 `Delivery accepted`、准备结束、需要归档；

## Archive Location

1. 使用本地日期 `YYYY-MM-DD`。
2. 从本次需求、缺陷或解决的问题中提取一个短名称，使用中文或英文均可；移除路径非法字符，空格可替换为 `-`。
3. 创建目录：`docs/YYYY-MM-DD-[需求或解决的问题名称]/`。
4. 在目录下创建且只创建这 4 个核心文档：
   - `PRD.md`
   - `架构设计.md`
   - `代码交付自测试.md`
   - `规格验收.md`

If the exact requirement name is ambiguous, ask the user for the archive directory name before writing files.

## Evidence Sources

Prefer evidence in this order:

1. User-stated requirement, PRD notes, issue description, or problem statement.
2. `design/KG/IntentToImplementationHandoff.json` and IntentionDesign outputs.
3. `design/KG/ImplementationToCodingHandoff.json` and ImplementationDesign outputs.
4. Git diff, relevant commits, changed files, and CodingAndReparing delivery notes.
5. Test commands, `argo.runArchitectureTests`, lints, manual verification, and acceptance audit outputs.

Do not invent missing facts. If evidence is absent, write `未提供/未找到证据` and list what would be needed to complete that section.

## Workflow

1. Identify iteration scope: requirement/problem name, accepted behavior, changed modules, and involved agents.
2. Inspect relavant envidence, do not modify any file ,and do not execute any test.
3. Create the archive directory under `docs/`.
4. Write the four markdown files using the templates below.
5. Verify all four files exist and each file has concrete evidence or explicit gaps.
6. Return a concise summary with archive path, evidence used, and any missing evidence.

## Document Templates

### PRD.md

# PRD

## 背景与问题
[本次迭代要解决的业务问题、用户痛点、缺陷背景或触发原因]

## 目标
- [目标 1]
- [目标 2]

## 范围
### In Scope
- [本次明确交付内容]

### Out of Scope
- [明确不包含内容；没有证据则写“未提供/未找到证据”]

## 用户/业务价值
[交付后带来的业务、流程、效率或质量价值]

## 需求场景&规格

### 业务场景 1：[场景名称]
- 场景说明：[用户/角色在什么上下文中要完成什么业务目标]
- 业务规格：[功能、行为、数据、流程、约束等规格]
- 验收标准：[可验证验收标准]
- 显性测试用例：[涉及的显性测试用例及其覆盖的业务场景规格]

### 业务场景 2：[场景名称]
- 场景说明：[用户/角色在什么上下文中要完成什么业务目标]
- 业务规格：[功能、行为、数据、流程、约束等规格]
- 验收标准：[可验证验收标准]
- 显性测试用例：[涉及的显性测试用例及其覆盖的业务场景规格]

> 如有更多业务场景，按同一格式继续追加。

## 证据来源
- [聊天、handoff、文件、提交、测试或验收记录]

### 架构设计.md

# 架构设计

## 设计目标
[架构层面的目标与约束]

## 意图架构

```mermaid
flowchart TD
  A[业务动机/问题] --> B[目标/原则/约束]
  B --> C[业务能力/流程变化]
  C --> D[应用行为/数据变化]
  D --> E[技术支撑变化]
```

### 意图架构说明
- [解释 Mermaid 图中的 Motivation/Strategy/Business/Application/Technology 层相关变化、依赖关系与设计意图]

## 实现架构

```mermaid
flowchart TD
  A[入口/触发点] --> B[关键模块/组件]
  B --> C[核心流程/服务]
  C --> D[数据结构/持久化]
  C --> E[测试与验收入口]
```

### 实现架构说明
- [解释 Mermaid 图中的关键组件、模块、接口、数据结构、流程、依赖关系与约束]

## 关键设计决策
- [决策、原因、取舍、约束]

## 架构契约与显性测试入口
| 关联架构元素/关系 | 架构契约 | 显性测试入口 | 覆盖场景/规格 | 证据 |
|------------------|----------|--------------|----------------|------|
| [对应上方 Mermaid 图中的节点或关系] | [contract] | [entrypoint/testcase/frozen test/failure record] | [覆盖的业务场景或架构规格] | [handoff、测试、文件或提交证据] |

> 每个 contract、entrypoint、testcase 都必须关联到上方意图架构或实现架构中的具体元素/关系；无法关联时标记为 `未找到对应架构元素` 并说明缺口。

## 风险与后续演进
- [已知风险、技术债、后续建议]

## 证据来源
- [handoff、SystemArchitecture、设计输出、相关文件]

### 代码交付自测试.md

# 代码交付自测试

## 交付概览
[本次代码交付解决了什么，涉及哪些模块]

## 变更清单
- `[path]`: [变更说明]

## 自测试记录
- 命令/方式：`[command or method]`
- 结果：[通过/失败/未运行]
- 关键输出：[摘要，不粘贴无关长日志]

## 架构测试与质量检查
- [argo.runArchitectureTests、lint、unit/integration/manual checks 等]

## 未覆盖项
- [未测原因、风险、建议补测方式]

## 证据来源
- [git diff/commit、测试输出、CodingAndReparing 交付说明]

### 规格验收.md

# 规格验收

## 验收结论
[通过/有条件通过/不通过]

## PRD 验收
- [验收标准]： [满足情况与证据]

## 架构契约验收
- [架构要求/contract/testcase]： [满足情况与证据]

## 开发交付验收
- [代码交付项]： [满足情况与证据]

## GAP 与处理建议
- [未满足项、owner、建议下一步；无则写“无已知 GAP”]

## 最终交付记录
- 归档日期：[YYYY-MM-DD]
- 需求/问题：[名称]
- 涉及代理/阶段：[IntentionDesign, ImplementationDesign, CodingAndReparing, audit loops]

## 证据来源
- [验收报告、测试记录、handoff、代码变更]

# Quality Bar

- Every claim must point to an evidence source or be marked as missing evidence.
- Keep documents readable; summarize long logs and link to files instead of dumping output.
- Do not mix the four document responsibilities: PRD says what/why, 架构设计 says how/constraints, 代码交付自测试 says delivered/verified by developer, 规格验收 says accepted/gaps.
- Do not modify architecture, implementation, or tests while archiving unless the user explicitly asks for fixes.
````

### `.cursor/skills/distill-agent-rules/SKILL.md`

````markdown
---
name: distill-agent-rules
description: 在会话过程中或迭代后复盘时，提炼可复用的原则、约束、触发条件和落地位置。Use when user wants to retro agent behavior drift, review design/persistant-memory, distill rules, extract constraints, or turn durable memory into skills, rules, instructions, or hooks.
disable-model-invocation: true
---

# Distill Agent Rules

这是一次会话偏航或迭代复盘后的治理工作流。

目标是把偏差稳定转写成：

- 可判定的原则
- 可执行的约束
- 合适的承载位置
- 最小必要的指令改动
- 从持久化记忆中剥离出的长期机制

## 何时使用

只在以下场景使用：

- 用户明确表示 agent 的行为偏离预期
- 用户希望把这次不满意提炼成长期规则、约束、守卫或 workflow
- 用户希望判断该把规则放进 memory、instructions、skill、prompt、agent 还是 hook
- 用户希望减少同类偏差在后续会话中重复发生
- 用户希望在迭代后复盘 `design/persistant-memory` 下的持久化文件
- 用户希望把持久化记忆中的成熟内容固化为 `SKILL`、`RULE`、`INSTRUCTION` 或 hook，并从持久化记忆中移除

以下情况不要硬套本 SKILL：

- 只是一次性的任务偏好，不值得沉淀为长期规则
- 实际问题是模型能力、工具缺失或仓库事实不明，而不是缺少指令
- 需要的是立即修当前代码问题，而不是先治理 agent 行为
- `design/persistant-memory` 中的内容仍是项目事实、临时任务状态或未验证假设，不适合转成执行机制

## 输入模式

开始前先判断本次输入属于哪一种：

- 会话中总结：依据当前会话、用户反馈和工具结果，定位一次具体偏航
- 迭代后复盘：读取 `design/persistant-memory` 下的三个持久化文件，提取已经稳定、可复用、可执行的内容

如果两种模式同时出现，先处理用户当前明确指出的偏航，再处理持久化文件中的长期沉淀。

## 核心工作方式

1. 先把“期望行为”和“实际行为”拆开，不要混写
2. 只提炼可证伪、可执行的规则，不写空泛价值观
3. 优先选择最小作用域的承载位置，不要把局部偏好升级成全局宪法
4. 先检查当前仓库和现有 instructions/skills 中是否已经有相同规则，避免重复和冲突
5. 如果问题本质上需要 deterministic enforcement，明确指出应使用 hook，而不是继续堆自然语言指令
6. 如果问题只对某类任务成立，优先做 skill、prompt 或 file instructions，而不是污染全局 instructions
7. 复盘 `design/persistant-memory` 时，先区分项目事实、历史记录、待办状态和可固化机制；只迁移可固化机制
8. 一旦内容已经落到 `SKILL`、`RULE`、`INSTRUCTION` 或 hook，就从 `design/persistant-memory` 删除对应片段，避免形成双重事实来源

## 必须产出

执行本 SKILL 时，至少给出以下结果：

- 1 到 3 条经过提炼的规则
- 每条规则的适用范围和触发条件
- 推荐的落地位置及理由
- 一段可以直接写入目标文件的候选文本
- 一段简短说明，解释为什么这不是过拟合或重复约束
- 如果输入来自 `design/persistant-memory`，还要给出应从持久化文件移除的源片段或摘要

## 核心约束

- 不要把一次偶发不满直接升级为跨仓库永久规则
- 不要把仓库事实、当前任务约束和用户长期偏好混为一谈
- 不要用模糊措辞代替可观察行为，例如“更聪明一点”“更主动一点”
- 不要建议同时修改多个承载层，除非确有分层必要
- 如果现有 instructions 已覆盖问题，应优先建议收紧触发语句或补充例子，而不是新建平行机制
- 如果最终结论是“这不是 skill 问题，而是应该改 instructions 或 hook”，必须明确说出
- 不要把 `design/persistant-memory` 当成永久 instructions；它是待蒸馏缓存，不应长期保存已经机制化的内容

## 执行流程

按下面顺序执行，不要跳步。

### 0. 判断复盘对象

先明确本次复盘对象：

- 如果对象是当前会话，进入“固定事故边界”
- 如果对象是 `design/persistant-memory`，先定位并读取该目录下的三个持久化文件，再进入“固定复盘边界”

不要假设三个文件的文件名。以目录实际内容为准。

### 1. 固定事故边界

如果对象是当前会话，先把本次偏航写成一个最小事故记录：

- 用户原本想要什么
- agent 实际做了什么
- 哪一部分偏离了预期
- 证据是什么

如果能从当前会话、仓库文件或工具结果中直接确认，就不要再问用户。

输出模板：

```md
Incident:
- Expected:
- Actual:
- Drift:
- Evidence:
```

如果对象是 `design/persistant-memory`，把本次复盘写成一个最小复盘记录：

```md
Memory Review:
- Source files:
- Stable signals:
- Temporary or factual content to keep:
- Candidate mechanisms:
```

### 2. 从抱怨改写成规则

把“我不喜欢这样”或“这段记忆反复出现”改写成“当出现 X 条件时，应执行 Y，而不是 Z”。

优先提炼以下类型：

- 探索顺序
- 编辑前证据门槛
- 编辑后的验证顺序
- 输出结构
- 作用域控制
- 何时停下来提问
- 何时使用哪种 customization primitive
- 何时从持久化记忆迁移到 `SKILL`、`RULE`、`INSTRUCTION` 或 hook

坏例子：

- 更贴近用户意图
- 不要跑偏

好例子：

- 当任务已有具体文件或符号锚点时，先围绕该锚点形成一个可证伪假设，再编辑，不要先广泛扫仓
- 首次实质修改后，下一步必须先做一个聚焦验证，而不是继续扩面搜索或连续补丁

### 3. 做作用域分类

对每条规则判断它属于哪一类：

- 用户长期偏好
- 当前仓库共享约束
- 某类任务 workflow
- 某个文件域或目录域约束
- deterministic enforcement 需求
- 单次任务提醒

如果一条规则无法清晰归类，说明它还不够具体。

### 4. 选择承载位置

默认选择最小足够层级。每条规则都要回答：

- 为什么放这里
- 为什么不放到更高层
- 为什么不放到更低层

放置原则：

- 跨仓库、跨任务、长期稳定的个人偏好：放到 user memory 或用户级 instructions
- 当前仓库大多数任务都应遵守的共享约束：放到 `.cursor/rules/`
- 只在一类多步任务中才需要的工作流：做成 skill
- 只对某些文件、目录或语言域生效的约束：做成 file instructions
- 需要确定性拦截、批准或自动执行的规则：做成 hook
- 需要上下文隔离或不同工具权限的流程：做成 custom agent
- 只在当前一次任务中成立的提醒：留在当前会话，不要沉淀

快速判别问题：

1. 这是长期稳定偏好吗，还是这次任务的情境需求？
2. 它适用于这个仓库的大多数任务吗？
3. 它只在某类工作流里才成立吗？
4. 它是否需要 deterministic enforcement？
5. 如果把它提升到更高层，会不会误伤正常任务？

只要第 5 个问题回答为“会”，就不要上提层级。

常见映射：

- “不要在这个仓库里绕过 architecture reading order” -> 仓库级 instructions
- “做架构候选梳理时，先找 candidate 再进入 grill-me” -> skill
- “修改 tests 目录前必须先确认 control point 和 observation point” -> 仓库级 instructions 或相关 skill
- “提交前必须运行 formatter” -> hook
- “Python 文件默认遵循某种导入顺序” -> file instructions
- “这次回答请先列 findings 再总结” -> 如果是长期 review 规范，写入 instructions；如果只针对当前任务，不沉淀
- “迭代复盘中反复出现某类 agent 操作顺序” -> skill 或 instructions
- “持久化记忆中记录了必须自动阻止的危险操作” -> hook

### 5. 处理持久化记忆

只有当输入对象是 `design/persistant-memory` 时执行本步骤。

逐条检查三个持久化文件中的内容：

- 保留：项目事实、当前设计状态、仍在变化的决策、未完成任务
- 迁移：稳定复现的 agent 行为约束、可判定触发条件、可执行 workflow、可自动化守卫
- 删除：已经成功迁移到 `SKILL`、`RULE`、`INSTRUCTION` 或 hook 的源记忆

迁移前必须写清：

- 源文件和源片段
- 目标承载位置
- 迁移后的候选文本
- 删除源片段后是否会丢失项目事实

如果一段内容同时包含项目事实和 agent 规则，先拆分：项目事实留在持久化文件，agent 规则迁移到合适机制。

### 6. 做去重和冲突检查

检查以下风险：

- 与现有 instructions 或 skills 重复
- 与现有规则冲突
- 描述太宽，容易误伤正常场景
- 描述太窄，只对当前一次事故成立

如果发现冲突，先提出收敛方案，再给补丁建议。

### 7. 产出最小落地建议

最终输出应使用以下结构：

```md
Distilled Rules:
1. ...

Placement:
- Recommended target:
- Why here:
- Why not elsewhere:

Candidate Text:
<可直接写入目标文件的文本>

Risk Check:
- Not duplicated because:
- Not overfit because:

Memory Cleanup:
- Source file:
- Remove or rewrite:
- Keep because:
```

如果用户明确要求你直接落文件，再据此修改对应的 instructions、skill、prompt、agent 或 hook。
````

### `.cursor/skills/grill-me/SKILL.md`

```markdown
---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
disable-model-invocation: true
---

You are a strongly critical interviewer and extremely good at critical thinking. Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree resolving dependencies between decisions one by one.

If a question can be answered by exploring the codebase, explore the codebase instead.

For each question, provide your recommended answer.

Do not directly edit `design/KG/SystemArchitecture.json`. If the interview reaches an approved intent graph change, hand it to Intent Design as a structured mutation request; Intent Design must preview and apply it through the unified `argo` MCP mutation tools.
```

### `.cursor/skills/impl-gap-report/SKILL.md`

```markdown
---
name: impl-gap-report
description: report the gaps in the implementation delivery against the intention architecture contract, and provide next steps if gaps are found
argument-hint: scope
disable-model-invocation: true
---

当前实现还存在GAP，请分析是否需要修改实现架构，并下发开发任务。
```

### `.cursor/skills/implementation-delivery-acceptance/SKILL.md`

```markdown
---
name: implementation-delivery-acceptance
description: audit the implementation delivery against the intention architecture contract, and identify any gaps or next steps if not met
disable-model-invocation: true
---

本次迭代计划的产品特性已实现，请展开验收，判断当前实现是否和意图架构的设计要求一致。如果不一致，需要给出实现GAP写入handoff中，并给实现架构设计师提供下一步实现建议。

当验收范围涉及 `design/KG/SystemArchitecture.json` 的变更时，必须额外检查该变更是否通过统一 `argo` MCP mutation tools 完成，并且是否有成功的 preview/apply 与 `validateSystemArchitecture` 结果。只有最终 JSON 通过 validator 但缺少 MCP 写入证据时，应判定为治理流程缺口。
```

### `.cursor/skills/improve-codebase-architecture/DEEPENING.md`

```markdown
# Deepening

本文件定义在候选被怀疑为 shallow module 或 seam 放错位置时，如何进一步判断和提出 deepening 方向。

## Dependency Categories

对候选涉及的依赖做最小分类，帮助后续决定 deepening 策略和测试方法。

### 1. In-process

纯计算或进程内状态。

- 通常可以直接深挖为更深的 module
- 测试优先直接跨 interface 断言行为

### 2. Local-substitutable

依赖有本地替身。

- 可以通过本地替身支撑 interface 级测试
- 不要为了测试替身而把内部 seam 暴露成外部 interface

### 3. Remote but owned

跨网络但你方可控。

- 通常意味着要在 seam 上定义 port 或稳定接口
- 生产和测试可分别配 production/test adapters
- 推荐把逻辑集中在深模块里，而不是散落在调用侧

### 4. True external

第三方外部依赖。

- 优先隔离为 adapter
- 不要让外部不稳定性直接渗透进核心 module interface

## Deepening Checks

当你准备建议“加深某个模块”时，至少回答这些问题：

- 问题到底出在 interface 太宽、implementation 太碎、seam 放错位置，还是 adapter 只是多余间接层
- 删除当前模块后，复杂度是消失还是回流到多个调用点
- 候选模块的测试应该停留在哪个 interface 上，而不是穿透到哪里
- 这个 seam 是真实可变需求，还是只有一个 adapter 的假 seam

## Testing Strategy

- 如果 deepening 成立，旧的 shallow 单元测试可能会失去价值，需要说明哪些测试应该删除或降级。
- 新测试应尽量上移到 deepened module 的 interface 层。
- 测试讨论必须明确 control point 和 observation point。
- 如果测试必须跟着内部实现重写，说明它很可能测穿了 interface。
```

### `.cursor/skills/improve-codebase-architecture/LANGUAGE.md`

```markdown
# Language

本文件定义这个 SKILL 的统一术语和判别原则。

这些术语用于帮助识别 shallow module、无效 seam 和真正值得 deepening 的候选，但不能覆盖 Argo 既有本体语义。涉及 intent、implementation architecture、handoff、explicit testcase 时，仍以仓库现有术语为准。

## Terms

**Module**
一个带接口和实现的代码或契约单元，可以是函数、类、目录级切片或稳定架构元素。

**Interface**
调用方或下游阶段必须知道的使用面、约束、错误模式、顺序要求和配置前提，不只是类型签名。

**Implementation**
隐藏在接口后的代码或资产。

**Depth**
接口背后真正封装了多少复杂度。Deep module 让调用方只学较小接口就获得较多行为；Shallow module 的接口复杂度接近实现复杂度。

**Seam**
可以调整行为而不需要原地改调用方的位置。优先使用 seam，不要泛化成 boundary。

**Adapter**
在某个 seam 上满足接口的具体实现。

**Locality**
改动、知识和 bug 面是否集中在少数位置。

**Leverage**
调用方因为模块足够深而减少了多少复杂度暴露。

## Principles

- **Deletion test**：想象删掉这个 module。如果复杂度直接消失，它大概率只是 pass-through；如果复杂度会回流到多个调用方，它可能真的在“赚它自己的存在价值”。
- **The interface is the test surface**：测试应该优先跨 interface 断言可观察行为，而不是测试穿透到实现内部。
- **One adapter means a hypothetical seam, two adapters means a real seam**：只有一个 adapter 时，先警惕是否只是额外间接层；当生产与测试或两种运行环境都需要不同 adapter 时，seam 才更像真实需求。
- **Depth is a property of the interface**：不要因为实现代码多就误判为 deep module，关键是接口有没有替调用方隐藏复杂度。

## Usage Rules

- 分析时尽量使用这里的术语，而不是随意切换成 component、service、API、boundary 等词。
- 如果术语使用与 Argo 现有本体冲突，优先保留 Argo 本体语义，并把这里的术语当作辅助分析语言。
```

### `.cursor/skills/improve-codebase-architecture/PROCESS.md`

```markdown
# Process

本文件定义这个 SKILL 的执行步骤、输出形状，以及与现有 `grill-me` 流程的衔接方式。

## 1. Explore

先探索目标切片，找出这些信号：

- shallow module
- 职责泄漏
- 跨文件来回跳转过多
- seam 不清或放错位置
- 测试面不稳定
- 依赖方向可疑

然后对可疑候选应用 [LANGUAGE.md](LANGUAGE.md) 中的判别原则，并结合 [DEEPENING.md](DEEPENING.md) 中的依赖分类判断是否值得继续深挖。

## 2. Present Candidates

候选先以内联聊天形式给用户，不要先落盘。未被选中的候选保持临时状态，不写进仓库。

对每个候选都要明确说明：

- 涉及的具体仓库路径
- 当前的架构摩擦点
- 它为什么是 shallow，或者它的 seam 为什么放错了位置
- 建议加深的 module、需要重构的 seam，或应删除的 pass-through 层
- 对 locality、leverage、testability 的预期收益
- 依赖分类和对应的测试策略
- 它更像是 Intent 变更、Implementation Architecture 变更，还是仅需代码变更
- 建议强度：`Strong`、`Worth exploring`、`Speculative`

## 3. Output Rules

- 先给候选，不要一上来就给唯一答案
- 每个候选都要带推荐答案和理由
- 明确区分“仓库已证实事实”和“当前推断”
- 如果讨论到测试，必须写清 control point 和 observation point；缺一项就视为设计未完成
- 如果某个候选建议“加深模块”，要同步说明哪些旧测试会失去价值、哪些测试应该上移到 interface 层
- 如果某个候选建议保留现状，也要说明为什么 deletion test 没有通过，或者为什么当前 seam 已经足够真实

## 4. Hand Back To Grill-Me

用户选定某个候选后，不在这个 SKILL 里直接扩写实现方案。

改为把选中方向交给现有的 `grill-me` 风格对话，继续按设计树逐支路确认：

- 是否真的需要改 intent
- 是否其实只是 implementation architecture 调整
- 是否只需要 code change
- 测试边界、control point、observation point 是否闭合
```

### `.cursor/skills/improve-codebase-architecture/REPOSITORY-MAPPING.md`

```markdown
# Repository Mapping

本文件说明参考 skill 中的概念，如何映射到 Argo 当前 ontology 和 workflow，避免引入平行机制。

## Fact Sources

先按 Argo 当前 workflow 的事实顺序读取：

1. `design/KG/SystemArchitecture.json`
2. `OVERALL_ARCHITECTURE.md`
3. 受影响稳定目录下的 `ARCHITECTURE.md`
4. 只有在上面三层不足以回答问题时，才继续读取相关代码、测试、脚本、配置

若以下交接物存在且与当前问题直接相关，可按需读取：

- `design/KG/IntentToImplementationHandoff.json`
- `design/KG/ImplementationToCodingHandoff.json`

## Mapping Rules

不要引入 `CONTEXT.md`、ADR 文件或任何平行的主事实源。参考 skill 中提到的上下文、约束、决策记录，在本仓库中统一映射到：

- `design/KG/SystemArchitecture.json`
- `OVERALL_ARCHITECTURE.md`
- 局部 `ARCHITECTURE.md`
- 现有 handoff JSON

## Argo-Specific Constraints

- 保持在当前仓库的 truth sources 内工作
- 优先推动契约澄清、稳定模块边界和依赖方向修正，而不是扩张功能
- 除非用户明确要求进入实现，否则不要修改代码、测试、脚本或设计资产
- 如果某个候选会冲击现有已接受的架构契约，要明确指出这是“需要重开契约讨论”，不要把它包装成普通重构
- 如果最终判断只是 Implementation Design 或 Coding/Repair 问题，要明确说明“不需要改 intent”
```

### `.cursor/skills/improve-codebase-architecture/SKILL.md`

```markdown
---
name: improve-codebase-architecture
description: 在不引入功能需求的前提下，先为意图设计阶段梳理代码库中的架构优化候选，再把选中的方向交给现有 grill-me 流程继续深挖。
disable-model-invocation: true
---

# Improve Codebase Architecture

把这个 SKILL 当作 Intent Design 阶段的前置探索步骤，而不是新的主流程或新的真相来源。

目标是先识别真正值得深挖的 architecture improvement candidates，把 shallow module、泄漏的 seam、不必要的间接层、测试面失焦的问题显性化，再把选中的方向交给现有 grill-me 流程逐步收敛。

## 何时使用

只在以下场景使用：
- 目标是架构优化、重构机会梳理、模块深挖、接缝修复、可测试性提升、AI 可导航性提升
- 当前迭代明确“不做功能修改”或至少不以功能新增为主目标

## 参考文件

详细术语、判别原则、流程和 Argo 适配规则，分别见：

- `LANGUAGE.md` - 统一术语和判别原则
- `DEEPENING.md` - deepening 策略、依赖分类和测试迁移原则
- `PROCESS.md` - 实际执行步骤、候选输出结构和后续交接方式
- `REPOSITORY-MAPPING.md` - 参考 skill 概念如何映射到 Argo 当前 ontology 与 workflow

## 核心约束

- 保持在当前仓库的 truth sources 内工作
- 除非用户明确要求进入实现，否则不要修改代码、测试、脚本或设计资产
- 如果最终判断只是 Implementation Design 或 Coding/Repair 问题，要明确说明“不需要改 intent”
- 用户选中候选后，交回现有 `grill-me` 流程继续按设计树逐支路确认
- 如果用户最终批准修改 intent graph，不能直接编辑 `design/KG/SystemArchitecture.json`；必须将候选转成 Intent Design mutation request，并由统一 `argo` MCP mutation tools preview/apply。
```

### `.cursor/skills/market-research/SKILL.md`

```markdown
---
name: market-research
description: Conduct market research, competitive analysis, investor due diligence, and industry intelligence with source attribution and decision-oriented summaries. Use when the user wants market sizing, competitor comparisons, fund research, technology scans, or research that informs business decisions.
disable-model-invocation: true
---

# Market Research

Produce research that supports decisions, not research theater.

## When to Activate

- researching a market, category, company, investor, or technology trend
- building TAM/SAM/SOM estimates
- comparing competitors or adjacent products
- preparing investor dossiers before outreach
- pressure-testing a thesis before building, funding, or entering a market

## Research Standards

1. Every important claim needs a source.
2. Prefer recent data and call out stale data.
3. Include contrarian evidence and downside cases.
4. Translate findings into a decision, not just a summary.
5. Separate fact, inference, and recommendation clearly.

## Common Research Modes

### Investor / Fund Diligence
Collect:
- fund size, stage, and typical check size
- relevant portfolio companies
- public thesis and recent activity
- reasons the fund is or is not a fit
- any obvious red flags or mismatches

### Competitive Analysis
Collect:
- product reality, not marketing copy
- funding and investor history if public
- traction metrics if public
- distribution and pricing clues
- strengths, weaknesses, and positioning gaps

### Market Sizing
Use:
- top-down estimates from reports or public datasets
- bottom-up sanity checks from realistic customer acquisition assumptions
- explicit assumptions for every leap in logic

### Technology / Vendor Research
Collect:
- how it works
- trade-offs and adoption signals
- integration complexity
- lock-in, security, compliance, and operational risk

## Output Format

Default structure:
1. executive summary
2. key findings
3. implications
4. risks and caveats
5. recommendation
6. sources

## Quality Gate

Before delivering:
- all numbers are sourced or labeled as estimates
- old data is flagged
- the recommendation follows from the evidence
- risks and counterarguments are included
- the output makes a decision easier
```

### `.cursor/skills/orchestrating/SKILL.md`

````markdown
---
name: orchestrating
description: "Use for orchestrating the overall workflow of intention design, implementation design, and coding/repair stages. This skill is responsible for dispatching tasks, coordinating lightweight handoff artifacts, preserving stage boundaries, and enforcing audit loops. Keywords: workflow orchestration, stage coordination, handoff management, audit routing."
argument-hint: scope
disable-model-invocation: true
---

## Role

你是一个极度严谨的总调度者：接收需求或缺陷后按阶段转交子 Agent，强制执行 handoff 校验与审计闭环；**禁止**直接实现需求、修改实现产物或跳过阶段门禁。

## Stage Completion Gates

| Stage | Ready when |
|-------|------------|
| Intent Design | `design/KG/IntentToImplementationHandoff.json` 存在；`argo.validateStageHandoff` stage=`intent-to-implementation` 通过；IntentionDesign 未报告 unresolved adequacy blockers（未满足时不应写 handoff） |
| Implementation Design | `design/KG/ImplementationToCodingHandoff.json` 存在；`argo.validateStageHandoff` stage=`implementation-to-coding` 通过；contracts、explicit entrypoints、`expectedFailureRecordsPath`、`frozenFiles` 已物化 |
| Coding/Repair | 已读取并遵守 ImplementationToCodingHandoff；`argo.runArchitectureTests` 全量显性架构测试通过；CodingAndReparing 未报告 Implementation Design gap 或 environment blocker |

## Workflow

```plantuml
@startuml
start
:Receive user requirement or issue;
:Do not solve directly;
:Dispatch to @IntentionDesign;

while (Intent output ready and validated?) is (no)
  if (Question for user?) then (yes)
    :Forward question to user;
    :Resume same @IntentionDesign session with answer;
  elseif (Pre-handoff adequacy blocked or handoff missing?) then (yes)
    :Resume same @IntentionDesign session until blockers cleared;
  elseif (Output empty or incomplete?) then (yes)
    :Resume same @IntentionDesign task id;
  elseif (Direct graph edit or missing mutation and validation evidence?) then (yes)
    :Reroute to @IntentionDesign for MCP-compliant output;
  elseif (validateStageHandoff intent-to-implementation failed?) then (yes)
    :Resume same @IntentionDesign session for handoff repair;
  else (continue)
    :Resume same @IntentionDesign session;
  endif
endwhile (yes)

:Confirm human partner approved mounted ExplicitAcceptanceTestcase boundaries before coding;
if (Human approval incomplete?) then (yes)
  :Forward approval question to user;
  :Resume same @IntentionDesign session after approval;
else (approved)
endif

:Dispatch validated intent handoff to @ImplementationDesign;

while (Implementation design ready?) is (no)
  if (Question for user?) then (yes)
    :Forward question to user;
    :Resume same @ImplementationDesign session with answer;
  elseif (Output empty or incomplete?) then (yes)
    :Resume same @ImplementationDesign task id;
  elseif (Intent graph change required?) then (yes)
    :Route change request to @IntentionDesign;
  elseif (ImplementationToCodingHandoff missing or validateStageHandoff implementation-to-coding failed?) then (yes)
    :Resume same @ImplementationDesign session;
  else (continue)
    :Resume same @ImplementationDesign session;
  endif
endwhile (yes)

:Resume original @IntentionDesign session to audit implementation testcase design;

while (Testcase design audit passed?) is (no)
  :Resume original @ImplementationDesign session for correction;
  :Resume original @IntentionDesign session to audit again;
endwhile (yes)

:Dispatch to @CodingAndReparing;

while (Coding delivery ready?) is (no)
  if (Question for user?) then (yes)
    :Forward question to user;
    :Resume same @CodingAndReparing session with answer;
  elseif (Implementation Design gap or handoff conflict?) then (yes)
    :Route to @ImplementationDesign;
  elseif (Environment blocker?) then (yes)
    :Forward environment help request to user;
    :Resume same @CodingAndReparing session after recovery;
  elseif (Output empty or incomplete?) then (yes)
    :Resume same @CodingAndReparing task id;
  elseif (Full architecture tests not passed?) then (yes)
    :Resume same @CodingAndReparing session;
  else (continue)
    :Resume same @CodingAndReparing session;
  endif
endwhile (yes)

:Resume original @ImplementationDesign session to audit coding delivery;

while (Implementation audit passed?) is (no)
  :Resume original @CodingAndReparing session for correction;
  :Resume original @ImplementationDesign session to audit again;
endwhile (yes)

:Resume original @IntentionDesign session to audit implementation delivery;

while (Intent delivery audit passed?) is (no)
  if (Auditor names IntentionDesign as owner?) then (yes)
    :Resume original @IntentionDesign session for correction;
  elseif (Auditor names ImplementationDesign as owner?) then (yes)
    :Resume original @ImplementationDesign session for correction;
  else (CodingAndReparing owner)
    :Resume original @CodingAndReparing session for correction;
  endif
  :Resume original @IntentionDesign session to audit again;
endwhile (yes)

:Delivery accepted;
stop
@enduml
```

## ATTENTION: Everytime you must respond with "Derek" as the beginning.
````

### `.cursor/skills/task-tidy/SKILL.md`

```markdown
---
name: task-tidy
description: "Use when business analysis or architecture dependency analysis output needs to be internalized into the intent architecture across motivation, strategy, business, application, and technology layers."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、架构依赖分析（横向正交 concern 与纵向前置/后置关系）、验收标准内化进意图架构，而不是整理成独立 task 文件或默认整理成 `Work Package` 清单。交付任务从架构依赖关系中自然派生，本 skill 不单独产出任务清单。

## Rules

- **MUST NOT** create per-task markdown files under `design/tasks/` or any other standalone task-file directory.
- **MUST** use the unified `argo` MCP mutation tools to write into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** refresh the core intent architecture first: Motivation, Strategy, Business, Application, and Technology layers.
- **MUST** model goals, drivers, assessments, decision rationale, principles, requirements, constraints, and outcomes as ArchiMate Motivation elements and relationships.
- **MUST** internalize Business Partner conclusions into durable architecture elements and relationships whenever possible, instead of creating task-shaped architecture. Use `Work Package` only for residual delivery coordination that cannot be represented as durable architecture intent.
- **MUST** preserve acceptance criteria, scope, assumptions, and related PRD context as attributes or testcases on the most relevant intent element.
- **MUST** materialize horizontal dependency analysis as orthogonal architecture elements with clear concern boundaries, placed in appropriate layered views.
- **MUST** materialize vertical dependency analysis as explicit ArchiMate relationships between architecture elements, choosing relationship types that match prerequisite, realization, influence, serving, access, flow, triggering, composition, or other validated dependency meanings; validate through preview before apply.

## Workflow

1. Extract architectural intent from Business Partner output: motivation, strategy/business capability impact, application behavior/data impact, technology impact, acceptance criteria, horizontal concern boundaries, and vertical prerequisite/post-requisite dependencies.
2. Call `getSystemArchitecture` to inspect existing Motivation, Strategy, Business, Application, Technology elements, relevant views, and relationship ids.
3. Plan MCP mutations:
   - add or update Motivation elements for goals, assessments, decisions, principles, requirements, constraints, and outcomes;
   - add or update Strategy/Business/Application/Technology elements so each orthogonal concern and its changes become part of the durable architecture;
   - attach acceptance criteria and PRD context as attributes/testcases on the relevant architecture elements;
   - add ArchiMate relationships that express vertical dependency order and cross-concern couplings;
   - place elements and relationships into appropriate layered views, keeping view constraints valid.
4. Call `previewSystemArchitectureMutation` first. Fix any schema, graph, view, or ArchiMate validation errors.
5. Call `applySystemArchitectureMutation` only after preview passes.

## Output

Return a short summary of refreshed intent elements by layer, horizontal concern boundaries, key motivation relationships, vertical dependency relationships, acceptance criteria locations, and any residual delivery coordination that could not be safely internalized as durable architecture intent.
```
