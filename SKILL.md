---
name: remotion-factory
description: |
  把一篇文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。
  流程：原始文章 → 口播稿 → 音频合成 → Remotion 开发 → 渲染 MP4。
  适用场景：B 站 / YouTube / 视频号教程、产品演示、数据可视化视频、动态 PPT。
  默认设计风格：Anthropic 暖调赤陶色人文极简。用户可自定义。
---

# Remotion Video Presentation

把一篇文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。产出物 = Remotion 项目 + 按章节切分的音频 + 最终 MP4。

## 适用场景

- "我有口播稿 / 一篇文章，帮我做成视频"
- 想做"动态 PPT"但要直接出 MP4
- 16:9 横屏视频，大字、留白、每屏有动效
- 教学 / 产品演示 / keynote 电影感
- B 站 / YouTube / 抖音视频内容

**核心特性**：
- 直接输出 MP4，不用录屏
- 动画用 useCurrentFrame + interpolate，帧级精确控制
- 音频用 Audio + staticFile 内嵌时间轴
- Remotion Studio 实时预览
- npx remotion render 一键渲染
- 支持设计参考图：操作员可放置草图/截图，Claude 识别后参考创作

---

## 工作流总览

```
Phase 1   内容编写
   1.1  识别用户输入
   1.2  产出 script.md + outline.md
   ▼
[Checkpoint Plan]      ← 必须停。一次对齐 5 件事
   ▼
Phase 2   音频合成（先音频，后开发）
   2.1  生成 audio-segments.json
   2.2  合成音频（MiMo TTS）
   2.3  测量帧数 → 确定每个场景时长
   ▼
[Checkpoint Audio]     ← 必须停。确认音频 OK
   ▼
Phase 3   Remotion 开发
   3.1  脚手架 + 设计系统
   3.2  第 1 章 = 主线程 + 完整版本（强制 anchor）
        ▼
        [硬节点] 用户验收第 1 章 ← 不可跳过
        ▼
   3.3  第 2~N 章（按选定模式）
   ▼
[Checkpoint Render]    ← 必须停。章节 + 音频全部就绪才可渲染
   ▼
Phase 4   渲染 MP4
```

---

## 工作目录约定

```
my-video/
├── article.md              # 用户原文
├── script.md               # 口播稿
├── outline.md              # 开发计划
├── audio-segments.json     # 场景 → 音频映射 + 口播文本
├── references/             # 设计参考图目录（可选）
│   ├── sketch-01.png       # 操作员放的草图/截图
│   └── layout-idea.jpg     # Claude 识别后参考创作
└── src/
    ├── index.ts            # registerRoot
    ├── Root.tsx             # Composition 注册
    ├── Chapter1.tsx         # 章节总控（Sequence 编排）
    ├── styles/
    │   ├── tokens.css       # 设计系统
    │   └── global.css       # 全局样式 + 字体
    ├── components/          # 共享组件
    └── scenes/              # 每个场景一个文件
├── public/
│   └── audio/               # wav 文件
├── scripts/
│   └── synthesize-audio.mjs # MiMo TTS 合成脚本
└── out/                     # 渲染输出的 MP4
```

**references/ 目录说明**：
- 用于放置设计参考图（草图、截图、灵感图）
- Claude 会读取这些图片作为视觉参考
- 操作员如果对布局/风格有具体想法但说不清楚，截图放这里最有效
- 支持格式：png, jpg, jpeg, webp, gif
- 可选目录，不需要时可以不创建

**Skill 内置参考文档**：
- `references/SKETCH-SVG.md` — 手绘涂鸦风 SVG 完整指南（Anthropic Humane Aesthetic）
  - 三步生成法：不完美 Path → 粗糙滤镜 → 生长动画
  - SVG 滤镜详解（feTurbulence + feDisplacementMap）
  - Path 编写技巧（圆、矩形、箭头、下划线、气泡、图标、图表）
  - Remotion 集成模板（React 组件 + 帧驱动动画）
  - 调参速查表（颜色、粗细、时长）
- `references/sketch-demo.html` — 涂鸦 SVG 交互式演示（88 个动画元素 + 提示词一键复制）
  - 浏览器直接打开即可预览全部涂鸦效果
  - 每个元素右上角 prompt 按钮 → 弹出 AI 生成提示词 → 一键复制
- `references/AUDIO.md` — 音频合成参考
- `references/CHAPTER-CRAFT.md` — 场景开发指南 + 动画模式库

---


## 设计风格

### 默认风格：Anthropic "Intellectual Warmth"

本 Skill 默认使用 Anthropic 视觉设计语言——"知识分子感、克制、优雅、带有人文温度的学术期刊质感"。

**核心理念**：摒弃科技圈的"侵略性"（高饱和度深蓝、霓虹渐变、冷酷未来感），走"学术报刊感 + 人文主义关怀 + 克制的知识分子风"。

用户可通过修改 tokens.css 自定义风格。

### 配色方案

低饱和度、偏向纸张和泥土的自然温暖色调：

```css
:root {
  /* ── 底色 ── */
  --c-bg: #FAF9F5;              /* 羊皮纸白 / 奶白色，模仿高质量印刷书籍的纸张质感 */
  --c-bg-warm: #F3F1EC;          /* 暖灰，用于区分卡片板块 */
  --c-surface: #FFFFFF;          /* 表面色 */

  /* ── 文字 ── */
  --c-text: #141413;             /* 深油墨黑（几乎不用纯黑 #000000，带暖意） */
  --c-text-secondary: #6B6B6B;   /* 次文字 */
  --c-text-muted: #9B9B9B;       /* 弱文字 / 分割线 */
  --c-divider: #B0AEA5;          /* 中灰，用于次要文本、极细分割线 */

  /* ── 核心品牌色 ── */
  --c-accent: #D97757;           /* 暖调赤陶 / 铁锈红，最具辨识度的颜色 */
  --c-accent-deep: #C2522D;      /* 深赤陶，用于按钮悬停、强调 */

  /* ── 辅助色（图表、数据可视化） ── */
  --c-chart-blue: #6A9BCC;       /* 莫兰迪青蓝，低饱和度 */
  --c-chart-green: #788C5D;      /* 鼠尾草绿，低饱和度 */
  --c-chart-gray: #E8E6DC;       /* 浅灰底色 */

  /* ── 终端（代码展示用） ── */
  --c-terminal-bg: #1E1E2E;      /* 深色终端背景 */
  --c-terminal-text: #CDD6F4;    /* 终端文字 */
  --c-terminal-red: #F38BA8;     /* 终端强调色 */

  /* ── 字体 ── */
  --font-display: 'Lora', Georgia, serif;          /* 大标题：衬线体，富有张力和经典印刷感 */
  --font-sans: 'Poppins', Arial, sans-serif;       /* 正文：现代人文感无衬线体 */
  --font-mono: 'JetBrains Mono', monospace;         /* 代码：等宽字体 */
}
```

### 排版规则

| 元素 | 规则 |
|------|------|
| 大标题 | Lora 衬线体，字重厚重（700），字距略微紧凑（-0.02em），展现权威感 |
| 正文 | Poppins 无衬线体，留白宽绰，段落呼吸感极强（line-height: 1.7+） |
| 数据/标注 | Poppins 400-500，字号适中，颜色用 --c-text-secondary |
| 分割线 | 极细（1px），颜色 rgba(176,174,165,0.3)，像读一份排版考究的现代报纸 |

### 布局规则

- **极简网格 + 大留白**：不堆砌复杂卡片，依赖极细浅灰分割线划分板块
- **复古几何**：简单圆形、极其克制的有色状态点（Blinking dot）、复古单色网格线
- **拒绝 3D 与绚丽光效**：无赛博朋克 3D 渲染、无流体渐变、无极光特效
- **2D 平面 + 微噪点**：所有图形偏 Flat Design，可带轻微噪点颗粒质感

### 动效规则

| 类型 | 规则 |
|------|------|
| 淡入 | 平滑、缓慢的线性淡入，不用弹跳 |
| 推移 | 线性推移，像翻阅一本质感极佳的实体书 |
| 代码闪烁 | 带有老式 CRT 或印刷机的沉稳节奏 |
| 禁止 | 夸张弹跳、快速闪烁、大幅度变形 |
| 曲线 | 多用 Ease In/Out，不用 Bounce/Elastic |

### 视频后期质感

- **调色**：低饱和度、低对比度，高光偏暖（#FAF9F5），阴影带暖灰或墨绿
- **胶片颗粒**：叠加极微弱的 Film Grain 或纸张纹理，透明度 2%~5%
- **画面整体**：偏暗、偏暖，具有"复古摄影"的调性

### 声音设计指引

| 类型 | 规则 |
|------|------|
| BGM | 极简环境音（Ambient）、低沉大提琴、轻缓钢琴、极简小提琴拉弦 |
| 氛围 | 深夜独自思考、安静沉浸 |
| 禁止 | 高燃电子乐、科技感合成器 |

### 反面清单（坚决避免）

- 高饱和度蓝色、霓虹渐变
- 赛博朋克暗色（终端除外）
- 紫色粉红渐变
- emoji 当图标
- SVG 画人
- 3D 渲染、流体渐变、极光特效
- 夸张弹跳动画
- 高燃电子乐 BGM

### 自定义风格

用户可通过修改 tokens.css 定制：
- 换主色：修改 --c-accent
- 换字体：修改 --font-display / --font-sans / --font-mono
- 换背景：修改 --c-bg
- 暗色主题：将 --c-bg 改为深色，--c-text 改为浅色
- 参考 Claude 官网 / Anthropic 官网的布局进行调整

---


## Phase 1 — 内容编写

### 1.1 识别用户输入

| 用户给的东西 | 该做的 |
|---|---|
| 原始文章 | 一次产出 script.md + outline.md |
| 直接口播稿 | 落盘成 script.md，产出 outline.md |
| 啥都没有 | 反问：先给素材或大纲 |

### 1.2 产出 script.md + outline.md

script.md: B 站 / YouTube 风格口播稿，口语化、有节奏感。

**内容保真原则（重要）**：
- script.md 是对 article.md 的口语化改写，不是精简摘要
- 保留原文的核心论点、数据、案例、技术细节
- 可以增加过渡句、口语化表达、节奏感，但不要删减实质内容
- 如果原文有 7 个要点，script 里也应该是 7 个，不能压缩成 3 个
- 参考风格：B 站技术区 up 主、YouTube TechLead、抖音知识博主

outline.md: 章节切分 + 每步内容 + 信息池。

outline 必须写：章节切分 / 每章 scene 数 / 估时 / 每步屏幕内容 / 章节级信息池
outline 不要写：具体动画类型 / CSS 实现细节 / 时长数值

**检查 references/ 目录**：如果存在设计参考图，识别图片内容，在 outline 中注明参考了哪些视觉元素。

---

## Checkpoint Plan

script.md + outline.md 写完后必须停下来，一次对齐 5 件事：

1. 稿子 (script.md) 要不要改？
2. 开发计划 (outline.md) 要不要改？
3. 设计风格确认（默认 Anthropic 暖调赤陶，还是自定义？）
4. 素材怎么准备？（参考图是否已放入 references/）
5. 开发模式选哪个？
   - A) 逐章确认（推荐）
   - B) 顺序开发
   - C) 并行开发（Agent Teams，最大并行度 3）

---

## Phase 2 — 音频合成（先音频，后开发）

> **核心原则：先合成音频，确定每个场景的真实时长，再开发动画。**

### 2.1 生成 audio-segments.json

从 script.md 提取口播文本，按场景切分。

**内容保真原则**：
- text 字段来自 script.md，不要再次精简
- 保持 script.md 的信息密度
- 对照 article.md 检查完整性

**文本清理规则（TTS 友好）**：
- -（连字符）→ 空格（max-retries → max retries）
- _（下划线）→ 空格（init_chat_model → init chat model）
- 保留中文标点

### 2.2 合成音频

> **⚠️ 必须使用 MiMo TTS，不要使用 hyperframes tts。**

API 配置：
  Model: mimo-v2.5-tts
  API: https://token-plan-cn.xiaomimimo.com/v1
  认证: 请求头 api-key（非 Authorization: Bearer）
  Voice: 苏打
  Format: WAV
  请求间隔: 500ms

运行：
  node scripts/synthesize-audio.mjs           # 合成全部
  node scripts/synthesize-audio.mjs --force   # 强制重新合成

### 2.3 测量帧数

合成完成后，立即测量每个 WAV 文件的帧数：

node -e "
const fs = require('fs');
['ch1-0','ch1-1'].forEach(f => {
  const buf = fs.readFileSync('public/audio/' + f + '.wav');
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  console.log(f + ': ' + (dataSize/byteRate).toFixed(2) + 's (' + Math.ceil(dataSize/byteRate*30) + ' frames)');
});"

帧数 = 秒数 x 30，向上取整。铁律：必须从 WAV header 计算。

---

## Checkpoint Audio

音频合成完成后必须停下来：

```
音频合成完成：
  ✅ ch1-0.wav  3.84s (116 frames)
  ✅ ch1-1.wav  16.16s (485 frames)
  ...

确认：
  □ 每个音频都能正常播放？
  □ TTS 有没有读出符号（下划线/连字符）？
  □ 语速/语气是否合适？

问题告诉我，我针对性修复。OK 了告诉我"继续"。
```

---

## Phase 3 — Remotion 开发

### 3.1 脚手架 + 设计系统

版本锁定（重要，不要随意升级）：
  remotion: 4.0.301
  @remotion/cli: 4.0.301
  @remotion/media-utils: 4.0.301
  react: ^18.3.1
  typescript: ^5.6.3

脚手架：
  mkdir src/{styles,components,scenes} public/audio out scripts references

tokens.css 使用默认 Anthropic 暖调赤陶风格（见上方"设计风格"章节），用户可自定义。

### 3.2 第 1 章 — 主线程 + 强制验收

核心：第 1 章 = 完整版本一次到位。
帧数已从 Phase 2 确定，直接使用。

Chapter1.tsx 模板：
```tsx
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';

// 帧数从 Phase 2 测量结果获取
const SCENE0_AUDIO = 116;
const SCENE1_AUDIO = 485;

const S0_START = 0;
const S1_START = S0_START + SCENE0_AUDIO;
const TOTAL_FRAMES = S1_START + SCENE1_AUDIO;

export { TOTAL_FRAMES };

export const Chapter1: React.FC = () => (
  <AbsoluteFill style={{ background: 'var(--c-bg)' }}>
    <Sequence from={S0_START} durationInFrames={SCENE0_AUDIO} name="Scene 0">
      <Audio src={staticFile('audio/ch1-0.wav')} volume={1} />
      <Scene0 />
    </Sequence>
  </AbsoluteFill>
);
```

做完第 1 章后必须停下来等用户验收。

### 3.3 第 2~N 章

三种模式：
- A) 逐章确认：每章做完验收
- B) 顺序开发：全部做完统一验收
- C) 并行开发：Agent Teams 并行（推荐最大并行度 3）

---

## Checkpoint Render

所有章节开发完成 + 音频就绪后，渲染前必须确认：

```
渲染前检查：
  □ 所有章节开发完成？
  □ 所有音频文件就绪？
  □ Studio 预览确认无问题？
  □ 帧数与音频时长匹配？

只有全部确认通过才可渲染。未确认前禁止自动渲染。
```

**⚠️ 重要：渲染 MP4 必须在章节 + 音频全部就绪且用户确认后才能执行。任何阶段都不得自动渲染。**

---

## Phase 4 — 渲染 MP4

```bash
# Studio 预览（开发阶段用这个，不要渲染）
npm start

# 渲染（仅在 Checkpoint Render 通过后执行）
npx remotion render src/index.ts Chapter1 out/chapter1.mp4
npx remotion render src/index.ts FullVideo out/full-video.mp4

# 国内网络指定本地 Chrome
npx remotion render src/index.ts Chapter1 out/chapter1.mp4 --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

---

## 动画系统

### 核心规则

1. 帧驱动：useCurrentFrame() 是唯一时间源
2. 确定性：同一帧数永远产生同一画面
3. 所有 interpolate 必须有 extrapolateLeft/Right: 'clamp'

### 动画节奏：延迟对齐 + 快速动画

动画速度保持快（~15 帧 ≈ 0.5s），只调整开始帧来对齐音频。

```tsx
const FAST = 15;
const BULLET_FRAMES = [252, 375, 470]; // 音频提到要点的时刻

const bulletOp = (i) => interpolate(
  frame, [BULLET_FRAMES[i], BULLET_FRAMES[i] + FAST], [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
);
```

不要把动画拉慢来"对齐"音频。

### "出现就留下"模式

元素出现后保持可见，不加退出动画：const exitOp = 1;

### 代码高亮规则

代码高亮只跟随当前参数，之前的参数恢复默认色（不持久高亮）。

---

## 视觉多样性

禁止连续 2 个场景使用相同布局。每个章节至少使用 2-3 种视觉形式：

| 视觉形式 | 适用场景 |
|----------|---------|
| 数据可视化 | SVG 曲线、柱状图 |
| 对比布局 | 左右分栏 |
| 终端/代码 | 终端窗口 |
| 卡片网格 | 列表/分类 |
| 时间线 | 流程/步骤 |
| 大标题 | 核心观点 |

### 内容边界

- 所有内容在 y=930 以上（给字幕留空间）
- 字体 >= 24px
- 每屏 1-2 个核心信息点

---

## 反 AI 味检查

- 不要紫色粉红渐变
- 不要 emoji 当图标
- 不要赛博朋克暗色（终端深色除外）
- 不要 SVG 画人

---

## 质检流程

每个 Phase 完成后，使用 Agent Teams 创建两个独立 Agent 进行质检：

### Phase 1 完成后
- Agent 1：内容质检（script.md 与 article.md 的信息密度对比）
- Agent 2：结构质检（outline.md 的章节划分合理性）

### Phase 2 完成后
- Agent 1：音频质检（TTS 输出是否正常，有无符号读出）
- Agent 2：帧数质检（WAV 帧数计算是否正确）

### Phase 3 完成后
- Agent 1：代码质检（Remotion 组件的确定性、interpolate 规范、tokens.css 使用）
- Agent 2：视觉质检（布局多样性、内容边界、反 AI 味）

### Phase 4 渲染后
- Agent 1：同步质检（音画是否同步）
- Agent 2：成品质检（完整播放无报错）

---

## 自检清单

- [ ] 每个场景都有入场动画
- [ ] 音频和画面严格同步
- [ ] 字体 >= 24px
- [ ] 颜色来自 tokens.css
- [ ] 无 Date.now() / Math.random()
- [ ] 所有内容在 y=930 以上
- [ ] 代码高亮只跟随当前参数
- [ ] Studio 预览无报错
- [ ] 渲染成功

---

## 常见问题

| 问题 | 解决 |
|------|------|
| 音频没声音 | Audio 必须在 Sequence 内部 |
| 空白帧 | 帧数从 WAV header 计算，不要估算 |
| TTS 读出符号 | text 中把 _ 和 - 替换为空格 |
| hyperframes 干扰 | 明确使用 MiMo TTS |
| 重新生成音频后错位 | 重新测量 WAV 帧数，更新常量 |
| 动画和音频对不上 | Phase 2 先合成音频，再开发动画 |
| 渲染太早 | 必须通过 Checkpoint Render 才能渲染 |
