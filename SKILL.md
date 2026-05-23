---
name: remotion-factory
version: 1.5.2
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
    ├── FullVideo.tsx        # 全片合并（Sequence 编排各 Chapter）
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

**audio-segments.json 格式**：

`json
[
  {
    "chapter": "ch1",
    "scene": "Scene0Title",
    "audio": "ch1-0.wav",
    "text": "Hello，大家好，今天我们来聊 LangChain 中最核心的部分，模型，Models。"
  },
  {
    "chapter": "ch1",
    "scene": "Scene1Emergence",
    "audio": "ch1-1.wav",
    "text": "在正式写代码之前，我们先搞清楚几个基本概念。"
  }
]
`

字段说明：
- chapter: 章节标识（ch1, ch2, ...）
- scene: 场景组件名（必须与 src/scenes/ 下的文件名对应）
- audio: 音频文件名（输出到 public/audio/）
- text: 口播文本（TTS 友好：已替换 _ 和 - 为空格）

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



## 明暗主题切换系统

### 为什么需要明暗交替

一成不变的白底会让 7 分钟的视频显得单调。通过"明暗交替"制造视觉节奏感：
- 白底：承载报刊质感的正文、图表、卡片（主体内容，~60-70%）
- 暗底：承载代码终端、章节首尾、核心结论（节奏重音，~30-40%）

### 暗色主题变量

```css
.dark-theme {
  /* 底色 */
  --c-bg: #191917;              /* 深炭墨，带暖意的黑 */
  --c-bg-warm: #242422;         /* 深炭灰 */
  --c-surface: #2D2C2A;         /* 表面色 */

  /* 文字（拒绝死白，保持暖意） */
  --c-text: #EBEAE4;             /* 暖奶白 */
  --c-text-secondary: #9E9C94;   /* 亚光浅灰 */
  --c-text-muted: #666560;       /* 弱文字 */
  --c-divider: rgba(158, 156, 148, 0.15);

  /* 品牌色（暗底提亮对比度） */
  --c-accent: #EE6B3E;           /* 亮赤陶橙，微弱发光感 */
  --c-accent-deep: #E58565;      /* 柔和粉赤陶 */

  /* 辅助色（略微提亮） */
  --c-chart-blue: #81A9D4;
  --c-chart-green: #8DA173;
  --c-chart-gray: #3A3936;

  /* 终端 */
  --c-terminal-bg: #151521;
  --c-terminal-text: #CDD6F4;
  --c-terminal-red: #F38BA8;
  --c-terminal-line: #2A2A3A;          /* 代码行间交替色 */
  --c-terminal-highlight: rgba(238, 107, 62, 0.12); /* 高亮行背景 */
}
```

### 自动决策规则（Claude 必须遵守）

开发每个场景时，Claude 必须根据以下规则自动判断使用暗色还是亮色。**不需要用户手动指定**。

#### 规则一：场景内容分类 → 主题映射

| 场景内容类型 | 主题 | 原因 |
|------------|------|------|
| 开场标题（Chapter Title） | **暗色** | 电影感开场，"沉下来"聚焦 |
| 代码终端（Terminal/Code） | **暗色** | 终端天然深色，视觉一致 |
| 核心结论/总结 | **暗色** | 节奏收尾，强调分量 |
| 重要观点强调（单句大字） | **暗色** | 暗底+亮赤陶=视觉焦点 |
| 正文内容（卡片/列表/图表） | 亮色 | 报刊质感，清晰可读 |
| 数据可视化（SVG/图表） | 亮色 | 小字在暗底可读性差 |
| 流程步骤 | 亮色 | 需要清晰视觉层次 |
| 过渡/引入 | 跟随前一场景 | 保持连贯 |

#### 规则二：章节内节奏约束

```
每个章节的暗色场景比例：20%~40%
连续暗色场景：最多 2 个
连续亮色场景：最多 3 个
章节第一个场景：暗色（开场）
章节最后一个场景：可选暗色（总结）
```

**示例**（5 个场景的章节）：
```
场景 0: 暗色（开场标题）
场景 1: 亮色（正文内容）
场景 2: 亮色（图表展示）
场景 3: 暗色（代码终端）
场景 4: 亮色或暗色（总结/下一步）
```

#### 规则三：全片节奏检查

开发完所有章节后，检查全片的明暗节奏：
- 每 3-5 个亮色场景后，应该有 1 个暗色场景
- 连续亮色场景最多 3 个（超过会审美疲劳）
- 连续暗色场景最多 2 个（超过会压抑）

### 实现方式

#### 单场景内切换（场景内局部暗色）

用 `interpolateColor` 实现平滑过渡（**不要用 CSS transition，Remotion 不支持**）：

```tsx
import { useCurrentFrame, interpolate, interpolateColor } from 'remotion';

export const SceneWithTheme: React.FC = () => {
  const frame = useCurrentFrame();
  const FAST = 5; // 过渡 5 帧 ≈ 0.17s

  // 在 frame 100 时切换到暗色
  const SWITCH_FRAME = 100; // 在此帧切换到暗色

  const bgColor = interpolateColor(frame, [SWITCH_FRAME, SWITCH_FRAME + FAST], ['#FAF9F5', '#191917']);
  const textColor = interpolateColor(frame, [SWITCH_FRAME, SWITCH_FRAME + FAST], ['#141413', '#EBEAE4']);
  const accentColor = interpolateColor(frame, [SWITCH_FRAME, SWITCH_FRAME + FAST], ['#D97757', '#EE6B3E']);

  return (
    <AbsoluteFill style={{ background: bgColor, color: textColor }}>
      <h1 style={{ color: accentColor }}>标题</h1>
    </AbsoluteFill>
  );
};
```

#### 整场景暗色（推荐方式）

在场景组件的根 AbsoluteFill 上加 className="dark-theme"。
CSS 变量通过 global.css 的 .dark-theme 规则生效，子元素用 var(--c-xxx) 引用。

```tsx
// SceneDark.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const SceneDark: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="dark-theme" style={{ padding: 100 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>标题</h1>
      <p style={{ color: 'var(--c-accent)' }}>强调文字</p>
    </AbsoluteFill>
  );
};
```

Chapter 编排中无需额外处理，主题已在场景组件内部决定：

```tsx
// Chapter1.tsx
<Sequence from={S0} durationInFrames={S0_DUR} name="Title">
  <Scene0Title />  {/* 组件内部已设置 dark-theme */}
</Sequence>
<Sequence from={S1} durationInFrames={S1_DUR} name="Content">
  <Scene1Content />  {/* 无 dark-theme，默认亮色 */}
</Sequence>
```

#### 分屏对比（左右明暗）

同一帧内渲染两套主题，用内联 style：

```tsx
<div style={{ display: 'flex', width: '100%', height: '100%' }}>
  <div style={{ width: '50%', background: '#FAF9F5', color: '#141413' }}>
    {/* 左：亮色 */}
  </div>
  <div style={{ width: '50%', background: '#191917', color: '#EBEAE4' }}>
    {/* 右：暗色 */}
  </div>
</div>
```

### 开发流程中的应用

**Phase 3 开发场景时**，Claude 必须：

1. 为每个场景标注主题类型（在 outline.md 中）
2. 按规则一自动判断亮/暗
3. 检查规则二的节奏约束
4. 在场景组件中实现对应主题

**outline.md 标注示例**：

```markdown
## Chapter 1: 模型基础（~90s）
- Scene 0: 开场标题（3.8s, ch1-0.wav）【暗色】
- Scene 1: LLM 概念 + 涌现曲线（16s, ch1-1.wav）【亮色】
- Scene 2: 三种模型类型（30s, ch1-2.wav）【亮色】
```

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
  API: https://token-plan-cn.xiaomimimo.com/v1/chat/completions（POST）
  认证: 请求头 api-key（非 Authorization: Bearer）
  Voice: 苏打
  Format: WAV
  请求间隔: 500ms

运行：
  node scripts/synthesize-audio.mjs           # 合成全部（跳过已存在）
  node scripts/synthesize-audio.mjs --force   # 强制重新合成全部

**只重新生成单个文件**（不要用 --force 全部重新生成）：
  1. 临时把 audio-segments.json 只保留要重新生成的条目
  2. 运行合成脚本（--force）
  3. 恢复完整的 audio-segments.json
  4. 测量新帧数，更新 ChapterX.tsx 常量
  5. 更新 subtitle-timings.json

### 2.3 测量帧数

合成完成后，测量每个 WAV 文件的帧数。详见 references/AUDIO.md 的"测量时长"章节。

帧数 = 秒数 x 30，向上取整。铁律：必须从 WAV header 计算。

如果测量帧数与 ChapterX.tsx 中声明的常量相差超过 2 帧，必须重新测量并更新常量。

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
  □ TTS 有没有读出符号（下划线/连字符）？如果有，修改 text 重新生成
  □ 语速/语气是否合适？不合适的单独重新生成（不要 --force 全部）
  □ 帧数是否已写入 ChapterX.tsx？

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

字体加载：在 global.css 中用 @import 导入 Google Fonts（Lora, Poppins, JetBrains Mono），否则会静默回退到 Georgia/Arial/monospace。

tokens.css 使用默认 Anthropic 暖调赤陶风格（见上方"设计风格"章节），用户可自定义。

### 3.2 第 1 章 — 主线程 + 强制验收

核心：第 1 章 = 完整版本一次到位。
帧数已从 Phase 2 确定，直接使用。

Chapter1.tsx 模板：
```tsx
import React from 'react';
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

所有章节开发完成 + 音频就绪后，渲染前必须确认并选择：

### 渲染前检查

  - 所有章节开发完成？
  - 所有音频文件就绪？
  - Studio 预览确认无问题？
  - 帧数与音频时长匹配？

### 渲染前选择

确认通过后，询问用户以下选项：

**1. 配音选择**（在 Checkpoint Audio 阶段已确认，此处再次确认）：
  - 使用配置的配音（默认，MiMo TTS 苏打音色）
  - 不加配音（纯视觉，无音频）

**2. 字幕选择**：
  - 加字幕（使用 subtitle-timings.json 逐句显示）
  - 不加字幕（纯视觉，底部无文字）

如果不加字幕，跳过字幕相关渲染。如果加字幕，确认 subtitle-timings.json 已生成。

**3. 渲染范围**：
  - A) 仅渲染各章节（Chapter1-5 分别输出）
  - B) 仅渲染完整视频（FullVideo 一个文件）
  - C) 两者都渲染（章节 + 完整视频）

**渲染 MP4 必须在章节 + 音频全部就绪且用户确认后才能执行。任何阶段不得自动渲染。**


## Phase 4 — 渲染 MP4

根据 Checkpoint Render 的选择执行渲染。

### 渲染命令

国内网络需要指定本地 Chrome：
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"

**选项 A：仅渲染各章节**
```bash
npx remotion render src/index.ts Chapter1 out/chapter1.mp4
npx remotion render src/index.ts Chapter2 out/chapter2.mp4
npx remotion render src/index.ts Chapter3 out/chapter3.mp4
npx remotion render src/index.ts Chapter4 out/chapter4.mp4
npx remotion render src/index.ts Chapter5 out/chapter5.mp4
```

**选项 B：仅渲染完整视频**
```bash
npx remotion render src/index.ts FullVideo out/full-video.mp4
```

**选项 C：两者都渲染**
```bash
# 先渲染各章节
npx remotion render src/index.ts Chapter1 out/chapter1.mp4
npx remotion render src/index.ts Chapter2 out/chapter2.mp4
npx remotion render src/index.ts Chapter3 out/chapter3.mp4
npx remotion render src/index.ts Chapter4 out/chapter4.mp4
npx remotion render src/index.ts Chapter5 out/chapter5.mp4

# 再渲染完整视频
npx remotion render src/index.ts FullVideo out/full-video.mp4
```

### 不加字幕时

如果用户选择不加字幕，需要临时注释或移除场景组件中的 `<Subtitle>` 组件，渲染完成后再恢复。或者通过 Composition 的 defaultProps 控制。

**重要**：即使不加字幕，布局仍然必须在 y=930 以上留白。用户发布视频时可能外挂字幕（B站/YouTube 自动字幕或手动添加），底部空间是字幕的永久预留区域。

### 渲染完成

输出文件在 out/ 目录下。告知用户文件路径和大小。


## 动画系统

### 核心规则

1. 帧驱动：useCurrentFrame() 是唯一时间源
2. 确定性：同一帧数永远产生同一画面
3. 所有 interpolate 必须有 extrapolateLeft/Right: 'clamp'

### 动画导入

`	sx
import { useCurrentFrame, interpolate, Easing } from 'remotion';
`

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


### 字幕系统

教学视频必须加字幕。字幕按句子逐行显示，跟随音频节奏。

**组件**：src/components/Subtitle.tsx
**数据**：subtitle-timings.json（每句的 start/end 帧号）

**句子拆分规则**（重要）：
- 只按句末标点断句：。！？
- 超过 50 字的句子才按 ；： 再拆
- 相邻短句（<12字）自动合并
- 禁止按逗号 ，, 拆分（会碎片化，如 "LLM，" 变成独立一句）

**时间戳生成**：
- 根据每句字符数占总文本的比例分配帧数（长句多分，短句少分）
- 不要均分时间（每句一样长会和音频不同步）
- 生成脚本：node /tmp/gen-subtitle-timings.js

**字幕样式**：
- 底部居中，bottom: 40px
- 半透明深色背景 rgba(20,20,19,0.85)
- 白色文字 #EBEAE4，28px
- 8 帧淡入 + 6 帧淡出

**集成方式**：
```tsx
import { Subtitle } from '../components/Subtitle';
import subtitleTimings from '../../subtitle-timings.json';

// 在根 AbsoluteFill 的最后
<Subtitle timings={subtitleTimings.SceneName} />
```

**重新生成音频后**：必须同步更新 subtitle-timings.json（帧数变了，时间戳要重算）。


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

- 所有内容在 y=930 以上（永远遵守，即使不加字幕——用户发布时可能外挂字幕）
- 字体 >= 24px
- 每屏 1-2 个核心信息点

### 布局间距规则（重要）

字号提升后（如 14px → 24px），容器尺寸必须同步调整，否则会重叠。

**标题-内容间距**：
- 标题区（top:50 + 40px h2 + 24px 副标题 + 间距）约 120-140px
- 内容起始位置：150-170px（留 10-30px 呼吸空间）
- 不要让内容紧贴标题下方

**卡片间距**：
- gap: 18 → gap: 22（字号提升后）
- 卡片 padding: 18px 24px → 24px 28px
- 列表项 marginBottom: 14 → 18

**行高**：
- 代码块 lineHeight: 1.7（不要 1.8，会溢出）
- 正文 lineHeight: 1.6

**卡片样式**：
- 用 boxShadow 不用 border（Anthropic 风格）
- 彩色卡片用同色系阴影：boxShadow: 0 4px 20px rgba(r,g,b,0.2)
- 边框仅用于功能性元素（滑块、时间线节点）

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
- Agent 1：代码质检
  - 所有 interpolate 有 extrapolateLeft/Right: clamp
  - 无 Date.now / Math.random
  - 暗色场景用 AbsoluteFill className="dark-theme"（不要 div 包裹 Sequence）
  - interpolateColor 用 3 参数形式
  - 字体 >= 24px（grep 所有 fontSize < 24）
  - 无 emoji 当图标
- Agent 2：视觉质检
  - 标题-内容间距 >= 30px（检查 top 值差）
  - 连续场景布局不重复
  - 暗色场景比例 20-40%
  - 所有内容 y < 930
  - 卡片用 boxShadow 不用 border

### Phase 4 渲染后
- Agent 1：同步质检
  - 字幕与音频是否对齐
  - 动画切换是否在音频提到内容时发生
- Agent 2：成品质检
  - 完整播放无报错
  - 暗色场景视觉效果正确
  - 字幕不遮挡主内容

---

## 自检清单

- [ ] 每个场景都有入场动画
- [ ] 音频和画面严格同步
- [ ] 字幕与音频对齐（逐句显示，非全文）
- [ ] 字体 >= 24px（grep 验证无遗漏）
- [ ] 颜色来自 tokens.css
- [ ] 无 Date.now() / Math.random()
- [ ] 所有内容在 y=930 以上（永远遵守，不论是否加字幕）
- [ ] 代码高亮只跟随当前参数
- [ ] 标题-内容间距 >= 30px
- [ ] 卡片用 boxShadow 不用 border
- [ ] 暗色场景用 AbsoluteFill className
- [ ] 明暗节奏合理（20-40% 暗色）
- [ ] 无 emoji 当图标
- [ ] Studio 预览无报错
- [ ] 渲染成功

---




