# AI Coding Harness: 确定性交付第一性原理 (终极稿 V6.0)

## 一、 交付可靠性主公式 (The Master Formula)

对于递归任务树中的任意节点 $i$，其最终交付可靠性 $\mathcal{R}_i$ 定义为“局部确定性”与“依赖传导力”的乘积：

$$\mathcal{R}_i = \underbrace{\Phi \left[ \frac{ \mathcal{C}(\mathbf{K}_i) \times \left( P_i \cdot \sigma(\mathbf{K}_i) + B_i \right) \times \mathcal{E}(\mathbf{K}_i) }{ G_i } \right]}_{\text{局部确定性 (Local Determinism)}} \cdot \underbrace{\prod_{j \in Children(i)} (\mathcal{R}_j)^{w_{ij}}}_{\text{递归依赖传导 (Recursive Impact)}}$$

---

## 二、 核心因子定义 (The Factors)

| 因子 | 物理含义 (高维空间视角) | 工程控制手段 (OpenCode 实现) |
| :--- | :--- | :--- |
| **$\mathcal{R}_i$ (Reliability)** | **交付可靠性**。意图子弹最终击中客观本体目标的概率。 | 监控整棵任务树的成功率仪表盘。 |
| **$\mathcal{C}(\mathbf{K})$ (Apparent Intent)** | **表观意图**。模型在当前噪声环境下感知的需求清晰度。 | **意图回放**：定时重申 PRD 摘要以对冲衰减。 |
| **$P_i$ (Protocol)** | **业务协议**。在高维空间预设的、限定坍缩路径的逻辑管道。 | **System Prompt**：明确业务规则、定义 DSL 和蓝图。 |
| **$\sigma(\mathbf{K})$ (Adherence)** | **遵循系数**。模型对 $P$ 的听从程度，随 $\mathbf{K}$ 的恶化而坍缩。 | **Context Cleaning**：通过裁剪噪声强行拉升 $\sigma$。 |
| **$B_i$ (Binding Power)** | **物理护栏**。包含“判-拦-纠”的硬闭环。不随 $\mathbf{K}$ 衰减的唯一刚性项。 | **Hook & Test**：AST 校验、编译器反馈、单元测试。 |
| **$\mathcal{E}(\mathbf{K})$ (Eff. Efficacy)** | **有效能效**。模型在处理当前信道信息时的实际“有效智商”。 | **模型选型**：在复杂上下文任务中切换高层数模型。 |
| **$G_i$ (Granularity)** | **任务颗粒度**。单次坍缩面对的搜索空间熵值。 | **动态拆解**：将复杂任务横向或纵向切割为微任务。 |
| **$\prod \mathcal{R}_j^w$ (Recursive)** | **递归传导**。子任务的不确定性对父任务引力场的“毒化”效应。 | **原子自愈**：子任务通过 $B$ 修正为 1.0 后才准交付。 |

---

## 三、 底层动力学：环境变量子公式 (The Sub-Formulas)

这些公式描述了“环境”如何通过改变高维重力场，来腐蚀或增强交付的确定性：

1.  **上下文效能场强 ($\mathbf{K}$)**：
    $$\mathbf{K}_i = \frac{\mathcal{M}(C_{i}, P_i)}{\mathcal{N}_{noise} \cdot \mathcal{D}(\Delta pos)}$$
    *   *注：$\mathcal{D}$ 为 RoPE 旋转导致的非线性距离衰减。*

2.  **表观意图坍缩 ($\mathcal{C}$)**：
    $$\mathcal{C}(\mathbf{K}_i) = C_{i, init} \cdot \xi(\mathbf{K}_i)$$
    *   *注：$\xi$ 为语义透明度系数，随噪声 $\mathcal{N}$ 指数级下降。*

3.  **约束闭环强度 ($\Gamma$)**：
    $$\Gamma_i = (P_i \cdot \sigma(\mathbf{K}_i)) + B_i$$
    *   *注：揭示了当软约束 $\sigma \to 0$ 时，硬护栏 $B$ 的唯一救赎作用。*

4.  **有效能效压制 ($\mathcal{E}$)**：
    $$\mathcal{E}(\mathbf{K}_i) = E_{raw} \cdot (1 - \text{Entropy}(\mathbf{K}_i))$$

---

## 四、 确定性交付的三大定律 (Engineering Laws)

1.  **约束代偿定律 (Law of Compensation)**：
    当上下文环境恶化（$\mathbf{K} \to 0$）导致模型认知涣散时，系统必须通过等比例增加硬性绑定力（$B$）来维持总可靠性。**“法律必须在良知失效时介入。”**

2.  **分母主导定律 (Law of the Denominator)**：
    减小 $G$（任务原子化）是提升确定性最廉价、最有效的手段。通过极致的任务拆解，可以指数级抵消模型原生智力（$E$）或意图清晰度（$C$）的不足。

3.  **递归自愈定律 (Law of Foundation Locking)**：
    可靠性在树状结构中是向上收敛的。OpenCode 必须确保任何子节点 $j$ 在向上传递坐标前，已经通过 $B_j$ 闭环修正为 $\mathcal{R}_j \approx 1$。**“绝不接受带有公差的零件进入总装线。”**

---