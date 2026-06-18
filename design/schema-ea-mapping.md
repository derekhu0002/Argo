# SystemArchitecture Schema 与 EA 导出映射

本文对照 `.cursor/argoschema/SystemArchitecture.schema.json` 与 `eatool/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js`，说明 `SystemArchitecture.json` 中各对象、关系及其属性如何从 Enterprise Architect(EA) 模型中生成。

## 生成入口

脚本入口是 `main()`，读取当前打开的 EA Diagram，并递归处理该图及元素下的子图：

- 输出文件：`<projectPath>\design\KG\<当前图名>.json`
- 元素来源：`currentDiagram.DiagramObjects` -> `Repository.GetElementByID(diaObj.ElementID)`
- 关系来源：`currentDiagram.DiagramLinks` -> `Repository.GetConnectorByID(link.ConnectorID)`
- 视图来源：当前 Diagram 与递归发现的子 Diagram
- 顶层名称/描述来源：当前 Diagram 所属 Package，或当前 Diagram 的父 Element

## 顶层对象映射

| Schema 路径       | Schema 含义/约束                          | EA 来源                                    | 脚本处理                                                           |
| --------------- | ------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `name`          | 必填，非空字符串                              | `EA.Package.Name` 或父 `EA.Element.Name`   | 若 `currentDiagram.ParentID == 0`，使用当前图所在 Package；否则使用父 Element |
| `description`   | 必填，非空字符串                              | `EA.Package.Notes` 或父 `EA.Element.Notes` | 与 `name` 同源规则                                                  |
| `standard`      | 必填，`name = ArchiMate`，`version = 3.2` | 无直接 EA 来源                                | 当前脚本未输出，需要后处理或脚本补齐                                             |
| `attributes`    | 可选，通用属性数组                             | 父 `EA.Element.AttributesEx`              | 仅当当前 Diagram 有父 Element 时输出                                    |
| `elements`      | 必填，至少 1 项                             | Diagram 中的 EA Element                    | 由 `globalElements` 汇总去重                                        |
| `relationships` | 必填，至少 1 项                             | Diagram 中可见 EA Connector                 | 由 `globalRelationships` 汇总去重                                   |
| `views`         | 必填，至少 1 项                             | EA Diagram                               | 当前图与递归子图组成                                                     |

## 元素对象映射

Schema 中 `elements[]` 对应 EA 的 `EA.Element`。

| Schema 路径                     | Schema 含义/约束           | EA 来源                                              | 脚本处理                                                       |
| ----------------------------- | ---------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `elements[].id`               | 必填，标识符                 | `EA.Element.ElementID`                             | `getElementIdentifier(ele)` 返回 `ElementID` 字符串             |
| `elements[].name`             | 必填，非空字符串               | `EA.Element.Name`                                  | 直接输出                                                       |
| `elements[].parent`           | 可选，父元素标识符              | `EA.Element.ParentID`                              | 直接输出 `ParentID`；根元素通常为 `"0"`                               |
| `elements[].type`             | 必填，ArchiMate 元素类型枚举    | `EA.Element.StereotypeEx` 或 `EA.Element.Type`      | 优先 `StereotypeEx`，为空时用 `Type`                              |
| `elements[].archimate_layer`  | 必填，ArchiMate 层枚举       | 无直接输出                                              | 当前脚本未输出，需要根据 `type` 或 EA Tagged Value 补齐                   |
| `elements[].archimate_aspect` | 必填，ArchiMate aspect 枚举 | 无直接输出                                              | 当前脚本未输出，需要根据 `type` 或 EA Tagged Value 补齐                   |
| `elements[].alias`            | 可选                     | `EA.Element.Alias`                                 | 非空时输出                                                      |
| `elements[].classifier`       | 可选                     | `EA.Element.ClassifierName`                        | 非空时输出                                                      |
| `elements[].browser_path`     | 可选                     | `EA.Element.PackageID`、`ParentID`、`Name`           | `needbrowserlocation` 为真时，用 Package 路径 + 父元素链 + 元素名拼接      |
| `elements[].status`           | 可选                     | `EA.Element.Status`                                | 仅当值为 `Implemented` 时输出                                     |
| `elements[].description`      | 可选                     | `EA.Element.Notes`                                 | 非空时输出                                                      |
| `elements[].document`         | 可选，文档路径                | `EA.Element.GetLinkedDocument()`                   | `needdoc` 为真且 RTF 非空时转 PDF，输出 `pdfs/<元素名>_<ElementID>.pdf` |
| `elements[].attributes`       | 可选，通用属性数组              | `EA.Element.AttributesEx` 与 `EA.Element.MethodsEx` | Attribute 与部分 Method 合并输出                                  |
| `elements[].code_file`        | 可选，代码文件路径              | `EA.Method.Name == "mainbehavior"` 的 `Notes`       | 仅 `needCode` 为真且方法存在时输出                                    |
| `elements[].condition_file`   | 可选，条件文件路径              | `EA.Method.Name == "decision_condition"` 的 `Notes` | 仅 `needCode` 为真且方法存在时输出                                    |
| `elements[].prompts_file`     | 可选，提示词文件路径             | `EA.Method.Name == "prompts"` 的 `Notes`            | 仅 `needCode` 为真且方法存在时输出                                    |
| `elements[].project_info`     | 可选，项目维护信息              | `EA.Element.Resources` 与 `EA.Element.Issues`       | 由 `getProjectinfo(ele)` 输出                                 |
| `elements[].subdiagram_views` | 可选，子图引用                | `EA.Element.Diagrams`                              | 输出子图 `DiagramID` 与 `Name`，并递归抽取子图                          |
| `elements[].testcases`        | 可选，测试用例数组              | `EA.Element.Tests`                                 | 每个 EA Test 映射为 schema testcase                             |
|                               |                        |                                                    |                                                            |

### 元素属性映射

Schema 中 `attribute` 同时用于顶层 `attributes` 与元素 `attributes`。

| Schema 路径 | Schema 含义/约束 | EA 来源 | 脚本处理 |
| --- | --- | --- | --- |
| `attribute.name` | 必填，非空字符串 | `EA.Attribute.Name` 或 `EA.Method.Name` | 直接输出 |
| `attribute.description` | 可选 | `EA.Attribute.Notes` 或 `EA.Method.Notes` | 非空时输出；Method 映射时总是生成该字段 |
| `attribute.value` | 可选 | `EA.Attribute.Default` | 非空时输出 |
| `attribute.content` | 可选，大段内容 | `EA.Attribute.Notes` 指向的文件内容 | 当 `EA.Attribute.Alias == "content"` 且 `needContent` 为真时读取文件内容 |

特殊规则：

- `EA.Attribute.Alias == "notpub"` 的属性会被跳过。
- `EA.Attribute.Alias == "content"` 的属性不会输出 `description/value`，而是把 `Notes` 作为路径读取文件内容到 `content`。
- `EA.Method` 中 `mainbehavior`、`decision_condition`、`prompts` 不进入 `attributes`，分别映射到 `code_file`、`condition_file`、`prompts_file`。
- 其他 `EA.Method` 作为 `attribute` 输出：`name = Method.Name`，`description = Method.Notes`。

## 关系对象映射

Schema 中 `relationships[]` 对应 EA 的 `EA.Connector`。若 Connector 有 Association Class，脚本还会读取该 Association Class 的说明、属性和链接文档。

| Schema 路径 | Schema 含义/约束 | EA 来源 | 脚本处理 |
| --- | --- | --- | --- |
| `relationships[].id` | 必填，标识符 | `EA.Connector.ConnectorID` | `getConnectorIdentifier(conn)` 返回 `ConnectorID` 字符串 |
| `relationships[].statement` | 必填，关系陈述 | 源/目标元素名称与关系类型 | 拼成 `<source> --(<relType>)--> <target>` |
| `relationships[].name` | 必填，ArchiMate 关系类型枚举 | `EA.Connector.Name`、`Stereotype`、`Type` | 优先 `Name`，其次 `Stereotype`，最后 `Type` |
| `relationships[].archimate_category` | 必填，关系类别枚举 | 无直接输出 | 当前脚本未输出，需要根据关系类型补齐 |
| `relationships[].description` | 可选 | `EA.Connector.Notes` 与 Association Class `Notes` | 两者都有时用换行合并；非空时输出 |
| `relationships[].sequence` | 可选 | `EA.Connector.SequenceNo` | 非空时输出为字符串 |
| `relationships[].super_type` | 可选 | `EA.Connector.StereotypeEx` | 非空时输出 |
| `relationships[].document` | 可选，文档路径 | Association Class `GetLinkedDocument()` | `needdoc` 为真且 RTF 非空时转 PDF，输出 `pdfs/<关系类名>_<ElementID>.pdf` |
| `relationships[].attributes` | 可选，关系属性数组 | Association Class `AttributesEx` | 每个属性映射为 `relationshipAttribute` |
| `relationships[].source_id` | 必填，源元素标识符 | `EA.Connector.ClientID` -> 源 `EA.Element.ElementID` | 通过 `Repository.GetElementByID(conn.ClientID)` 获取源元素 |
| `relationships[].target_id` | 必填，目标元素标识符 | `EA.Connector.SupplierID` -> 目标 `EA.Element.ElementID` | 通过 `Repository.GetElementByID(conn.SupplierID)` 获取目标元素 |
| `relationships[].source_name` | 必填，源元素名称 | 源 `EA.Element.Name` | 直接输出 |
| `relationships[].target_name` | 必填，目标元素名称 | 目标 `EA.Element.Name` | 直接输出 |

关系过滤规则：

- `EA.DiagramLink.IsHidden == true` 的关系会被跳过。
- `EA.DiagramLink.Geometry == ""` 的关系会被跳过。
- 同一个 `ConnectorID` 只输出一次，但每个 View 仍可引用该关系。
- 脚本当前把 `relType == "Aggregation"` 改写为 `"aggregates"`；这与 schema 的 `archimateRelationshipType` 枚举值 `Aggregation` 不一致。

### 关系属性映射

Schema 中 `relationshipAttribute` 当前只允许 `name` 与 `description`。

| Schema 路径 | Schema 含义/约束 | EA 来源 | 脚本处理 |
| --- | --- | --- | --- |
| `relationshipAttribute.name` | 必填，非空字符串 | Association Class `EA.Attribute.Name` | 直接输出 |
| `relationshipAttribute.description` | 必填，非空字符串 | Association Class `EA.Attribute.Notes` | 直接输出 |

## 视图对象映射

Schema 中 `views[]` 对应 EA 的 `EA.Diagram`。

| Schema 路径 | Schema 含义/约束 | EA 来源 | 脚本处理 |
| --- | --- | --- | --- |
| `views[].view_id` | 必填，标识符 | `EA.Diagram.DiagramID` | `getDiagramIdentifier(diagram)` 返回 `DiagramID` 字符串 |
| `views[].view_name` | 必填，非空字符串 | `EA.Diagram.Name` | 直接输出 |
| `views[].browser_path` | 可选 | `EA.Diagram.PackageID`、`ParentID`、`Name` | `needbrowserlocation` 为真时，用 Package 路径 + 父元素链 + 图名拼接 |
| `views[].parent_element_id` | 可选 | `EA.Diagram.ParentID` -> 父 `EA.Element.ElementID` | 当 `ParentID != 0` 且能取到父元素时输出 |
| `views[].parent_element_name` | 可选 | 父 `EA.Element.Name` | 同上 |
| `views[].description` | 可选 | `EA.Diagram.Notes` | 非空时输出 |
| `views[].included_elements` | 必填，元素 id 数组 | 当前 Diagram 的 `DiagramObjects` | 收集每个图对象的 `ElementID` |
| `views[].included_relationships` | 必填，关系 id 数组 | 当前 Diagram 的 `DiagramLinks` | 收集未隐藏且有 Geometry 的 `ConnectorID` |

## 嵌套项目与测试对象映射

### `project_info`

`elements[].project_info` 来自 EA Element 的资源与问题维护信息。

| Schema 路径 | EA 来源 | 脚本处理 |
| --- | --- | --- |
| `project_info.summary` | `EA.Issue.Name == "summury"` | 作为项目汇总输出 |
| `project_info.resources` | `EA.Element.Resources` | 每个 `EA.Resource` 映射为 `resource` |
| `project_info.tasks` | `EA.Element.Issues` | 除 `summury` 外的 `EA.Issue` 映射为 `task` |

### `project_info.summary`

| Schema 路径 | EA 来源 |
| --- | --- |
| `summary.notes` | `EA.Issue.Notes` |
| `summary.started` | `EA.Issue.DateReported` |
| `summary.deadline` | `EA.Issue.DateResolved` |
| `summary.priority` | `EA.Issue.Priority` |
| `summary.assigned_to` | `EA.Issue.Resolver` |
| `summary.progress` | `EA.Issue.ResolverNotes` |

### `project_info.resources[]`

| Schema 路径 | EA 来源 |
| --- | --- |
| `resource.owner` | `EA.Resource.Name` |
| `resource.role` | `EA.Resource.Role` |
| `resource.description` | `EA.Resource.Notes` |
| `resource.start_date` | `EA.Resource.DateStart` |
| `resource.end_date` | `EA.Resource.DateEnd` |
| `resource.percent_complete` | `EA.Resource.PercentComplete` |
| `resource.expected_hours` | `EA.Resource.ExpectedHours` |
| `resource.history` | `EA.Resource.History` |

### `project_info.tasks[]`

| Schema 路径 | EA 来源 | 脚本处理 |
| --- | --- | --- |
| `task.name` | `EA.Issue.Name` | 必填 |
| `task.type` | `EA.Issue.Type` | 非空时输出 |
| `task.status` | `EA.Issue.Status` | 非空时输出 |
| `task.description` | `EA.Issue.Notes` | 非空时输出 |
| `task.start_date` | `EA.Issue.DateReported` | 始终输出 |
| `task.completion_date` | `EA.Issue.DateResolved` | `Status == "Complete"` 时输出 |
| `task.due_date` | `EA.Issue.DateResolved` | 非 Complete 时输出 |
| `task.reporter` | `EA.Issue.Reporter` | 非空时输出 |
| `task.priority` | `EA.Issue.Priority` | 始终输出 |
| `task.assigned_to` | `EA.Issue.Resolver` | 始终输出 |
| `task.progress` | `EA.Issue.ResolverNotes` | 非空时输出 |

任务过滤规则：

- `needallmaintenace == "All"`：输出所有任务。
- `needallmaintenace == "ActiveAndVerified"`：只输出 `active` 或 `verified`。
- 其他值：只输出 `active`。
- `maintenacetype == "forllm"` 时，只输出 `Resolver == "llm"` 的任务。

### `testcases[]`

`elements[].testcases` 来自 `EA.Element.Tests`。

| Schema 路径 | EA 来源 | 脚本处理 |
| --- | --- | --- |
| `testcase.name` | `EA.Test.Name` | 直接输出 |
| `testcase.description` | `EA.Test.Notes` | 直接输出 |
| `testcase.type` | `EA.Test.Class` | `1..6` 映射为 Unit/Integration/System/Acceptance/Scenario/Inspection Test |
| `testcase.Input` | `EA.Test.Input` | 直接输出 |
| `testcase.acceptanceCriteria` | `EA.Test.AcceptanceCriteria` | 直接输出 |
| `testcase.TestResults` | `EA.Test.TestResults` | 直接输出 |

## 配置项对导出的影响

| 配置项 | 默认值 | 影响 |
| --- | --- | --- |
| `projectPath` | `""` | 输出路径和相对内容文件解析基准；可从 EA 模型连接路径自动推断 |
| `needCode` | `false` | 为真时输出 `code_file`、`condition_file`、`prompts_file` |
| `needContent` | `true` | 为真时读取 `Alias == "content"` 的 Attribute 指向文件内容 |
| `needdoc` | `false` | 为真时把 EA Linked Document RTF 转成 PDF 并输出 `document` |
| `needallmaintenace` | `"All"` | 控制 `EA.Issue` 任务过滤 |
| `needbrowserlocation` | `true` | 为真时输出元素/视图 `browser_path` |
| `maintenacetype` | `"forproject"` | 为 `"forllm"` 时只输出 Resolver 为 `llm` 的任务 |

## 与当前 Schema 的差异/风险

| 项目 | 当前脚本行为 | Schema 要求 | 建议 |
| --- | --- | --- | --- |
| 顶层 `standard` | 未输出 | 必填，且固定为 ArchiMate 3.2 | 在脚本顶层补输出，或导出后后处理 |
| `elements[].archimate_layer` | 未输出 | 必填 | 增加元素类型到 layer 的映射，或从 EA Tagged Value 读取 |
| `elements[].archimate_aspect` | 未输出 | 必填 | 增加元素类型到 aspect 的映射，或从 EA Tagged Value 读取 |
| `relationships[].archimate_category` | 未输出 | 必填 | 增加关系类型到 category 的映射 |
| `relationships[].name` | 可能输出 `aggregates` | 必须是枚举值，如 `Aggregation` | 不应把 `Aggregation` 改写为 `aggregates`，或同步更新 schema |
| `relationshipAttribute.description` | 直接输出 Association Class 属性 Notes | schema 要求非空 | 若 EA 属性 Notes 为空，导出 JSON 会不满足 schema |
| `elements[].type` | 可能来自 EA 原生 `Type` | 必须是 ArchiMate 元素类型枚举 | EA 模型需使用符合 schema 枚举的 stereotype，或脚本做类型归一化 |
| `relationships[].name` | 可能来自 Connector `Name` | 必须是 ArchiMate 关系类型枚举 | 建议优先使用 `StereotypeEx/Type` 并做枚举归一化，避免业务名称污染关系类型 |

