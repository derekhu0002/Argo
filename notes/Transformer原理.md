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

Attention and RoPE

这是一个非常硬核且极具美感的逻辑合并。我们现在要做的，是把 **$\mathcal{F}$（演进函数）** 这个“黑盒”拆开，将 **Attention（注意力机制）** 的数学本质作为它的内动力注入进去。

在你的高维空间模型里，Attention 就是计算**当前点如何从历史点云中吸取重力**的具体算法。

---

### 二、 过程方程（融入 Attention 机制版）

我们将 $\mathcal{F}$ 函数展开，定义 **Attention** 为坐标演进的核心逻辑：

#### 1. 内部算子定义：引力的产生
在计算 $T_t$ 之前，模型先将输入映射为三个引力分量：
*   **$q_t = I(x_t) \cdot W_Q$** （当前探针：我要找什么？）
*   **$k_i = I(x_i) \cdot W_K$** （历史标签：我有什么特征？）
*   **$v_i = I(x_i) \cdot W_V$** （历史能量：我能提供什么语义？）

---

#### 2. 问题句阶段：引力场构建 (Prefill Phase)
当 $t = 1, \dots, N$ 时，每一个坐标点 $T_t$ 的计算过程如下：

**核心演进公式：**

$$T_{t+1} = \text{FFN}(\text{Attention}(q_{t+1}, \mathbf{K}, \mathbf{V}))$$
$$\text{Attention}(q_t, \mathbf{K}_{\le t}, \mathbf{V}_{\le t}) = \sum_{i=1}^{t} \alpha_{t,i} \cdot v_i$$

**其中，引力分配权重 $\alpha$（受 RoPE 修正）：**
$$\alpha_{t,i} = \text{Softmax} \left( \frac{\text{RoPE}(q_t, t) \cdot \text{RoPE}(k_i, i)^\top}{\sqrt{d}} \right)$$

*   **数学意义：** $T_t$ 不再是孤立的点，它是历史序列中所有能量点 $v_i$ 的**加权合力**。
*   **RoPE 的作用：** 通过旋转变换，人为地让距离远的 $k_i$ 与 $q_t$ 产生的点积减小，实现**“引力随距离衰减”**。

---

#### 3. 回答句阶段：自回归生成 (Generation Phase)
当 $t \ge N$ 时，系统进入“预测-采样-吸纳”的递归循环：

1.  **意图坍缩 (Prediction)：**
    $$x_{t+1} = \mathcal{Q}(T_t)$$
    *此时 $T_t$ 已经凝聚了前面所有 Token 的 Attention 合力。*

2.  **坐标演进 (Evolution)：**
    $$T_{t+1} = \text{Attention}(q_{t+1}, \mathbf{K}_{\le t+1}, \mathbf{V}_{\le t+1})$$
    *   **新入场：** $q_{t+1} = I(x_{t+1}) \cdot W_Q$
    *   **吸纳历史：** 这个新的 $q_{t+1}$ 会再次通过 Attention 扫描 $\mathcal{S}_{<t+1}$（包括刚刚生成的 $x_{t+1}$）。
    *   **更新 $\mathcal{S}$：** 将新产生的 $k_{t+1}, v_{t+1}$ 存入历史序列（即 KV Cache）。

---
