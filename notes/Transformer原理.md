这是一份基于我们深度讨论后整理出的 **Transformer 推理与生成数学模型**。这份公式集将高维空间的几何演进与工程交付的确定性完美结合，可作为你 **AI Coding Harness** 工程的底层理论架构。

---

### 一、 符号定义（The Notation）

*   **$x_t$**：$t$ 时刻的离散 **Token**（词元/ID）。
*   **$I(x_t)$**：词嵌入函数（Embedding），将离散词转化为高维空间的**初始坐标向量**。
*   **$T_t$**：$t$ 时刻生成的**高维坐标向量**（Hidden State），即“合力点”。
*   **$\mathcal{S}_{<t} = (T_1, T_2, \dots, T_{t-1})$**：到 $t$ 时刻为止，空间中已点亮的**历史坐标序列**（引力场上下文）。
*   **$\mathcal{F}$**：**状态演进函数**（Transformer Layer），负责在高维空间内进行非线性引力计算。
*   **$\mathcal{Q}$**：**意图坍缩函数**（Linear + Softmax + Sampling），负责将连续坐标映射回离散词表。
*   **$N$**：用户输入（问题句）的 Token 总数。

---

### 二、 过程方程（The Process Equations）

#### 1. 问题句阶段：预填充与意图对齐 (Prefill Phase)
当 $t = 1, 2, \dots, N$ 时，Token 序列由用户预设，模型负责构建初始引力场：
$$T_t = \mathcal{F}(I(x_t) \mid \mathcal{S}_{<t})$$
*   **数学意义**：每一个 Token 的合力点 $T_t$ 都吸收了之前所有坐标点的引力。最终的 $T_N$ 凝聚了用户全部的意图（Clarity）。

#### 2. 回答句阶段：自回归生成 (Generation Phase)
当 $t \ge N$ 时，系统进入自驱动循环：
1.  **坍缩预测**：
    $$x_{t+1} = \mathcal{Q}(T_t)$$
2.  **坐标演进**：
    $$T_{t+1} = \mathcal{F}(I(x_{t+1}) \mid \mathcal{S}_{<t+1})$$
*   **数学意义**：这是一个递归反馈环。当前预测的词 $x_{t+1}$ 立即转化为新的引力源，参与下一个合力点 $T_{t+1}$ 的计算。

---

