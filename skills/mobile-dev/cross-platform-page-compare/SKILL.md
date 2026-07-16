---
name: cross-platform-page-compare
description: Cross-platform page comparison SKILL — orchestrates android-window-analysis and window-analysis SKILLs to compare Android and HarmonyOS pages. Captures layouts, screenshots, diffs elements, and generates TOP3 gap specifications with visual acceptance criteria. Use when you need to compare a specific Android page against its HarmonyOS counterpart.
---

# Cross-Platform Page Compare SKILL

Orchestrates a complete cross-platform page comparison workflow:
Android ↔ HarmonyOS 页面对比分析 + 差异规格生成。

---

## 前置检查 (MANDATORY — 缺一则停止)

在开始对比前，必须从用户处获取以下**至少 3 项**信息。如任何必填项缺失，**立即反馈用户要求补充，不得继续**：

| # | 必填项 | 说明 | 示例 |
|---|---|---|---|
| 1 | **待对比页面名称** | 安卓和鸿蒙分别是什么页面 | `HOME/Feed 页`, `Search 页`, `Cart 页` |
| 2 | **安卓项目路径** | 安卓源码 + APK 所在目录 | `D:\Projects\ANDROID-2-HARMONYOS\demo-Jetsnack-android` |
| 3 | **鸿蒙项目路径** | 鸿蒙源码 + HAP 所在目录 | `D:\Projects\ANDROID-2-HARMONYOS\work` |
| 4 | **其他补充信息** (可选) | 如页面特征文本、Activity 类名、特定操作步骤等 | `"Android's picks"`, `com.example.jetsnack/.ui.MainActivity`, `需要先点搜索Tab再截图` |

> ⚠️ **如果用户未提供前 3 项中的任何一项，立即停止并询问用户。** 第 4 项为可选，缺失时可自行推断。

---

## Runtime Boundary

- **本 SKILL 是编排者 (Orchestrator)**: 不直接操作设备，而是调用子 SKILL
- **依赖的 SKILL**: `emulator-setup`, `android-window-analysis`, `window-analysis`
- **输出归档目录**: `design/analysis/[datetime]-[page]_COMPARE/`

---

## 完整工作流 (6 步)

### Step 0: 输入验证

```
IF 用户未提供 {页面名称, 安卓路径, 鸿蒙路径} 中的任一项:
    → 停止，列出缺失项，要求用户补充
ELSE:
    → 继续 Step 1
```

### Step 1: 环境准备 (委托 emulator-setup SKILL)

参考 `.github/skills/emulator-setup/SKILL.md` 执行：

```
1.1 检查 Android 模拟器:
    adb devices
    → 无设备 → 按 emulator-setup SKILL 冷启动 Medium_Phone
    → 等待 boot_completed=1

1.2 检查鸿蒙模拟器:
    hdc list targets
    → 无设备 → 按 emulator-setup SKILL 启动鸿蒙模拟器
    → 等待 hdc list targets 返回设备
```

> **工具路径参考**: `emulator-setup/SKILL.md` 中的 Known Tool Locations 表

### Step 2: 启动 App 并进入目标页面

```
2.1 Android:
    adb shell am force-stop <package>
    adb shell am start -n <package>/<activity>
    等待 5 秒

2.2 HarmonyOS:
    hdc shell aa force-stop <bundle>
    hdc shell aa start -a <ability> -b <bundle>
    等待 5 秒
```

> 如果页面需要额外操作才能到达（如从 HOME 点 Search tab 到 Search 页），执行对应 tap/navigate 操作。

### Step 3: 抓取页面数据 (委托 android-window-analysis SKILL + window-analysis SKILL)

参考 `.github/skills/android-window-analysis/SKILL.md` 和 `.github/skills/window-analysis/SKILL.md`：

```
3.1 Android 布局:
    adb shell uiautomator dump /sdcard/ui_dump.xml
    adb pull /sdcard/ui_dump.xml <archiveDir>/android_layout.xml

3.2 Android 截图:
    adb shell screencap -p /sdcard/screenshot.png
    adb pull /sdcard/screenshot.png <archiveDir>/android_screenshot.png

3.3 HarmonyOS 布局:
    hdc shell uitest dumpLayout -p /data/local/tmp/layout.json -b <bundle>
    hdc file recv /data/local/tmp/layout.json <archiveDir>/harmony_layout.json

3.4 HarmonyOS 截图:
    hdc shell snapshot_display -f /data/local/tmp/screenshot.jpeg
    hdc file recv /data/local/tmp/screenshot.jpeg <archiveDir>/harmony_screenshot.jpeg
```

### Step 4: 程序化对比分析

使用各 SKILL 的 `--dump-json` 模式获取结构化数据，执行差异分析：

```
4.1 运行分析器:
    python android-window-analysis/layout-analyzer.py <android_layout.xml> --dump-json > a.json
    python window-analysis/layout-analyzer.py <harmony_layout.json> --dump-json > h.json

4.2 计算差异:
    - 文本差异: set(a.all_labels) - set(h.texts)  vs  set(h.texts) - set(a.all_labels)
    - Tab 差异: Android content-desc vs HarmonyOS text (大小写/emoji 归一化)
    - 组件数量差异: a.component_count vs h.component_count
    - 可交互元素差异: a.clickable_count vs h.clickable_count
    - 组件类型差异: a.class_counts vs h.type_counts
    - 截图差异: 肉眼对比或像素差异分析

4.3 差异分级:
    🔴 高: 核心动效缺失 (共享过渡、Tab 动画、Highlight 卡片)
    🟠 中: 静态元素缺失 (tagline、筛选图标、箭头按钮)
    🟡 低: 风格差异 (emoji vs text、大小写)
    🟢 信息: 架构差异 (Scroll vs LazyColumn、像素密度)
```

### Step 5: 生成分析报告

生成 `HOME_PAGE_DIFF_REPORT.md`，包含：

```
# [页面名] 跨平台差异分析报告

## 1. 运行时概览
| 指标 | Android | HarmonyOS | 差异 |
(组件数、文本数、可交互数、图片数、截图文件)

## 2. 静态元素差异
(逐区域对比: 地址栏、筛选栏、分区标题、卡片内容、Tab 栏)

## 3. 布局差异
(渲染模式、组件类型映射、坐标归一化对比)

## 4. 动效差异
(共享过渡、Tab 动画、列表动效、筛选动效)

## 5. 差异汇总矩阵
(表格: #, 差异项, 类别, 严重度, 说明)

## 6. 附件清单
(所有原始数据文件列表)
```

### Step 6: 生成 TOP3 需求规格

从差异中选取严重度最高的 3 项，为每项生成详细规格文档 `ANIMATION_GAP_SPEC.md`：

**规格模板 (每项):**

```
## 缺口 N: [名称]

### N.1 当前状态 (对比表)

### N.2 涉及的组件/元素 (逐元素定义)
  - 每个元素的: 尺寸(dp/px)、位置(对齐方式)、颜色(token)、字体(大小/粗细)

### N.3 布局参数 (如果涉及布局变化)

### N.4 动画参数 (如果涉及动效)
  - 触发条件、持续时间、弹簧参数(damping/stiffness)、缓动曲线

### N.5 最终视觉效果 (用户看到什么)
  - ASCII 示意图
  - 时间线分解 (t=0ms → t=Nms)
  - 用户感知表 (阶段 | 看到什么 | 物理感知)
  - 关键视觉特征 (子弹点清单)

### N.6 验收标准
  A. 技术标准 (可自动化验证):
     - [ ] 使用 --dump-json 验证文本存在
     - [ ] 使用 --min-components 验证渲染完整性
     - [ ] 使用 --find-text 验证特定元素
     - [ ] 截图 --not-blank 验证页面不空白

  B. 人类视觉验收标准 (需肉眼确认):
     - [ ] 动画流畅度: 过渡无跳帧/闪烁/卡顿
     - [ ] 弹性感: Spring 回弹幅度约 10-15%, 不死板
     - [ ] 色彩一致性: 渐变过渡无突变色带
     - [ ] 布局对齐: 元素在动画前后位置精确对应
     - [ ] 圆角 morph: 20dp→0dp 过渡平滑无锯齿
     - [ ] 视差效果: 背景以 1/3 速率移动, 自然不晕眩
     - [ ] (根据具体缺口补充)
```

---

## 输出归档结构

```
design/analysis/[YYYYMMDD-HHMM]-[PAGE]_COMPARE/
├── HOME_PAGE_DIFF_REPORT.md       # 完整对比分析报告
├── ANIMATION_GAP_SPEC.md          # TOP3 动效缺口规格
├── android_layout.xml             # Android uiautomator dump
├── android_screenshot.png         # Android 截图
├── harmony_layout.json            # HarmonyOS uitest dump
└── harmony_screenshot.jpeg        # HarmonyOS 截图
```

---

## 关键约定

| 约定 | 说明 |
|---|---|
| **先问再动** | 缺任何必填信息 (页面名称/安卓路径/鸿蒙路径) → 停止, 问用户 |
| **委托不重复** | 模拟器启动 → `emulator-setup`; 布局分析 → `android-window-analysis` / `window-analysis` |
| **机器对比 + 人工确认** | `--dump-json` 做程序化 diff, 动效/视觉由人确认 |
| **归档即交付** | 所有产物落入 `design/analysis/[datetime]-[page]_COMPARE/` |
| **规格可执行** | 每个缺口都有技术验收标准 + 人类视觉验收标准 |

---

## 错误处理

| 场景 | 处理 |
|---|---|
| 模拟器无法启动 | 参考 `emulator-setup` Troubleshooting: 杀进程 → 删 lock → 重启 ADB → 冷启动 |
| 布局 dump 为空 | App 可能未在前台, 截图确认, 重新 launch |
| 布局组件数异常少 (< 10) | 页面可能未完全渲染, 增加等待时间, 重试 |
| `--dump-json` 编码错误 | 分析器已配置 `stdout.reconfigure(encoding='utf-8')` + `ensure_ascii=True` |
| 两端文本数相差 > 50% | 可能不是同一页面或鸿蒙侧功能缺失, 截图人工确认 |
