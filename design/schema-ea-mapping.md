# SystemArchitecture Schema 与 EA 映射

本文基于 `.argo/schema/SystemArchitecture.schema.json` 与 `eatool/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js`，说明当前 `design/KG/SystemArchitecture.json` schema 字段与 Enterprise Architect(EA) 模型字段的对应关系。

## 当前 Schema 范围

当前 schema 顶层只允许：

| Schema 路径 | EA 来源/去向 | 说明 |
| --- | --- | --- |
| `name` | `EA.Package.Name` 或父 `EA.Element.Name` | 导出时取当前 Diagram 所属 Package，或 Diagram 父元素 |
| `description` | `EA.Package.Notes` 或父 `EA.Element.Notes` | schema 要求非空；导入脚本遇到历史空值会 warning 后继续 |
| `attributes` | 父 `EA.Element.AttributesEx` | 可选，通用属性容器 |
| `elements` | Diagram 中的 `EA.Element` | 必填数组 |
| `relationships` | Diagram 中的 `EA.Connector` | 必填数组 |
| `views` | `EA.Diagram` | 必填数组 |

`standard`、`archimate_layer`、`archimate_aspect`、`archimate_category`、`project_info`、元素级 `browser_path/status/document/code_file/condition_file/prompts_file`、关系级 `sequence/super_type`、视图级 `browser_path` 已不属于当前 schema。导入脚本仍会把这些历史字段作为 `legacy_*` Tagged Value 保留，导出脚本不再生成这些字段。

## 元素映射

`elements[]` 对应 EA 的 `EA.Element`。

| Schema 路径 | EA 字段 | 说明 |
| --- | --- | --- |
| `elements[].id` | `EA.Element.ElementID` | 导出时使用 EA 新分配 ID；导入时原 schema id 写入 `Alias` 和 `schema_id` Tagged Value |
| `elements[].name` | `EA.Element.Name` | 直接映射 |
| `elements[].parent` | `EA.Element.ParentID` | 可选；导入时用于尝试创建嵌套元素 |
| `elements[].type` | `EA.Element.StereotypeEx` 或 `EA.Element.Type` | 必须归一化为 schema 枚举，如 `Application Component`；历史 `ArchiMate_ApplicationComponent` 会被兼容识别 |
| `elements[].alias` | `EA.Element.Alias` | 可选 |
| `elements[].classifier` | Tagged Value | EA 原生 classifier 解析不稳定，导入时保留为 `schema_classifier` |
| `elements[].description` | `EA.Element.Notes` | 可选 |
| `elements[].attributes` | `EA.Element.Attributes` | 通用属性数组 |
| `elements[].subdiagram_views` | `EA.Element.Diagrams` | 子图关系；导入时在对应元素下创建 Diagram |
| `elements[].testcases` | `EA.Element.Tests` | 测试用例；当前 schema 只允许 `Acceptance Test` |

### 元素属性

| Schema 路径 | EA 字段 | 说明 |
| --- | --- | --- |
| `attribute.name` | `EA.Attribute.Name` | 必填 |
| `attribute.description` | `EA.Attribute.Notes` | 可选 |
| `attribute.value` | `EA.Attribute.Default` | 可选 |
| `attribute.content` | `EA.Attribute.Notes`，`Alias = content` | 用于大段内容；导入脚本会用 `Alias` 标记 |

EA 导出规则：

- `EA.Attribute.Alias == "notpub"` 会跳过。
- `EA.Attribute.Alias == "content"` 且启用内容读取时，导出到 `content`。
- `EA.MethodsEx` 中的方法现在统一作为 `elements[].attributes` 导出，避免依赖已删除的 `code_file/condition_file/prompts_file` 字段。

## 关系映射

`relationships[]` 对应 EA 的 `EA.Connector`。

| Schema 路径 | EA 字段 | 说明 |
| --- | --- | --- |
| `relationships[].id` | `EA.Connector.ConnectorID` | 导出时使用 EA 新分配 ID；导入时原 schema id 写入 `Alias` 和 `schema_id` Tagged Value |
| `relationships[].statement` | 源/目标元素名称与关系类型拼接 | `<source> --(<relationship>)--> <target>` |
| `relationships[].name` | `EA.Connector.Name`、`Stereotype` 或 `Type` | 必须是 schema 关系枚举；历史 `ArchiMate_*` 前缀会被兼容识别 |
| `relationships[].description` | `EA.Connector.Notes` 与 Association Class `Notes` | 可选 |
| `relationships[].document` | Association Class Linked Document 转 PDF | 可选，仍属于当前 schema |
| `relationships[].attributes` | Association Class `AttributesEx` | 可选关系属性 |
| `relationships[].source_id` | `EA.Connector.ClientID` | 源元素 schema id |
| `relationships[].target_id` | `EA.Connector.SupplierID` | 目标元素 schema id |
| `relationships[].source_name` | 源 `EA.Element.Name` | 必填 |
| `relationships[].target_name` | 目标 `EA.Element.Name` | 必填 |

导出过滤规则：

- 隐藏的 `EA.DiagramLink` 不导出。
- 可见的 `EA.DiagramLink` 即使 `Geometry == ""` 也会导出；几何信息只是路由/布局状态，不代表关系不存在。
- 同一 `ConnectorID` 只导出一次，但多个 view 可引用同一关系。
- `Aggregation` 不再改写为旧的 `aggregates`。
- 导入时保存的包级 `schema_relationships_json` 和 `schema_views_json`、Diagram `StyleEx` 中的成员列表只作为空提取结果的兼容回退；EA 当前模型中提取到的关系、视图及成员始终优先，避免导入快照覆盖后续人工编辑。

### 关系属性

| Schema 路径 | EA 字段 | 说明 |
| --- | --- | --- |
| `relationshipAttribute.name` | Association Class `EA.Attribute.Name` | 必填 |
| `relationshipAttribute.description` | Association Class `EA.Attribute.Notes` | 可选 |

导入时，如果关系是 Association，脚本会尽量创建 Association Class 承载属性；若 EA API 不支持或失败，则退回到 Connector Tagged Values。

## 视图映射

`views[]` 对应 EA 的 `EA.Diagram`。

| Schema 路径 | EA 字段 | 说明 |
| --- | --- | --- |
| `views[].view_id` | `EA.Diagram.DiagramID` | 导出时使用 EA DiagramID；导入时原 id 写入 Diagram `StyleEx` |
| `views[].view_name` | `EA.Diagram.Name` | 必填 |
| `views[].parent_element_id` | `EA.Diagram.ParentID` | 可选；用于把 Diagram 挂到元素下 |
| `views[].parent_element_name` | 父 `EA.Element.Name` | 可选 |
| `views[].description` | `EA.Diagram.Notes` | 可选 |
| `views[].included_elements` | `EA.DiagramObjects` | 可选数组，列出 view 中元素 id |
| `views[].included_relationships` | `EA.DiagramLinks` | 可选数组，列出 view 中关系 id |

## Testcase 映射

当前 schema 中 `testcase.type` 只允许 `Acceptance Test`。

| Schema 路径 | EA 字段 |
| --- | --- |
| `testcase.name` | `EA.Test.Name` |
| `testcase.description` | `EA.Test.Notes` |
| `testcase.type` | `EA.Test.Class = 4` |
| `testcase.Input` | `EA.Test.Input` |
| `testcase.acceptanceCriteria` | `EA.Test.AcceptanceCriteria` |
| `testcase.TestResults` | `EA.Test.TestResults`，可选 |

导出脚本会把 EA 中所有 Test class 归一为 `Acceptance Test`，以满足当前 schema。

## 脚本适配状态

| 脚本 | 适配内容 |
| --- | --- |
| `eatool/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js` | 导出当前 schema 允许字段；归一化 `ArchiMate_*` 类型；停止输出已删除字段 |
| `eatool/EA-jsscript/import_system_architecture_json_to_ea.js` | 导入当前 schema 字段；兼容历史 `ArchiMate_*` 与旧字段；保留 `subdiagram_views` 到 EA 子图 |

