
**1. 业务目标**  
构建 Argo 项目的官方静态网站，作为产品的“对外介绍窗口”和“思想沉淀基地（POST）”。

**2. 关键能力要求 (Key Capabilities)**

- **首页 (Hero Page)**：展示项目愿景（心智模型图、一句话介绍、核心优势）。
    
- **架构文档 (Architecture Docs)**：自动读取仓库内的 OVERALL_ARCHITECTURE.md 和各级 ARCHITECTURE.md。
    
- **博客模块 (Blog/Posts)**：支持在 website/blog 目录下通过 Markdown 撰写并发布文章。
    
- **图谱可视化 (KG Viewer)**：集成一个页面，动态解析并渲染 design/KG/SystemArchitecture.json。
    

**3. 实现架构设计约束 (Implementation Constraints)**

- **技术栈**：建议使用 Docusaurus (React) 或 VitePress (Vue)。
    
- **部署方案**：使用 GitHub Actions 自动构建并部署至 GitHub Pages。
    
- **目录结构**：
    
    - website/ : 存放网站框架。
        
    - website/blog/ : 存放动态 POST。
        
    - website/docs/ : 通过符号链接或配置，直接引用根目录的架构文档。
        

**4. 显性验收基线 (Explicit Testcases)**

- **Test_01**: 访问 /blog 路径能看到测试博文。
    
- **Test_02**: 访问 /docs 能看到仓库根目录 OVERALL_ARCHITECTURE.md 的内容。
    
- **Test_03**: 网站部署后的首屏加载时间在 2s 内。