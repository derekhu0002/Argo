# Argo 使用说明

## 使用步骤

### 1. 安装插件

1. 打开 VS Code 插件市场。
2. 搜索 `Argo - Agentic Workflow Orchestrator`。
3. 点击安装。
4. 用 VS Code 打开你的目标项目工作区。

### 2. 在 EA 中建模并导出意图架构图谱

1. 在 EA 中完成意图架构建模。
2. 在相关意图元素上挂显性测试用例。
3. 为每个显性测试用例填写 `acceptanceCriteria`。
![alt text](image-2.png)
4. 通过 EA 导出脚本生成 `design/KG/SystemArchitecture.json`。
![alt text](image.png)
5. 确认目标项目中存在 `design/KG/SystemArchitecture.json`。

### 3. 准备目标项目目录

目标项目至少准备以下内容：

```text
your-project/
├── design/
│   └── KG/
│       ├── SystemArchitecture.json
│       └── test-failure-records.json
└── tests/
```

显性测试入口使用的脚本文件后缀应为以下之一：

- `.js`
- `.cjs`
- `.mjs`
- `.py`
- `.ps1`
- `.cmd`
- `.bat`

### 4. 执行 `/implementationdesign`

1. 打开 VS Code Chat。
2. 输入以下命令：

```text
@argowork /implementationdesign
```

3. 复制生成的提示词。
4. 将提示词交给 Coding Agent。
5. 让 Coding Agent 基于意图架构和显性测试用例完成实现架构设计。

### 5. 接收实现架构设计交付物

执行完 `/implementationdesign` 后，检查仓库中是否已交付以下内容：

1. 目录和文件结构。
2. 根目录 `OVERALL_ARCHITECTURE.md`。
3. 各关键目录下的 `ARCHITECTURE.md`。
4. 回填后的显性测试入口。
5. 关键非显性测试用例。
6. 非关键非显性测试用例。

### 6. 执行 `/work`

1. 在 VS Code Chat 中输入以下命令：

```text
@argowork /work
```

2. 等待显性测试执行完成。
3. 检查生成的 `design/KG/test-failure-records.json`。
4. 复制 `/work` 生成的提示词。
5. 将提示词交给 Coding Agent。

### 7. 让 Coding Agent 编码

1. 让 Coding Agent 基于以下输入进行实现：`design/KG/SystemArchitecture.json`、`OVERALL.md`、相关目录下的 `ARCHITECTURE.md`、显性测试入口、非显性测试用例、`design/KG/test-failure-records.json`。
2. 让 Coding Agent 以通过所有测试用例为目标完成编码。

### 8. 回归验证

1. 再次执行：

```text
@argowork /work
```

2. 重复“编码 -> `/work` 回归”直到所有测试通过。

## 正向流程

```text
意图架构（含显性测试用例定义的验收标准） -> 【实现架构设计】 -> 实现架构（含具体实现的显性和非显性测试用例） -> 【编码】 -> 代码
```

## 逆向实现关系

```text
【编码】通过满足所有测试用例，实现代码对实现架构、意图架构的实现
```

## 命令清单

### `@argowork /implementationdesign`

用途：生成实现架构设计提示词。

### `@argowork /work`

用途：执行显性测试，生成失败记录和编码提示词。

PS：执行该命令后，所有模型中挂在的测试用例对应的测试入口文件都会被锁定，在此期间无法修改，如果CODING AGENT来修改则会报错提示“禁止修改”，从而避免了AGENT通过修改测试用例来使得用例通过。

![alt text](image-1.png)
下方图标显示 "Argo:coding" 则说明当前处于编码阶段，显性测试用例被锁定无法修改。

### `@argowork /idle`

用途：退出当前 guard 阶段。