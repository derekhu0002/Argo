# Intent Architecture MCP Validation

本文归档意图架构 `design/KG/SystemArchitecture.json` 相关 MCP 校验逻辑，包括触发环节、校验方法和失败引导。当前统一入口为 `.argo/scripts/argo-mcp-server.js`，核心 mutation 校验位于 `.argo/scripts/systemarchitecture-mcp-server.js`，总校验位于 `.argo/scripts/validateSystemArchitecture.js`。

## 校验触发环节

| 触发环节 | MCP/脚本入口 | 校验对象 | 是否写入 | 校验方法 | 失败返回/引导 |
|---|---|---|---:|---|---|
| 总校验 | MCP `validateSystemArchitecture`，由 `.argo/scripts/validator-mcp-server.js` 调用 `.argo/scripts/validateSystemArchitecture.js` | 固定项目图谱 `design/KG/SystemArchitecture.json` | 否 | JSON Schema、图语义、全部关系 ArchiMate 端点矩阵、全部 view 元素数、view 关系端点共现 | 脚本 `stderr` 输出错误列表；MCP payload `status: failed` |
| Mutation 预览 | MCP `previewSystemArchitectureMutation` | 指定 mutation 应用后的候选图谱 | 否 | mutation 前置校验、JSON Schema、图语义、触达关系 ArchiMate 端点矩阵、触达 view 元素数、view 关系端点共现 | payload `errors` + `guidance` |
| Mutation 写入 | MCP `applySystemArchitectureMutation` | 指定 mutation 应用后的候选图谱 | 仅通过后写入 | 与预览完全一致；失败时不写入 | payload `errors` + `guidance` |
| Focused 元素工具 | `addArchitectureElement` / `updateArchitectureElement` / `removeArchitectureElement` | 单元素操作转换成 mutation 后的候选图谱 | add/remove/update 按工具语义 | 复用 `applySystemArchitectureMutation` 校验链 | payload `errors` + `guidance` |
| Focused 关系工具 | `addArchitectureRelationship` / `updateArchitectureRelationship` / `removeArchitectureRelationship` | 单关系操作转换成 mutation 后的候选图谱 | add/remove/update 按工具语义 | 复用 `applySystemArchitectureMutation` 校验链；add/update 会触发关系端点矩阵校验 | payload `errors` + `guidance` |
| Focused view 工具 | `addArchitectureView` / `updateArchitectureView` / `removeArchitectureView` | 单 view 操作转换成 mutation 后的候选图谱 | add/remove/update 按工具语义 | 复用 `applySystemArchitectureMutation` 校验链；add/update view 允许空成员，但不允许引用不存在成员 | payload `errors` + `guidance` |
| 意图上下文查询 | `getIntentElementContext` | 读取图谱并按 focus element 抽取上下文 | 否 | 仅校验 focus element 可解析；不执行 mutation 校验链 | focus 缺失时返回 `status: failed` |
| 图谱读取 | `getSystemArchitecture` | 读取元素、关系、view | 否 | 路径解析和 JSON 读取；不执行结构语义校验 | 读取/解析异常由工具错误返回 |

## 图谱级校验项

| 校验项 | 生效环节 | 校验方法 | 失败错误形态 | 失败引导 |
|---|---|---|---|---|
| JSON Schema 结构 | 总校验、preview、apply、focused 工具 | `validateAgainstSchema(document, schema, '#', errors, schema)`；约束 required、type、enum、const、pattern、min/max、additionalProperties 等 | `#... must be ...`、`#... is missing required property ...`、`#... contains unsupported property ...` | mutation 路径如无专项引导，使用通用 guidance：刷新当前图谱并检查错误文本后重试 |
| 元素 ID 唯一 | 总校验、preview、apply、focused 工具 | 遍历 `elements`，用 `elementById` 检查重复 | `elements contains duplicate id '<id>'` | 通用 guidance |
| 元素类型受支持 | 总校验、preview、apply、focused 工具 | `elementTypeMetadata.has(element.type)` | `elements '<id>' uses unsupported ArchiMate element type '<type>'` | 通用 guidance |
| 元素 parent 存在 | 总校验、preview、apply、focused 工具 | 若 `element.parent` 存在，必须命中 `elementById` | `elements '<id>' references missing parent '<parent>'` | `references missing` 类错误提示刷新当前 ids，不猜测 id |
| 关系 ID 唯一 | 总校验、preview、apply、focused 工具 | 遍历 `relationships`，用 `relationshipById` 检查重复 | `relationships contains duplicate id '<id>'` | 通用 guidance |
| 关系类型受支持 | 总校验、preview、apply、focused 工具 | `relationshipCategoryByType.has(relationship.type)` | `relationships '<id>' uses unsupported ArchiMate relationship type '<type>'` | 使用 `relationship.type` 选择 schema 支持的 ArchiMate 3.2 关系类型 |
| 关系 source/target 存在 | 总校验、preview、apply、focused 工具 | `source_id` / `target_id` 必须命中 `elementById` | `relationships '<id>' references missing source_id '<id>'` / `target_id` | 刷新当前 ids，不猜测 id；先创建缺失对象 |
| 关系端点名称匹配 | 总校验、preview、apply、focused 工具 | `source_name` / `target_name` 必须等于端点元素 `name` | `source_name ... does not match element ... name ...` | 通用 guidance |
| 关系 statement 匹配 | preview、apply、focused 工具 | MCP mutation 校验中按 `${source.name} --(${relationship.type})--> ${target.name}` 计算期望 statement | `relationships '<id>' statement must be '<expected>'` | 通用 guidance |
| ArchiMate 3.2 端点矩阵 | 总校验、preview、apply、focused 关系工具 | 总校验对全部关系调用 `validateRelationshipEndpointTypes`；mutation 路径对 `touchedRelationshipIds` 调用 `auditRelationshipEndpointTypes` | `violates ArchiMate 3.2 relationship matrix` | 检查 `relationship.type` 以及 source/target 元素类型；选择合规关系类型或通过 remove/add 替换端点/类型 |
| 顶层 view 唯一 | 总校验、preview、apply、focused 工具 | `views` 中无 `parent_element_id` 的 view 必须正好 1 个 | `views must contain exactly one top-level view named 'SystemArchitecture'; found <n>` | 保持 exactly one 顶层 view，且名称为 `SystemArchitecture` |
| 顶层 view 名称固定 | 总校验、preview、apply、focused 工具 | 唯一顶层 view 的 `view_name` 必须为 `SystemArchitecture` | `top-level view '<id>' view_name must be 'SystemArchitecture'` | 同上 |
| 子 view 必须挂载父元素 | 总校验、preview、apply、focused 工具 | 非顶层 view 必须声明 `parent_element_id`；父元素必须存在 | `views '<view>' must declare parent_element_id...` / `references missing parent_element_id ...` | 子 view 设置 `parent_element_id`，并确保父元素存在 |
| 子 view 父元素名称匹配 | 总校验、preview、apply、focused 工具 | `parent_element_name` 如存在，必须等于父元素 `name` | `parent_element_name ... does not match element ... name ...` | 保持 `parent_element_name` 与父元素名称一致 |
| View 引用元素存在 | 总校验、preview、apply、focused 工具 | `included_elements` 中每个 id 必须命中 `elementById` | `views '<view>' references missing included element '<id>'` | 刷新当前 ids；不猜测 id；先创建或改用已存在元素 |
| View 引用关系存在 | 总校验、preview、apply、focused 工具 | `included_relationships` 中每个 id 必须命中 `relationshipById` | `views '<view>' references missing included relationship '<id>'` | 刷新当前 ids；不猜测 id；先创建或改用已存在关系 |
| View 关系端点共现 | 总校验、preview、apply、focused 工具 | 若 view 包含关系 R，则该 view 的 `included_elements` 必须同时包含 R 的 `source_id` 和 `target_id` | `views '<view>' includes relationship '<rel>' but not source element '<source>'` / `target element '<target>'` | 当前无专项 guidance；通用 guidance 会提示检查错误文本、刷新 view membership 后重试 |
| 元素至少属于一个 view | 总校验、preview、apply、focused 工具 | 遍历所有元素，必须被某个 view 的 `included_elements` 收集到 | `elements '<id>' must be included in at least one view` | 每个元素必须属于至少一个 view；add 时传 `view_ids` 或把已存在对象加入合适 view |
| 关系至少属于一个 view | 总校验、preview、apply、focused 工具 | 遍历所有关系，必须被某个 view 的 `included_relationships` 收集到 | `relationships '<id>' must be included in at least one view` | 每个关系必须属于至少一个 view；add 时传 `view_ids` 或把已存在对象加入合适 view |
| View 元素数量上限 | 总校验、preview、apply、focused 工具 | 总校验检查全部 view；mutation 路径检查本次被 add/update/addElement 触达的 view；每个 view `included_elements.length <= 15`（仅计 `included_elements`，`included_relationships` 不计配额） | `views '<view>' must contain at most 15 elements; found <n>` | 不要把超过 15 个 included_elements 强塞进一个 view；拆分为分层子 view，并用 `parent_element_id` 挂载 |

## Mutation 前置校验

| Mutation 类型 | 前置校验 | 失败错误形态 | 失败引导 |
|---|---|---|---|
| 全部 mutation | `mutations` 必须是非空数组；每项 `type` 必须在支持集合中 | `mutations must contain at least one mutation` / `Unsupported mutation type: <type>` | 通用 guidance |
| `addElement` | `mutation.element` 必须是对象；`element.id` 必须是非空字符串；`view_ids` 必须非空且每个 view 存在 | `mutation.element must be an object` / `mutation.element.id must be a non-empty string` / `mutation.view_ids must contain at least one view id` / `View '<id>' does not exist` | 选择明确目标 `view_ids`；先调用 `getSystemArchitecture` 查看当前 view |
| `updateElement` | `id` 非空；`patch` 是对象；元素存在；禁止修改 `id` / `type` | `Element '<id>' does not exist` / `Element '<id>' id cannot be updated` / `type cannot be updated` | 不 patch 身份和类型；如需改变 id/type，remove 后重新 add |
| `removeElement` | `id` 非空；元素存在；若给 `view_ids`，每个 view 必须存在且包含该元素 | `Element '<id>' does not exist` / `Element '<id>' is not included in view '<view>'` | 刷新 membership 后选择正确 view；无 `view_ids` 时全局删除并级联相关关系 |
| `addRelationship` | `relationship` 是对象；`relationship.id` 非空；`view_ids` 非空且存在；新关系必须有完整字段，已有关系可只传 id 加入 view | `mutation.relationship must be an object` / `mutation.relationship.id must be a non-empty string` / view scope 错误 | 选择目标 view；确保 view 中也包含关系 source/target 元素 |
| `updateRelationship` | `id` 非空；`patch` 是对象；关系存在；禁止修改 `id` / `type` | `Relationship '<id>' does not exist` / `Relationship '<id>' id cannot be updated` / `type cannot be updated` | 不 patch 身份和类型；如需改变关系类型，remove 后重新 add |
| `removeRelationship` | `id` 非空；关系存在；若给 `view_ids`，每个 view 必须存在且包含该关系 | `Relationship '<id>' does not exist` / `Relationship '<id>' is not included in view '<view>'` | 刷新 membership 后选择正确 view；无 `view_ids` 时全局删除 |
| `addView` | `view` 是对象；`view_id` 不可重复；允许没有 `included_elements` / `included_relationships` 或为空数组 | `View '<id>' already exists` | 若是子 view，必须设置有效 `parent_element_id` |
| `updateView` | `view_id` 非空；`patch` 是对象；view 存在 | `View '<id>' does not exist` | 更新 membership 时仍需满足引用存在、关系端点共现、元素数上限 |
| `removeView` | `view_id` 非空；view 存在；删除后仍需满足全图语义规则 | `View '<id>' does not exist` | 删除前确认元素/关系仍在其他 view 中，或同步迁移 membership |

## 失败引导映射

| 错误关键字 | MCP guidance |
|---|---|
| `mutation.view_ids must contain at least one view id` | `Select the target view_ids explicitly. Call getSystemArchitecture to inspect existing views, then retry the add/remove operation with the intended view_ids.` |
| `violates ArchiMate 3.2 relationship matrix` | `Check relationship.type and the source and target element types against ArchiMate 3.2. If the intended meaning is still valid, choose a compliant relationship type or change the endpoint element types by remove-and-add.` |
| `uses unsupported ArchiMate relationship type` | `Use relationship.type for the ArchiMate relationship type and choose one of the schema-supported ArchiMate 3.2 relationship types.` |
| `id cannot be updated` / `type cannot be updated` | `Do not patch immutable identity or type fields. To change an id or type, remove the existing element or relationship, then add the replacement with the desired id or type.` |
| `must be included in at least one view` | `Every element and relationship must belong to at least one view. Add it with view_ids, or add the existing object to an appropriate view before validating again.` |
| `must declare parent_element_id` / `top-level view` | `Keep exactly one top-level view named SystemArchitecture. For any sub-view, set parent_element_id to an existing element and keep parent_element_name aligned with that element name.` |
| `must contain at most 15 elements` | `Do not force more than 15 included_elements into one view. Pause and think about layered architecture: split the view into layered sub-views, attach each sub-view with parent_element_id, and move lower-level elements into the appropriate child view before retrying.` |
| `does not exist` / `references missing` | `Refresh current ids with getSystemArchitecture. Do not guess ids; use existing element, relationship, and view ids or create missing objects first.` |
| 其他错误 | `Inspect the error text, call getSystemArchitecture to refresh ids and current view membership, then retry with previewSystemArchitectureMutation before writing.` |

## 当前边界说明

| 边界 | 当前行为 |
|---|---|
| `validateSystemArchitecture` 图谱路径 | 固定校验项目目录下 `design/KG/SystemArchitecture.json`，MCP schema 不暴露 `architecturePath` |
| `getSystemArchitecture` / mutation 图谱路径 | 仍支持 `architecturePath`，主要用于测试或显式指定临时图谱 |
| 空 view | `addView` / `updateView` 允许没有成员，或 `included_elements` / `included_relationships` 是空数组 |
| 未来成员引用 | 不允许；只要 view 声明了成员 id，该元素/关系必须已存在 |
| View 关系端点 | 不允许只放关系不放端点；关系所在 view 必须同时包含 source 和 target 元素 |
| View 元素数上限 | 总校验检查全部 view；mutation 路径只对本次触达并可能改变成员数量的 view 执行上限检查，以避免无关历史问题阻断局部 mutation |
| 总校验失败引导 | 脚本输出错误列表，不生成 MCP `guidance`；mutation/focused 工具失败会生成 `guidance` |
