# ARGO 推广网站部署 — 决策树

**会话**: BusinessPartner → TaskTidy
**日期**: 2026-08-07
**场景**: 在 Test Cloud Server (120.24.114.13) 上部署 ARGO 技术交流网站
**定位**: 个人技术交流窗口（非正式产品推广），"先备着"

## 决策树

| id | parentId | level | question | MECE dimension | branchStatus | recommendedAnswer | humanDecision | businessRationale | dependencyPremises | risks | acceptanceControlPoint | acceptanceObservationPoint | horizontalConcern | verticalDependency | evidenceSource |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ROOT | — | 0 | 在 Test Cloud Server 上部署 ARGO 推广网站 | What/How/Where 三维切分 | accepted | 拆分为内容策略(A)、技术方案(B)、部署运维(C) | 确认 | 三者互不重叠且穷尽网站建设全部 concern | 云服务器已可用 (120.24.114.13, nginx, Node.js) | 内容缺失（成功案例） | 网站可访问性验证 | 浏览器打开 test.derekworkspacev5.com 正常渲染 | 内容准备 | 无 | 仓库文档 + 云服务器探测 |
| A | ROOT | 1 | 网站内容策略（What） | 内容主题切分 | accepted | 4 板块：原理(A1)、使用指南(A2)、案例观点(A3)、关于(A4) | 确认 | 四类内容互斥穷尽：理论/方法/证据/身份 | 仓库有 README、工程哲学文章、竞品对比 | A3 成功案例缺失 | 每个板块内容完整可读 | 页面渲染后各 section 内容非空 | 内容生产 | 依赖 A1-A4 收敛 | 仓库文档遍历 |
| A1 | A | 2 | 原理板块内容来源 | 内容适应性 | accepted | 确定性交付公式 + 工程哲学 C/P/B/E/G + 竞品差异化定位 | 确认 | 现有文档质量高、中文完整，可直接降维改编为网站板块 | `notes/ai-engineering/ARGO 工程哲学.md` 等 | 长文变短板块可能丢失精度 | 原理板块 < 3 分钟可读完 | 浏览器中原理 section 存在且含公式 | 内容改编 | 依赖 A1 资产可用 | `notes/ai-engineering/` 文档 |
| A2 | A | 2 | 使用指南内容来源 | 内容适应性 | accepted | Quick Start 安装步骤 + Agent Loop 流程图 + 三平台入口选择 | 确认 | README_CN.md 已有完整内容，需做可视化增强 | README_CN.md Quick Start + 使用场景文档 | 纯文字步骤需配截图 | 技术同行 10 分钟内可理解使用流程 | 指南 section 含 Cursor/Copilot/OpenCode 三平台入口 | 内容可视化 | 依赖 A2 资产可用 | README_CN.md + usage-scenarios |
| A3 | A | 2 | 案例/观点板块内容来源 | 成功案例存在性 | accepted（替代方案） | A3' 观点洞察 + A3'' ARGO Dogfooding + TEST 占位 | 确认：先留好位置，放 TEST 案例占位 | 仓库无成功案例(H-A3 refuted)；替代为观点文章 + 自我演示 | `notes/ai-engineering/` 下 7+ 篇观点文章 | Dogfooding 案例需整理 ARGO 用自己交付的过程 | 观点 section 含至少 1 篇文章链接 + Dogfooding 说明 + TEST 占位 | 页面案例 section 有 TEST 占位标记 | 内容生产 | A3 依赖替代方案确认 | 全仓搜索 → 零成功案例 |
| A4 | A | 2 | 关于/联系板块 | 身份信息 | accepted | GitHub 链接 + 轻量项目介绍 | 确认 | 技术交流场景必备身份标识 | GitHub 仓库地址 | 无 | 关于 section 含 GitHub 链接 | 页面关于 section 可点击跳转 GitHub | 身份标识 | 无 | 用户确认 |
| B | ROOT | 1 | 技术实现方案（How） | 技术决策维度 | accepted | Hexo SSG + Giscus 留言 | 确认 | 需流行框架 + 留言互动 | 服务器 Node.js v22.22.1 | 无 | hexo g 生成成功 | 静态文件产出到 public/ 目录 | 技术选型 | 依赖 B1-B3 收敛 | 服务器环境探测 + 框架调研 |
| B1 | B | 2 | 前端技术栈 | 框架流行度 + 服务器适配 | accepted | Hexo (Node.js SSG，国内流行度最高) | 确认 | 纯静态输出，零服务器运行时；npm 生态；主题丰富 | 服务器已有 Node.js | 无 | hexo 项目初始化成功 | hexo init 无报错 | 技术栈 | 无 | 框架对比分析 |
| B2 | B | 2 | 内容管理方式 | 更新频率 | accepted | Hexo Markdown 源文件 → hexo generate 静态 HTML | 确认 | "先备着"场景更新频率低，Markdown 足够 | Hexo 标准工作流 | 无 | Markdown 源文件格式正确 | hexo g 无 front-matter 解析错误 | 内容管理 | 依赖 Hexo 安装 | Hexo 文档 |
| B3 | B | 2 | 留言互动方案 | 互动需求 + 零维护 | accepted | Giscus（GitHub Discussions 驱动） | 确认 | 需要和用户有互动（留言回复）；Giscus 零服务器存储、GitHub 账号天然防 spam | GitHub 仓库需启用 Discussions | GitHub Discussions 未启用则 Giscus 无法初始化 | Giscus 评论区在页面底部正常渲染 | 页面底部可见留言输入框 | 互动功能 | 依赖 GitHub Discussions 启用 | Giscus 官方文档 |
| C | ROOT | 1 | 部署与运维（Where） | 运维关注点 | accepted | hexo g → SCP 静态文件 → nginx serve | 确认 | 服务器 nginx 已配置 test.derekworkspacev5.com | 云服务器 nginx 运行正常 | 无 | 网站可通过域名访问 | 浏览器 http://test.derekworkspacev5.com 返回 200 | 部署 | 依赖 Hexo 构建完成 | 云服务器探测 |
| C1 | C | 2 | 部署方式 | 部署复杂度 | accepted | 本地 hexo g 构建 → scp public/ 到 /var/www/test.derekworkspacev5.com/ | 确认 | nginx 已配置该域名，直接替换现有测试页 | `/var/www/test.derekworkspacev5.com/` 目录存在 | SCP 权限 | 文件上传成功，nginx 正常 serve | curl 返回新网站内容 | 部署 | 依赖 nginx 配置 | 服务器文件系统探测 |
| C2 | C | 2 | 域名 | 域名可用性 | accepted | 先用 test.derekworkspacev5.com | 确认：先用这个域名 | 已有 DNS 解析 + nginx 配置，零额外工作 | DNS 已解析到 120.24.114.13 | "test" 前缀不够正式 | 域名可解析并访问 | dig/nslookup 返回正确 IP | 访问入口 | 无 | DNS + nginx 配置验证 |

## MECE 维度声明

| 层级 | 维度 | MECE 论证 |
|---|---|---|
| Level 0→1 (ROOT→A/B/C) | What/How/Where | 内容(What)、技术(How)、部署(Where)三者互不重叠且完全穷尽建站全部 concern |
| Level 1→2 (A→A1/A2/A3/A4) | 内容主题 | 原理(理论)/指南(方法)/案例(证据)/关于(身份)，四类互斥且穷尽技术站点内容类型 |
| Level 1→2 (B→B1/B2/B3) | 技术决策维度 | 框架选型/内容管理/互动方案三者独立且穷尽技术方案全部决策点 |
| Level 1→2 (C→C1/C2) | 运维维度 | 部署方式/访问入口二者独立且穷尽上线运维全部关注点 |

## 假设验证记录

| 假设 ID | 假设陈述 | 证伪条件 | 结论 | 证据 |
|---|---|---|---|---|
| H-A1 | 仓库原理文档可直接改编 | 内容过于学术、缺中文、重复过多 | supported | `notes/ai-engineering/` 下多篇高质量中文文档 |
| H-A2 | Quick Start 可支撑使用指南 | 不足以让技术同行 10 分钟理解 | supported | README_CN.md 含三平台安装 + Agent Loop 流程 + 入口选择 |
| H-A3 | 存在可公开成功案例 | 仓库无具体案例 | **refuted** | 全仓搜索仅命中 2 处泛泛引用，非 ARGO 自身案例 |
| H-A3' | 观点文章 + Dogfooding 可替代 | — | supported | 用户确认：同意替代 + TEST 占位 |
| H-B1 | 纯静态是最优方案 | 需动态渲染/CMS/复杂交互 | **superseded** | 用户要求留言互动，升级为 Hexo + Giscus |
| H-B1' | Hexo + Giscus 最优 | 无更优互动方案 | supported | Hexo 国内最高流行度 + Giscus 零维护留言 |
| H-B2 | 直接写 HTML | 更新频繁 | supported | "先备着"场景 |
| H-B3 | 单页滚动 | 内容量过大 | supported | 4 板块中等篇幅 |
| H-C1 | SCP 直接部署 | nginx 配置不满足 | supported | 现有 nginx server block 完全满足 |

## 残余协调事项 (Residual Coordination)

1. **GitHub Discussions 启用状态**：Giscus 留言依赖仓库启用 Discussions。需确认 `derekwoo/AICodingAgent` 或目标仓库是否已启用 Discussions 功能。
2. **Dogfooding 案例内容**：ARGO 用自己交付自己的过程需整理为可读案例文章，当前仅有流程框架。
3. **TEST 占位案例**：用户要求放一个 TEST 案例占位，具体内容和格式待定。
