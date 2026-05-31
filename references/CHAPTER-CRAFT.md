# 场景开发指南

## Part 0: 十条原则

1. 16:9 固定舞台：1920x1080，无响应式
2. 帧驱动动画：useCurrentFrame() 是唯一时间源
3. 每场景独占整屏：AbsoluteFill 包裹
4. 音频 = 时长真相源：wav 秒数 x 30 = 帧数（从 WAV header 计算）
5. Sequence 编排：Sequence from={N} durationInFrames={M}
6. 确定性渲染：无随机、无异步、无时间依赖
7. 内容驱动动画：动画服务于内容，不是装饰
8. 逐项揭示：列表/卡片逐个淡入，不要同时出现
9. 设计系统统一：tokens.css 管理颜色/字体
10. 反 AI 味：不要紫粉渐变、emoji、SVG 画人

## Part 1: 场景开发流程

### 开工 10 问

1. 这个场景的核心信息是什么？
2. 观众应该先看什么、后看什么？
3. 音频在说什么？（对齐口播节奏）
4. 用什么动画模式？（淡入/滑入/缩放/逐项）
5. 有没有需要从 article.md 补充的细节？
6. outline 里这个场景的卡片形态标注是什么？（标准卡① / Oat卡② / Feature暗卡③ / 终端卡④）
7. 这个场景是简洁帧还是密集帧？如果是密集帧，用 D1-D6 哪一种？
8. 观众任务是什么？这一屏让观众看懂、记住还是判断？
9. 视觉重音等级是什么？Level 1-5 中只能有一个主重音。
10. 留存节拍是什么？Hook / Map / Reveal / Contrast / Payoff。

### 场景规划闸门

写任何 Scene 组件前，先补齐：

```markdown
- Scene X: 场景名称（时长, audio.wav）
  - 解释单元：概念 / 机制 / 代码证据 / 对比 / 总结（信息/科普解释模式必填）
  - 观众问题：这一屏回答哪个疑问？（信息/科普解释模式必填）
  - 证据来源：article.md / feynman-notes.md / 代码路径 / 数据来源（信息/科普解释模式必填）
  - Payoff 句：观众应该记住的一句话（信息/科普解释模式必填）
  - 帧型：简洁帧 / 密集帧 D1-D6
  - 观众任务：看懂/记住/判断什么
  - 视觉重音：Level 1-5
  - 留存节拍：Hook / Map / Reveal / Contrast / Payoff
  - 色彩策略：中性色为主，accent/辅助色用途
  - 字幕安全：核心内容 y < 930，底部留 160px
```

不要在编码阶段临时决定帧型、重音和卡片形态。详细判断见 `CREATIVE-GAP-PLAYBOOK.md`。

## Part 2: 动画模式库

### 淡入 + 上滑
```tsx
const FAST = 18;
const opacity = interpolate(frame, [delay, delay + FAST], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
});
const y = interpolate(frame, [delay, delay + FAST], [30, 0], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
});
```

### 缩放弹入
```tsx
const scale = interpolate(frame, [delay, delay + 20], [0.85, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)),
});
```

### 逐项延迟（列表/卡片）
```tsx
items.map((item, i) => {
  const delay = 10 + i * 8;
  const opacity = interpolate(frame, [delay, delay + FAST], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
});
```

### 音频对齐动画（延迟对齐 + 快速动画）
```tsx
const FAST = 18;
const BULLET_FRAMES = [252, 375, 470]; // 音频提到要点的时刻

const bulletOp = (i) => interpolate(
  frame, [BULLET_FRAMES[i], BULLET_FRAMES[i] + FAST], [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
);
```

### "出现就留下"
```tsx
const exitOp = 1; // 不加退出动画
```

### 旋转（加载指示器）
```tsx
const rotation = interpolate(frame, [0, 300], [0, 1080], {
  extrapolateRight: 'clamp',
});
```

### 数字递增
```tsx
const value = interpolate(frame, [startFrame, endFrame], [0, targetValue], {
  extrapolateRight: 'clamp',
});
```

### 打字机效果
```tsx
const charCount = Math.floor(interpolate(
  frame, [startFrame, startFrame + text.length * 2], [0, text.length],
  { extrapolateRight: 'clamp' }
));
const visibleText = text.slice(0, charCount);
```

### 明暗主题组件

整场景暗色（推荐，必须用 AbsoluteFill）：
```tsx
<AbsoluteFill className="dark-theme" style={{ padding: 100 }}>
  <h1 style={{ color: 'var(--c-text)' }}>标题</h1>
</AbsoluteFill>
```

场景内局部切换（18 帧 easeInOut）：
```tsx
const SWITCH_FRAME = 100;
const SWITCH = 18;
const bgColor = interpolateColor(frame,
  [SWITCH_FRAME, SWITCH_FRAME + SWITCH],
  ['#FAF9F5', '#191917'],
  { easing: Easing.inOut(Easing.cubic) }
);
```

注意：不要用 CSS transition，Remotion 不支持。必须用 interpolateColor。

分屏对比（左右明暗）：
```tsx
<div style={{ display: 'flex', width: '100%', height: '100%' }}>
  <div style={{ width: '50%', background: 'var(--c-bg)', color: 'var(--c-text)' }}>{/* 亮 */}</div>
  <div className="dark-theme" style={{ width: '50%' }}>{/* 暗，className 自动切换 CSS 变量 */}</div>
</div>
```

### SVG 描边动画
```tsx
const lineProgress = interpolate(frame, [startFrame, endFrame], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
<path d={CURVE_PATH}
  strokeDasharray={CURVE_LENGTH}
  strokeDashoffset={CURVE_LENGTH * (1 - lineProgress)} />
```

### 卡片速查表

```tsx
// ① 标准卡
{ background: 'var(--c-card-bg)', border: '0.5px solid var(--c-card-border)', borderRadius: 8 }

// ② Oat 卡（无边框，靠颜色区分）
{ background: 'var(--c-card-oat-bg)', borderRadius: 8 }

// ③ Feature 暗卡（按需使用，每章最多 2 个，只放单句结论）
{ background: 'var(--c-card-feature-bg)', borderRadius: 24, color: 'var(--c-card-feature-text)' }

// ④ 终端卡
{ background: 'var(--c-card-terminal-bg)', borderRadius: 24, color: 'var(--c-card-terminal-text)' }

// 辅助色用法见 SKILL.md "辅助色三层使用模型"，禁止做整块容器背景

// 亮底暗卡片容器（代码在亮色场景时用，不切整页）
<AbsoluteFill style={{ background: 'var(--c-bg)', padding: '80px 100px' }}>
  {/* 正文内容 */}
  <div style={{ background: 'var(--c-card-terminal-bg)', borderRadius: 24, padding: '48px 56px' }}>
    {/* 代码内容 */}
  </div>
</AbsoluteFill>
```

## Part 3: 组件库

### Terminal 组件
```tsx
<div style={{
  width: 800,
  background: 'var(--c-terminal-bg)',
  borderRadius: 24,
  overflow: 'hidden',
}}>
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', background: '#242423',
  }}>
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
  </div>
  <div style={{ padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
    {children}
  </div>
</div>
```

### StageIntro 组件
居中布局，STAGE 标签 + 大号编号 + 分隔线 + 标题 + 英文副标题

## Part 4: 布局构图规则

> 不是 PPT，是视频。每帧都要有"戏"。

### 两种帧型

**简洁帧（氛围感）**
- 作用：建立预期、制造悬念、给观众喘息、强化关键词
- 特征：大字标题（48-72px）、大面积留白（40%+）、不对称偏置、深色背景居多
- 适用：章节开场、概念预告、核心结论、情感高潮
- 参考：大字独白、偏置构图、标题在下、底部信息栏

**密集帧（信息量）**
- 作用：传递具体信息、展示数据对比、提供完整解释
- 特征：有数据表/对比/解释、多层级排版、结构化布局、底部有结论
- 适用：特性详解、性能对比、架构图解、代码+运行结果
- 参考：数据表格+条形图、左右分栏、2×2 网格、问题-改进对比

### 帧型选择决策器

| 口播信号 | 优先帧型 | 画面任务 | 推荐模板 |
|------|------|------|------|
| "先记住一句话"、"真正的问题是" | 简洁帧 | 制造停顿、建立预期、强化关键词 | 大字独白 / 偏置构图 / 暗色章节点 |
| "有三个原因"、"分成四步" | 密集帧 | 让结构完整可见，逐项揭示 | D3 编号列表 / D5 网格卡片 |
| "对比一下"、"改进前后" | 密集帧 | 把差异放在同一视野内 | D1 数据表格 / D6 问题-改进对比 |
| "这里很反直觉"、"注意这个细节" | 简洁帧 → 密集帧 | 先打断，再解释 | 简洁悬念帧 → D4 代码/解释 |
| "到这里可以得出结论" | 简洁帧 / Feature 暗卡 | 回收信息，让观众能复述 | 大字结论 / Feature 暗卡 |

简洁帧不能只是空，必须承担悬念、转折、总结、喘息中的一个任务。

### 视觉重音体系

同一帧最多一个主重音：

| 等级 | 用途 | 允许手段 |
|------|------|------|
| Level 1 词级 | 关键词、参数名、术语 | accent 文本、下划线、色点 |
| Level 2 项级 | 当前列表项/代码行 | 左边框、编号圆点、当前行高亮 |
| Level 3 区块级 | 一个区域比其他区域重要 | Oat 卡、浅 tint 提示、细边框 |
| Level 4 帧级 | 核心结论、章节转折 | 简洁帧、暗色主题、Feature 暗卡 |
| Level 5 节奏级 | 情绪变化、段落换挡 | 明暗切换、留白、短暂停顿 |

禁止所有项同时高亮、之前项永久高亮、同章反复使用 Feature 暗卡、用高饱和整块背景制造重音。

### 观众留存节拍

| 节拍 | 作用 | 常用画面 |
|------|------|------|
| Hook | 让观众进入问题 | 简洁帧、反差句、大数字 |
| Map | 告诉观众这段怎么走 | 简洁帧 + 3-5 个标签 |
| Reveal | 逐项交付信息 | 密集帧逐项淡入 |
| Contrast | 制造判断感 | 左右对比、前后对比、代码旧新对照 |
| Payoff | 让观众能复述 | 结论条、Feature 暗卡、金句帧 |

- 开场 8 秒内直接给问题、反差或承诺，不先铺背景。
- 每 20-35 秒至少一次轻转折。
- 每 60-90 秒一句结构回收。
- 结尾 12 秒给压缩版答案。

### 解释单元到场景映射

信息/科普解释模式会在 `outline.md` 标注解释单元。开发场景时按下表选构图：

| 解释单元 | 画面任务 | 推荐帧型 |
|------|------|------|
| 概念 | 让观众先形成直觉，再给定义 | 简洁帧 → D2 左文右数据 |
| 机制 | 展示流程、因果链、内部结构 | D3 编号列表 / D2 左文右数据 |
| 代码证据 | 用真实实现证明口播观点 | D4 左解释+右代码 |
| 对比 | 让观众做判断 | D1 数据表格 / D6 问题-改进对比 |
| 边界/误解 | 防止观众过度泛化 | D6 问题-改进对比 / Oat 提示卡 |
| 总结 | 压缩成可复述的一句话 | 简洁 Payoff 帧 / Feature 暗卡 |

同一知识点优先用“概念 → 机制 → 证据 → Payoff”的顺序，不要一上来塞代码。

### 色彩用量规则

- 80% 中性色承载阅读（Ivory / Ink / Slate / Cloud）
- 15% Oat、浅 tint、细分割线组织区域
- 5% accent 和辅助色负责真正注意力
- 同帧最多两种辅助色：一个主 accent，一个语义辅助色
- Feature 暗卡内通常只保留 accent
- 只使用当前颜色库里的既有 token，不新增 chart-yellow/purple 或 tint-yellow/purple

### 逐层深入模式

同一知识点，用"放大镜"方式逐层展开：

```
概览（简洁帧）→ 详解（密集帧）→ 深挖 A（密集帧）→ 深挖 B（密集帧）
```

示例：RDD 五大特性
- 概览（简洁）：五个标签 — 观众知道"有哪些"
- 详解（密集）：每项一行解释 — 观众知道"是什么"
- 深挖（密集）：分区机制+代码+图 — 观众知道"为什么"

**关键**：不需要每个点都深挖，挑重点的展开。

### 章节节奏公式

```
章节开场（简洁·暗色）
  ↓
概念预告（简洁·抛悬念）
  ↓
详解（密集·展开）
  ↓
深挖（密集·单点展开，可选）
  ↓
下一概念预告（简洁）
  ↓
...
```

**约束**：
- 比例：40% 简洁 + 60% 密集
- 不能连续 2 帧都是简洁帧（观众会觉得空洞）
- 不能连续 3 帧都是密集帧（观众会疲劳）

### 字号系统（1920×1080）

| 层级 | 字号 | 字重 | 用途 |
|------|------|------|------|
| 超大标题 | 80-100px | 700 | 章节开场、核心金句 |
| 大标题 | 48-60px | 700 | 场景主题 |
| 小标题 | 32-36px | 600 | 卡片标题 |
| 正文 | 24-28px | 400 | 说明文字 |
| 标注 | 20-22px | 400 | 数据来源、时间戳 |
| 大数字 | 80-120px | 700 | 数据焦点 |
| 代码 | 22-24px | 400 | 终端/代码块 |

### 留白规范（按布局类型）

| 布局 | padding | 说明 |
|------|---------|------|
| 大字独白 | 上下 160px 左右 200px | 极简呼吸感 |
| 标题+内容 | 上 80px 下 160px 左右 100px | 标准时长 |
| 双栏对比 | 上下 80px 左右 100px | 信息密集 |
| 数据表格 | 上 60px 下 160px 左右 80px | 最大化内容区 |
| 深挖帧 | 上 60px 下 160px 左右 80px | 最大化内容区 |

**底部留白**：所有场景底部 padding >= 160px，为字幕预留空间（y=930 以下）。

### 视觉层级

**简洁帧**：
```
标题（48-72px, Lora 700, --c-text）
  ↓
副标题/关键词（16-20px, Poppins 400, --c-text-secondary）
  ↓
装饰线（accent 色, 40-60px 宽）
```

**密集帧**：
```
场景标题（20-28px, Lora 700, --c-text）
  ↓
分区标题（14-16px, Poppins 600, --c-text）
  ↓
正文（12-14px, Poppins 400, --c-text-secondary）
  ↓
标注（10-11px, Poppins 400, --c-text-muted）
  ↓
数据（JetBrains Mono, accent 色）
```

### 构图反面清单

| 避免 | 原因 | 正确做法 |
|------|------|---------|
| 所有内容居中对称 | PPT 感，无视觉焦点 | 不对称偏置构图 |
| 标题永远在上方 | 单调，每屏结构相同 | 标题可以在下、在侧、缺席 |
| 字号统一无层次 | 像 Word 文档 | 字号有戏剧性级差 |
| 填满整个画面 | 无呼吸感 | 留白是设计元素 |
| 连续 2 帧简洁 | 观众觉得空洞 | 简洁→密集交替 |
| 连续 3 帧密集 | 观众疲劳 | 中间穿插简洁帧 |
| 每屏结构相同 | 单调乏味 | 每屏有独特视觉焦点 |

### 视觉参考

项目的 `references/layout-gallery.html` 包含完整的构图示例：
- Part 1: 8 种简洁帧模板
- Part 2: 简洁 vs 密集对比
- Part 3: 逐层深入模式
- 设计规则总结

开发新场景前，先浏览该文件确定构图方式。

创作判断见 `CREATIVE-GAP-PLAYBOOK.md`；可视化参考见 `creative-gap-playbook.html`。

---

## Part 5: 完工自检

- [ ] 已运行 `node <skill>/scripts/lint-remotion-scenes.mjs <project>`，无 error
- [ ] 每个场景都有入场动画（无跳切）
- [ ] 动画时长 >= 18 帧（FAST 常量 + 内联范围）
- [ ] interpolate 都有 extrapolateLeft/Right: 'clamp'
- [ ] 字体 >= 24px
- [ ] 颜色来自 tokens.css（无硬编码 hex/rgba）
- [ ] 无 Date.now() / Math.random()
- [ ] 所有内容在 y=930 以上
- [ ] 底部 padding >= 160px（为字幕留空间）
- [ ] 每个场景都有观众任务标注（看懂/记住/判断什么）
- [ ] 每个场景只有一个主视觉焦点
- [ ] 视觉重音与口播重音一致
- [ ] 当前项高亮随口播切换，不永久堆叠
- [ ] 每 20-35 秒出现一次轻转折
- [ ] 每 60-90 秒有一句结构回收
- [ ] 同帧最多两种辅助色，且辅助色有语义用途
- [ ] 每个密集帧有底部结论条或可复述的收束句
- [ ] 标准卡有 border: 0.5px solid var(--c-card-border)
- [ ] Oat 卡无 border、无 boxShadow
- [ ] Feature 暗卡按需使用（信息重音才用，叙事型可不用），每章最多 2 个
- [ ] 辅助色不做整块容器背景（只做标签/色点/左边框）
- [ ] 代码高亮只跟随当前参数（不持久）
- [ ] 音频和画面同步
- [ ] Studio 预览无报错
- [ ] 渲染成功出 MP4
- [ ] 简洁帧和密集帧交替（不连续 2 帧简洁）
- [ ] 每屏布局不重复（连续场景结构不同）
- [ ] 字号有层级（不是所有文字一样大）
