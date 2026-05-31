---
name: remotion-factory
description: |
  把文章、口播稿、简略提纲、信息科普内容或代码项目，用 Remotion 做成可直接渲染 MP4 的视频。
  流程：原始材料 → 费曼扩写/口播稿 → 音频合成 → Remotion 开发 → 渲染 MP4。
  适用场景：B 站 / YouTube / 视频号教程、科普解释、代码项目讲解、产品演示、数据可视化视频、动态 PPT。
  默认设计风格：Anthropic 暖调赤陶色人文极简。用户可自定义。
---

# Remotion Video Presentation

把一篇文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。产出物 = Remotion 项目 + 按章节切分的音频 + 最终 MP4。

## 版本记录

- 2.0.0: 全面整改——TTS 文本清理规则完善（markdown/编程符号）、Chrome 渲染指引明确（本地优先）、质检流程强化（具体检查项+通过标准）、明暗节奏用户可选、导演审美系统
- 1.14.0: 信息/科普解释模式——新增 EXPLAINER-SCRIPTING.md，支持费曼扩写、简略文章+代码项目/资料库转口播稿；Phase 1 增加 feynman-notes.md 中间产物和证据追踪
- 1.13.0: Agent Teams 自动质检——每个 Phase 完成后自动并行派出两个独立 Agent 质检，含详细 prompt 模板、PASS/FAIL 闸门、失败重试循环
- 1.12.0: 工程化补强——新增 scripts/lint-remotion-scenes.mjs 静态质检脚本、STYLE-ADAPTATION.md 风格迁移指南；主文档参考索引瘦身，Phase 3 增加 lint 闸门
- 1.11.0: 创作判断层补全——新增 CREATIVE-GAP-PLAYBOOK.md/creative-gap-playbook.html，补齐简洁帧选择、视觉重音、观众留存、色彩用量、好坏对比审稿；Phase 3 增加场景规划闸门和观众任务标注
- 1.10.1: 质检全面修复——工作流补全（subtitle-timings.json/FullVideo.tsx/Root.tsx 步骤）、Feature 暗卡规则统一、错误恢复指引、跨平台兼容、CJK 字体/渲染配置/BGM 指引、CSS 变量去重、术语统一

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
   1.2  内容类型判断
   1.3  产出 script.md + outline.md
   ▼
[Checkpoint Plan]      ← 自动派 2 Agent 质检（内容+结构）。PASS 后继续
   ▼
Phase 2   音频合成（先音频，后开发）
   2.1  生成 audio-segments.json
   2.2  合成音频（MiMo TTS）+ 错误处理
   2.3  测量帧数 → 确定每个场景时长
   2.4  生成 subtitle-timings.json（字幕时间戳）
   ▼
[Checkpoint Audio]     ← 自动派 2 Agent 质检（音频+帧数）。PASS 后继续
   ▼
Phase 3   Remotion 开发
   3.1  项目初始化 + 脚手架 + 设计系统
   3.2  第 1 章 = 主线程 + 完整版本（强制 anchor）
        ▼
        [硬节点] 用户验收第 1 章 ← 不可跳过
        ▼
   3.3  第 2~N 章（按选定模式）
   3.4  创建 FullVideo.tsx（全片合并）
   ▼
[Checkpoint Render]    ← 自动派 2 Agent 质检（代码+视觉）。PASS 后继续
   ▼
Phase 4   渲染 MP4 + 故障排查
   ▼
[Checkpoint Final]     ← 自动派 2 Agent 质检（同步+成品）。PASS 后交付
```

---

## 工作目录约定

```
my-video/
├── article.md              # 用户原文
├── feynman-notes.md        # 信息/科普解释模式的费曼扩写笔记（可选但推荐）
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

```json
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
```

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

**Skill 内置参考路由**：
- 信息/科普/代码项目扩写：`references/EXPLAINER-SCRIPTING.md`
- 音频合成/帧数：`references/audio.md`
- 场景开发/动效/构图：`references/CHAPTER-CRAFT.md`
- 创作判断/留存/重音：`references/CREATIVE-GAP-PLAYBOOK.md`，可视化页 `references/creative-gap-playbook.html`
- 风格迁移/token 映射：`references/STYLE-ADAPTATION.md`
- 布局模板：`references/layout-gallery.html`
- 配色预览：`references/color-preview.html`，辅助色规则：`references/surface-demo.html`
- 手绘 SVG：`references/SKETCH-SVG.md`，可视化页 `references/sketch-demo.html`
- 静态质检脚本：`scripts/lint-remotion-scenes.mjs`

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
  --c-text-secondary: #7A7870;   /* 次文字（暖灰，避免偏冷） */
  --c-text-muted: #9E9C94;       /* 弱文字 / 分割线（暖灰） */
  --c-divider: #B0AEA5;          /* 中灰，用于次要文本、极细分割线 */

  /* ── 核心品牌色 ── */
  --c-accent: #D97757;           /* 暖调赤陶 / 铁锈红，最具辨识度的颜色 */
  --c-accent-deep: #C2522D;      /* 深赤陶，用于按钮悬停、强调 */

  /* ── 辅助色（图表、数据可视化） ── */
  --c-chart-blue: #6A9BCC;       /* 莫兰迪青蓝，低饱和度 */
  --c-chart-green: #788C5D;      /* 鼠尾草绿，低饱和度 */
  --c-chart-gray: #E8E6DC;       /* 浅灰底色 */

  /* ── 中性色阶（Anthropic 官方 10 档） ── */
  --c-slate-medium: #3D3D3A;     /* 边框 / focus 环 */
  --c-slate-light: #5E5D59;      /* 三级文字 / 说明 */
  --c-cloud-dark: #87867F;       /* 次要文字 / 时间戳 */
  --c-cloud-light: #D1CFC5;      /* 卡片细边框 / 分割线 */
  --c-oat: #E3DACC;              /* 暖填充卡底色 */
  --c-ivory-medium: #F0EEE6;     /* 二级面 / 导航背景 */

  /* ── 终端（代码展示用） ── */
  --c-terminal-bg: #1E1E2E;      /* 深色终端背景 */
  --c-terminal-text: #CDD6F4;    /* 终端文字 */
  --c-terminal-red: #F38BA8;     /* 终端强调色 */

  /* ── 卡片系统 ── */
  /* 默认卡片：与页面同色 + 细边框区分（Anthropic 官方做法） */
  --c-card-bg: #FAF9F5;
  --c-card-border: #D1CFC5;
  --c-card-text: #141413;

  /* 重点卡片：Oat 暖填充底，辅助色只做标签/色点/左边框 */
  --c-card-oat-bg: #E3DACC;
  --c-card-oat-text: #141413;

  /* Feature 暗卡：近黑底，全章最重要的结论 */
  --c-card-feature-bg: #141413;
  --c-card-feature-text: #FAF9F5;       /* Ivory Light，暖白非纯白 */
  --c-card-feature-secondary: #B0AEA5;  /* Cloud Medium，次要文字 */
  --c-card-feature-accent: #D97757;     /* 标签底色/文字色/左边框，同一张暗卡内最多一种辅助色 */

  /* 终端卡片：比页面略亮，浮起来（非凹陷） */
  --c-card-terminal-bg: #1E1E2E;
  --c-card-terminal-text: #CDD6F4;
  --c-card-terminal-accent: #F38BA8;   /* 冷调 terminal-red，与字色同温 */

  /* ── 提示/警告容器（纯色浅底 + 左边框） ── */
  --c-tint-blue: #EBF2F8;
  --c-tint-green: #ECF0E6;
  --c-tint-orange: #FAEDE6;
  --c-tint-blue-border: #6A9BCC;
  --c-tint-green-border: #788C5D;
  --c-tint-orange-border: #D97757;

  /* ── 特殊底色 ── */
  --c-surface: #FFFFFF;          /* 纯白浮层，仅用于模态框/弹出层/tooltip 等浮起元素，禁止做卡片背景 */

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

**BGM 集成**（可选）：
- BGM 文件放在 `public/audio/bgm/` 目录
- 在 Chapter 组件中添加第二个 `<Audio>` 轨道，volume 设为 0.15~0.25（不压过配音）
- BGM 跨章节连续播放：在 FullVideo.tsx 中用一个 `<Audio>` 播放全片 BGM，不在各 Chapter 中重复
- 如果用户未提供 BGM，跳过此步骤，不自动添加

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



## 场景节奏系统

### 为什么需要明暗交替

一成不变的白底会让 7 分钟的视频显得单调。通过"明暗交替"制造视觉节奏感：
- 白底：承载报刊质感的正文、图表、卡片（主体内容，~60-70%）
- 暗底：承载代码终端、章节首尾、核心结论（节奏重音，~20-35%）

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

  /* 卡片系统 */
  --c-card-bg: #2D2C2A;                                    /* 默认卡片：深灰底 */
  --c-card-border: rgba(158, 156, 148, 0.15);              /* 暗色细边框 */
  --c-card-text: #EBEAE4;                                   /* 默认卡片：暖白字 */
  --c-card-oat-bg: #3A3936;                            /* Oat 卡：暗色下用 chart-gray */
  --c-card-oat-text: #EBEAE4;                          /* Oat 卡：暖白字 */

  /* Feature 暗卡：暗色主题下与亮色一致（近黑底） */
  --c-card-feature-bg: #141413;
  --c-card-feature-text: #FAF9F5;
  --c-card-feature-secondary: #B0AEA5;
  --c-card-feature-accent: #EE6B3E;

  --c-card-terminal-bg: #1E1E2E;                            /* 终端卡片：比页面略亮，浮起来 */
  --c-card-terminal-text: #CDD6F4;                          /* 终端卡片：蓝白字 */
  --c-card-terminal-accent: #F38BA8;                        /* 终端卡片：冷调，与字色同温 */

  /* 提示/警告容器：暗色主题下复用现有卡片/边框 token，不新增暗色 tint 色相 */
}
```

**色阶选择指南**（开发每个元素时必须做一次选择）：

**文字层级 → 对应色阶**（必须用 token，不硬编码）：

| 信息层级 | 亮色页面（#FAF9F5） | Feature 暗卡（#141413） | 暗色页面（#191917） | 何时用 |
|---------|-------------------|----------------------|-------------------|--------|
| 标题/主文 | `var(--c-text)` #141413 | `var(--c-card-feature-text)` #FAF9F5 | `var(--c-text)` #EBEAE4 | 核心信息、段落首句 |
| 次要说明 | `var(--c-text-secondary)` #7A7870 | `var(--c-card-feature-secondary)` #B0AEA5 | `var(--c-text-secondary)` #9E9C94 | 补充说明、描述、注释 |
| 弱化标注 | `var(--c-text-muted)` #9E9C94 | `var(--c-cloud-dark)` #87867F | `var(--c-text-muted)` #666560 | 时间戳、来源、标签、括号内注释 |
| 强调/CTA | `var(--c-accent)` #D97757 | `var(--c-card-feature-accent)` | `var(--c-accent)` #EE6B3E | 按钮、推荐标签、关键词高亮 |

> **关键**：亮色页面和暗色页面的 `var(--c-text)` 自动解析到不同色值（#141413 vs #EBEAE4），因为 `.dark-theme` 覆盖了 CSS 变量。Feature 暗卡始终是 #141413 底，所以有独立的 token。写代码时只需选对 token，不需要手动判断当前是亮还是暗。

**背景层级 → 对应色阶**：

| 层级 | 亮色 | 暗色 | token | 何时用 |
|------|------|------|-------|--------|
| 页面底 | #FAF9F5 | #191917 | `var(--c-bg)` | 最底层，永远不改 |
| 卡片底 | #FAF9F5 + 边框 | #2D2C2A + 边框 | `var(--c-card-bg)` + `var(--c-card-border)` | 标准内容卡 |
| 暖填充底 | #E3DACC | #3A3936 | `var(--c-card-oat-bg)` | 重要内容、推荐项 |
| 二级面 | #F0EEE6 | — | `var(--c-ivory-medium)` | 大块容器背景 |
| 浮层/弹出 | #FFFFFF | #2D2C2A | `var(--c-surface)` | 模态框、tooltip、弹出菜单（**禁止做卡片背景**） |
| 代码区底色 | #F3F1EC | #242422 | `var(--c-bg-warm)` | 代码片段底色、输入框背景（**不是卡片**） |
| 暗色底 | #141413 | #141413 | `var(--c-card-feature-bg)` | 核心结论（始终近黑） |
| 终端底 | #1E1E2E | #1E1E2E | `var(--c-card-terminal-bg)` | 代码块（始终深色） |

**边框/分割线 → 对应色阶**：

| 用途 | 亮色 | 暗色 | token |
|------|------|------|-------|
| 卡片边框 | #D1CFC5 | rgba(158,156,148,0.15) | `var(--c-card-border)` |
| 内部分割线 | #B0AEA5 半透明 | rgba(158,156,148,0.15) | `var(--c-divider)` |

**决策规则**：写每一行文字时，先判断"这行文字的信息层级是什么"，再选对应色阶。不要所有文字都用 `var(--c-text)`。

### 场景模式

| 模式 | 背景 | 用途 |
|------|------|------|
| **SceneLight** | `var(--c-bg)` 羊皮纸白 | 正文、图表、流程步骤 |
| **SceneDark** | 深炭墨 `#191917` | 开场标题、核心结论（重音拍） |
| **SceneLightWithDarkCard** | `var(--c-bg)` 羊皮纸白 | 亮色场景中嵌入暗色卡片（代码终端、终端输出），不切整页 |

---

## 卡片系统

### 四种卡片形态（按内容语义选择）

| 形态 | 背景 | 边框 | 圆角 | 语义 |
|------|------|------|------|------|
| ① 标准卡 | `#FAF9F5`（与页面同色） | `0.5px solid #D1CFC5` | 8px | 信息陈列，平等对待每条内容 |
| ② Oat 暖填充卡 | `#E3DACC` | 无 | 8px | 内容有分量但不是最高潮，给观众一个"停顿" |
| ③ Feature 暗卡 | `#141413` | 无 | 24px | 全章最重要的结论，不容错过 |
| ④ 终端卡 | `#1E1E2E` | 无 | 24px | 代码/技术内容 |

**Feature 暗卡 vs 终端卡**：两者背景色不同（`#141413` vs `#1E1E2E`），文字色不同（暖白 `#FAF9F5` vs 冷蓝白 `#CDD6F4`），语义不同（核心结论 vs 代码展示）。

#### 圆角规范（三档）

| 场景 | border-radius | 说明 |
|------|---------------|------|
| 普通卡片（标准、Oat） | 8px | 大多数内容卡片 |
| 面板 / 大块区域 | 16px | 多卡片容器、代码对比区 |
| Feature 大卡 / 终端卡 | 24px | 核心结论、代码展示 |

```tsx
// ① 标准卡
<div style={{
  background: 'var(--c-card-bg)',
  border: '0.5px solid var(--c-card-border)',
  borderRadius: 8,
  color: 'var(--c-card-text)',
}}>普通内容</div>

// ② Oat 暖填充卡
<div style={{
  background: 'var(--c-card-oat-bg)',
  borderRadius: 8,
  color: 'var(--c-card-oat-text)',
}}>重要但不是高潮的内容</div>

// ③ Feature 暗卡
<div style={{
  background: 'var(--c-card-feature-bg)',
  borderRadius: 24,
  color: 'var(--c-card-feature-text)',
}}>
  <p style={{ color: 'var(--c-card-feature-secondary)' }}>FEATURED</p>
  <h3>全章最重要的结论</h3>
  <span style={{ color: 'var(--c-card-feature-accent)' }}>了解更多 →</span>
</div>

// ④ 终端卡
<div style={{
  background: 'var(--c-card-terminal-bg)',
  borderRadius: 24,
  color: 'var(--c-card-terminal-text)',
}}>$ echo "code here"</div>
```

#### 卡片形态决策树（Claude 必须遵守）

开发每个场景的卡片时，问自己三个问题：

**Q1：这块内容，如果去掉，观众会错过什么核心认知？**
- 「去掉也没大碍」→ 标准卡 ①
- 「会少一个关键点」→ Oat 卡 ②
- 「整段内容的灵魂」→ Feature 暗卡 ③

**Q2：这章里，已经用过暗卡了吗？**
- 「没用过」→ 当前内容若是核心结论，可以用暗卡
- 「已用过一个」→ 如果确实是本章最核心的结论，可以用第二个
- 「已用过两个」→ 强制降级为 Oat 卡，暗卡每章不超过 2 个

**Q3：这块内容是「一条」还是「多条并列」？**
- 「多条并列，需要对比」→ 强制标准卡 ①，暗卡不能容纳列表
- 「一句话 / 一个观点」→ 可考虑暗卡或 Oat 卡

#### 内容类型 → 卡片形态映射

| 内容类型 | 卡片形态 | 原因 |
|---------|---------|------|
| 功能列举 / 步骤拆解 / 多概念并排 | 标准卡 ① | 平等陈列 |
| 数据表格 / 对比方案 / 引用来源 | 标准卡 ① | 需要扫读 |
| 重要背景知识 / 关键定义 | Oat 卡 ② | 值得停顿 |
| 小节小结 / 观点推进前的铺垫 | Oat 卡 ② | 有分量但非高潮 |
| 全章核心结论（一句话） | Feature 暗卡 ③ | 不容错过 |
| 反转性观点 / 最终答案 | Feature 暗卡 ③ | 让观众停下来想 |
| 代码 / 终端输出 / 技术内容 | 终端卡 ④（亮色场景下用 SceneLightWithDarkCard 包裹，不切整页） | 代码天然深色 |

#### 硬性约束

| 约束 | 说明 |
|------|------|
| Feature 暗卡按需使用 | 判断标准：这段内容如果错过，观众会损失关键信息吗？是 → 用。否 → 不用 |
| 同一章内 Feature 暗卡不超过 2 个 | 超过 2 个就失去"最重要"的含义，多余的降级为 Oat |
| 列表/多条内容不进暗卡 | 暗卡只放单句核心结论 |
| 连续两个 Oat 卡禁止 | Oat 后必须接标准卡（节奏落下来） |
| 信息密集型章节至少 1 个 Oat | 叙事型章节可以不用（纯大字排版即可） |
| 同一场景内非标准卡最多 1 种 | 其余全用标准卡 |
| accent 只用于标签层 | 不做整块容器背景填充 |
| Feature 暗卡内多种辅助色标签 | 暗卡已是最强视觉元素，多色稀释分量。同一张暗卡内最多一种辅助色 |

#### 辅助色三层使用模型

辅助色（蓝 #6A9BCC、绿 #788C5D、橙 #D97757、粉 #F38BA8）按使用层级分三档：

| 层级 | 规则 | 示例 |
|------|------|------|
| **图形层** ✓ 放开用 | 数据图线条、SVG 涂鸦、流程图连接线 | 三色同时出现没问题 |
| **标签层** △ 克制用 | 小标签底色、色点、编号圆、左边框、accent 文字 | 同屏最多 3 种，面积总和 < 屏幕 5% |
| **容器背景层** ✗ 禁止 | 大面积卡片背景、Surface 容器填充 | 不管面积多小，整块填充都破坏暖调基调 |

> 详细示例见 `references/surface-demo.html`

#### accent 使用规范

**accent 赤陶色（`#D97757`）的用法**：
- **文字色**：CTA 文字、关键词高亮、强调句（直接 `color: var(--c-accent)`）
- **标签底色**：小标签/药丸的容器背景（白字，`background: var(--c-accent)`）
- **左边框**：左侧 3px 实色边框（`border-left: 3px solid var(--c-accent)`）
- **图形色**：数据图线条、SVG 涂鸦描边

**accent 不用于**：大面积容器背景填充

**每个版块最多 1~2 处 accent 元素**，默认状态下整页接近无彩色。

> **暗色主题下 accent 自动提亮**：亮色主题 accent = `#D97757`，暗色主题 accent = `#EE6B3E`。代码中统一用 `var(--c-accent)` 引用，`.dark-theme` 自动切换。Feature 暗卡 accent 同理，用 `var(--c-card-feature-accent)`。

**Feature 暗卡内部规范**：
- 标题：`var(--c-card-feature-text)` → `#FAF9F5` Ivory Light（暖白，非纯白）
- 次要：`var(--c-card-feature-secondary)` → `#B0AEA5` Cloud Medium
- accent：`var(--c-card-feature-accent)`（标签底色或文字色，同一张暗卡内最多一种辅助色）

#### 分类并列项的正确做法

卡片内多个并列项（如三种方案对比），不要用不同辅助色做整块容器背景。正确做法：

1. **色点 + 小标签**（推荐）：8px 圆点 + 小 tag，辅助色面积最小化
2. **左侧色条**：3px 左边框，辅助色只占一条线
3. **编号圆**：彩色圆形编号（30px），色彩集中在小区域
4. **数据图**：辅助色做线条，图形层放开用

> 示意图见 `references/surface-demo.html` 第 3-7 节

#### 提示/警告容器

提示、警告、最佳实践等 callout 容器，用**纯色浅底 + 左侧 3px 实色边框**：

```css
/* 提示/警告容器背景（不透明，可直接用于视频帧） */
--c-tint-blue:   #EBF2F8;   /* 极浅蓝，提示 */
--c-tint-green:  #ECF0E6;   /* 纸感浅绿，最佳实践 */
--c-tint-orange: #FAEDE6;   /* 贝壳橙，注意/警告 */

/* 配套边框（左侧 3px 实色） */
--c-tint-blue-border:   #6A9BCC;
--c-tint-green-border:  #788C5D;
--c-tint-orange-border: #D97757;
```

约束：单个 callout 高度 ≤ 80px，同屏最多 2 个，不做卡片主体背景。

> **Oat 卡上的 callout**：只用 tint-orange 和 tint-green（暖调），不用 tint-blue（冷蓝白与暖黄棕色温冲突）。如需蓝色 callout 叠在 Oat 上，改用 `#FAF9F5` 底 + 蓝左边框。

#### 否定清单（禁止的模式）

| 禁止 | 原因 | 正确做法 |
|------|------|---------|
| Oat 卡有 border / boxShadow | Oat 靠颜色区分，不需要边框 | 无边框无阴影 |
| Oat 卡用绿/蓝/红文字 | 卡片文字只用中性色阶 | 用 `var(--c-card-oat-text)` 或 `var(--c-accent)` 文字色 |
| 辅助色做整块容器背景 | 高饱和填充破坏暖调基调 | 辅助色只做标签/色点/左边框，不做整块背景 |
| Oat 卡上叠 tint-blue callout | 冷蓝白与暖黄棕色温冲突 | Oat 卡内只用 tint-orange / tint-green，或用 #FAF9F5 底+蓝边框 |
| Feature 暗卡用绿/蓝/红文字 | 暗卡文字用 Ivory Light / Cloud Medium | 用 `var(--c-card-feature-text)` / `var(--c-card-feature-secondary)` |
| 标准卡无边框 | 与页面同色，没有边框就看不见 | 必须有 `border: 0.5px solid var(--c-card-border)` |
| 列表/多条内容放进暗卡 | 暗卡只放单句核心结论 | 列表用标准卡 |
| 信息密集型章节没有 Feature 暗卡但核心结论缺少视觉重音 | 教程/数据类内容需要信息重音 | 核心结论用暗卡，按需使用 |
| 叙事型章节强行塞 Feature 暗卡 | 感性叙事不需要信息重音，硬塞反而刻意 | 按需添加，不强制 |
| 一章超过 2 个 Feature 暗卡 | 暗卡太多失去"最重要"含义 | 多余的降级为 Oat |
| 连续两个 Oat 卡 | 节奏没有落下来 | Oat 后必须接标准卡 |
| 信息密集型章节全用标准卡 | 太平淡，无节奏 | 至少 1 个 Oat |
| 信息密集型章节没有 Oat 卡 | 缺少节奏缓冲 | 每章至少 1 个 Oat 卡 |
| 卡片内硬编码颜色 | 应该用 tokens.css 变量 | 用 `var(--c-card-*)` 系列 |

### 全屏组件规范

全屏组件占据整个 1920x1080 画面，用于特殊的视觉呈现场景。与普通卡片/场景不同，全屏组件有独立的布局和交互规则。

#### CodeComparison（左右分屏代码对比）

适用场景：Before/After 代码对比、重构展示、优化前后对比

**结构**：
- 左侧 45%："Before" 代码
- 中间 10%：分隔线或箭头（可用 `var(--c-divider)` 或 accent 色箭头）
- 右侧 45%："After" 代码

**规范**：
- 代码字体 20px，行高 1.7，使用 `var(--font-mono)`
- 当前行高亮（背景 `var(--c-terminal-highlight)`）
- 其他行默认色（`var(--c-terminal-text)`）
- 左侧标签 "BEFORE"，右侧标签 "AFTER"（标签用 `var(--c-text-muted)` 或 accent 色）
- 用 `Sequence` 实现左右代码依次出现（左侧先出现，右侧延迟 12-18 帧）
- 代码区域背景使用 `var(--c-card-terminal-bg)`，圆角 16px
- 代码区域 padding 24px

**示例结构**：
```tsx
<div style={{ display: 'flex', width: '100%', height: '100%', gap: 40, padding: 100 }}>
  {/* 左侧 Before */}
  <div style={{ width: '45%', background: 'var(--c-card-terminal-bg)', borderRadius: 16, padding: 24 }}>
    <div style={{ color: 'var(--c-text-muted)', fontSize: 20, marginBottom: 16 }}>BEFORE</div>
    {/* 代码行 */}
  </div>
  {/* 中间分隔 */}
  <div style={{ width: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 2, height: '60%', background: 'var(--c-divider)' }} />
  </div>
  {/* 右侧 After */}
  <div style={{ width: '45%', background: 'var(--c-card-terminal-bg)', borderRadius: 16, padding: 24 }}>
    <div style={{ color: 'var(--c-accent)', fontSize: 20, marginBottom: 16 }}>AFTER</div>
    {/* 代码行 */}
  </div>
</div>
```

#### TerminalSequence（终端序列）

适用场景：命令行操作演示、安装流程、配置步骤

**结构**：
- 800px 宽，居中
- 背景 `var(--c-card-terminal-bg)`
- 圆角 24px
- 三色圆点标题栏（红 #F38BA8 / 黄 #F9E2AF / 绿 #A6E3A1，各 12px 圆点）

**规范**：
- 每条命令依次出现（逐项延迟 12 帧）
- 输出紧跟命令（延迟 3-5 帧）
- 命令文字用 `var(--c-terminal-text)`
- 输出文字用 `var(--c-text-muted)`
- 当前命令高亮（背景 `var(--c-terminal-highlight)`）
- 命令前缀 `$` 用 `var(--c-accent)`
- 终端区域 padding 32px，内部行间距 8px
- 字体使用 `var(--font-mono)`，20px

**示例结构**：
```tsx
<div style={{
  width: 800, margin: '0 auto', background: 'var(--c-card-terminal-bg)',
  borderRadius: 24, overflow: 'hidden',
}}>
  {/* 标题栏 */}
  <div style={{ display: 'flex', gap: 8, padding: '16px 24px' }}>
    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F38BA8' }} />
    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F9E2AF' }} />
    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#A6E3A1' }} />
  </div>
  {/* 命令区域 */}
  <div style={{ padding: '0 32px 32px', fontFamily: 'var(--font-mono)', fontSize: 20 }}>
    {/* 命令行依次出现 */}
  </div>
</div>
```

#### 全屏组件使用规则

| 规则 | 说明 |
|------|------|
| 前后必须有非全屏场景 | 避免连续全屏组件，前后各至少 1 个普通场景（SceneLight / SceneDark） |
| 不计入简洁帧/密集帧统计 | 全屏组件是独立类型，不参与帧型比例计算 |
| 每章最多 1-2 个 | 全屏组件是特殊展示，过多会打断节奏 |
| 与暗色场景的关系 | 全屏组件自带深色背景（终端类），不额外加 dark-theme className |
| 字幕安全 | 代码/终端内容 y < 930，底部留 160px |

### 节奏驱动决策规则（替代内容驱动）

**旧规则（已弃用）**：内容类型 → 固定主题（代码=暗、图表=亮…）
- 问题：主题可预测，观众提前知道下一个颜色，节奏感消失

**新规则**：频率驱动，暗色按间隔插入，内容适配主题

暗色是「重音拍」，按频率插入（不依赖"章"的概念）：
1. 全片第 0 场景必须暗色（开场重音）
2. 此后每出现 3~4 个连续亮色场景，插入 1 个暗色场景
3. 有章节时，章节首场景天然适合作为暗色位置（但不强制）
4. 全片最后一个场景可以暗色（收尾重音，可选）

**内容适配主题**：
- 代码终端在亮色场景 → 用 SceneLightWithDarkCard（卡片暗色，不切整页）
- 结论在亮色场景 → 用大字 + 赤陶色强调，不换暗底
- 开场在暗色 → 大字白色 + 赤陶 accent，无需任何卡片

#### 节奏约束

```
连续暗色场景：最多 1 个
连续亮色场景：最多 4 个（含 LightWithDarkCard，体感不同）
暗色场景比例：20%~35%
```

**章节标题与暗场景的关系**：
- 带章节标题时：章节标题场景计入暗场景配额（20-35%）
- 不带章节标题时：暗场景配额不变，由普通场景承担暗色节奏
- 连续章节标题冲突：当两个章节标题场景连续出现时，第二个改用亮色方案（深色文字 + 浅色背景），避免连续暗色

**示例 A**：有章节（6 个场景的章节）
```
场景 0: SceneDark                ← 开场，重音拍 #1
场景 1: SceneLight               ← 正文
场景 2: SceneLight               ← 图表
场景 3: SceneLightWithDarkCard   ← 代码（不切整页！）
场景 4: SceneLight               ← 流程步骤
场景 5: SceneDark                ← 3 个亮之后，重音拍 #2
```

**示例 B**：无章节（15 个场景一条线排下来）
```
场景 0:  SceneDark               ← 开场，重音拍 #1
场景 1:  SceneLight
场景 2:  SceneLight
场景 3:  SceneLight
场景 4:  SceneDark               ← 3 个亮之后，重音拍 #2
场景 5:  SceneLight
场景 6:  SceneLight
场景 7:  SceneLight
场景 8:  SceneLight
场景 9:  SceneDark               ← 4 个亮之后，重音拍 #3
场景 10: SceneLight
场景 11: SceneLight
场景 12: SceneLight
场景 13: SceneDark               ← 3 个亮之后，重音拍 #4
场景 14: SceneDark               ← 收尾（可选，与上一场景连续暗色也可）
```

**示例 C**：叙事型（信件/回忆录，情感流动，暗色较少）
```
场景 0: SceneDark                ← 开场
场景 1: SceneLight               ← 共鸣段落
场景 2: SceneLight               ← 故事开始
场景 3: SceneLight               ← 转折
场景 4: SceneDark                ← 核心金句（重音拍）
场景 5: SceneLight               ← 展开
场景 6: SceneLight               ← 收获
场景 7: SceneLight               ← 方法
场景 8: SceneLight               ← 寄语
场景 9: SceneDark                ← 结尾重音
```

### 动画过渡规则

**场景间切换**：硬切（直接换组件，无过渡动画）
- 暗→亮、亮→暗的切换是整场景组件级的替换
- 不需要 interpolateColor 做场景间的渐变
- Anthropic 官网风格：零渐变、零阴影柔化，硬边切换

**场景内元素出现**：18~24 帧 easeOut
- 比原来 5 帧慢 3~5 倍，像「翻书」而非「闪烁」
- 淡入 + 轻微上滑配合使用
- 18 帧用于普通元素淡入，24 帧用于重要元素（如核心金句、Feature 暗卡标题）的强调入场

```tsx
const FAST = 18; // 普通元素动画时长
const SLOW = 24; // 重要元素动画时长
const opacity = interpolate(frame, [delay, delay + FAST], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.out(Easing.cubic),
});
const y = interpolate(frame, [delay, delay + FAST], [24, 0], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.out(Easing.cubic),
});
```

**仅在单场景内需要局部切换时**才用 `interpolateColor`（18 帧 easeInOut），多数情况直接换场景组件。

### 信息密度曲线

全片信息密度应呈波浪形态，而非一成不变：

| 阶段 | 密度 | 原因 |
|------|------|------|
| 开场（前 30 秒） | 高 | Hook 观众，展示核心价值 |
| 第一章展开 | 中高 | 观众已投入，展开核心内容 |
| 章节间过渡 | 低 | 喘息，给观众校准时间 |
| 关键论点 | 最高 | 全片最重要的信息 |
| 证据/案例 | 中 | 用细节支撑论点 |
| 章节结尾 | 中低 | 总结，准备进入下一章 |
| 全片结尾 | 中 | 留下印象，不要过载 |

规则：
- 开场 30 秒内必须抛出核心价值（观众决定是否继续看）
- 每 60-90 秒有一次密度变化（升高或降低）
- 连续高密度不超过 2 分钟（观众会疲劳）
- 章节首场景密度略降（给观众 3-5 秒校准）

### 实现方式

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
  <div style={{ width: '50%', background: 'var(--c-bg)', color: 'var(--c-text)' }}>
    {/* 左：亮色 */}
  </div>
  <div className="dark-theme" style={{ width: '50%' }}>
    {/* 右：暗色，className 自动切换 CSS 变量 */}
  </div>
</div>
```

### 开发流程中的应用

**Phase 3 开发场景时**，Claude 必须按以下顺序执行：

**步骤零：场景规划闸门（强制，不可跳过）**
编码任何 Scene 前，先为每个场景补齐创作判断。详细规则见 `references/CREATIVE-GAP-PLAYBOOK.md`。

```markdown
场景 X：场景名称
  - 帧型：简洁帧 / 密集帧 D1-D6
  - 观众任务：这一屏让观众看懂/记住/判断什么
  - 视觉重音：Level 1-5（词级/项级/区块级/帧级/节奏级）
  - 留存节拍：Hook / Map / Reveal / Contrast / Payoff
  - 色彩策略：中性色为主，accent/辅助色用途
  - 字幕安全：核心内容 y < 930，底部留 160px
```

**硬规则**：不要在编码阶段临时决定帧型、重音和卡片形态。先规划，再实现。

**步骤一：场景模式标注**
按节奏驱动规则为每个场景标注模式（SceneDark / SceneLight），检查节奏约束。

**步骤二：卡片形态标注（强制，不可跳过）**
对每个场景中的每张卡片，按决策树标注形态：

```
场景 X：场景名称
  - 卡片 A（标题/内容摘要）→ 标准卡 ①
  - 卡片 B（标题/内容摘要）→ Oat 卡 ②（推荐/重要但非高潮）
  - 底部总结（一句话）→ Feature 暗卡 ③（内容重要才用，不强制每章都有）
```

**检查清单**（每章完成后核对）：
- [ ] Feature 暗卡按需使用：这段内容错过会损失关键信息吗？是 → 用。否 → 不用
- [ ] 同一章内 Feature 暗卡不超过 2 个
- [ ] Feature 暗卡内用 `var(--c-card-feature-text)` / `var(--c-card-feature-secondary)`，不用绿/蓝/红
- [ ] Oat 卡无边框、无 boxShadow、无彩色点缀，纯靠 `#E3DACC` 背景区分
- [ ] 标准卡有 `border: 0.5px solid var(--c-card-border)`
- [ ] 列表/多条并列内容不进暗卡
- [ ] 不连续出现 Oat 卡
- [ ] 信息密集型章节至少 1 个 Oat（叙事型章节可不用）

**步骤三：编码实现**
按标注结果实现卡片，不要在编码阶段临时决定卡片形态。

**outline.md 标注示例**：

```markdown
## Chapter 1: 模型基础（~90s）
- Scene 0: 开场标题（3.8s, ch1-0.wav）【SceneDark — 重音拍 #1】
- Scene 1: LLM 概念 + 涌现曲线（16s, ch1-1.wav）【SceneLight】
  - 涌现曲线图 → 标准卡 ①
  - 底部总结"LLM 的核心能力是涌现" → Feature 暗卡 ③
- Scene 2: 三种模型类型（30s, ch1-2.wav）【SceneLight】
  - LLM 卡 → 标准卡 ①
  - Chat Model 卡（推荐）→ Oat 卡 ②
  - Embedding 卡 → 标准卡 ①
  - 底部总结"LangChain 主要使用 Chat Model" → 本章已有暗卡，此处用 Oat
```

---
## Phase 1 — 内容编写

### 1.1 识别用户输入

| 用户给的东西 | 该做的 |
|---|---|
| 原始文章 | 一次产出 script.md + outline.md |
| 直接口播稿 | 落盘成 script.md，产出 outline.md |
| 简略文章 + 代码项目/资料库 | 启用信息/科普解释模式，先产出 feynman-notes.md，再产出 script.md + outline.md |
| 啥都没有 | 反问：先给素材或大纲 |

**边界条件处理**：
- 超短内容（<500 字）→ 建议用户补充素材，或明确视频时长目标（如"就做 1 分钟的预告"）
- 超长内容（>5000 字）→ 建议分集或压缩策略，让用户选择
- 多篇文章 → 问用户是否合并为一期，还是分多期

### 1.2 内容类型判断

拿到原文后，先判断内容类型，决定口播稿的处理策略。

### 判断决策树

读完用户输入后，按以下顺序判断：

1. **用户提供了学术论文/研究报告？** → 论文/学术类（忠实还原，不扩展）
2. **内容是个人经历/情感表达/散文故事？** → 抒情/散文类（口语化，保持情感基调）
3. **内容涉及商业推广/产品介绍/营销？** → 商业/产品类（突出卖点，结构化整理）
4. **内容是讲故事/案例叙述/叙事结构？** → 故事/叙事类（保持叙事节奏）
5. **内容包含代码/技术文档/API？**
   - 有操作步骤（怎么做）→ 教程类（讲清步骤，可费曼扩写）
   - 有原理解释（为什么）→ 代码项目讲解（讲清设计思想，费曼扩写）
6. **内容是数据/报告/统计分析？** → 数据/报告解读（突出关键数据，可视化）
7. **内容是观点/分析/评论？** → 观点/分析类（理清逻辑链）
8. **以上都不是，是知识/概念/科普？** → 信息类/科普类（费曼扩写，核心策略）

判断不确定时，问用户："这个内容你希望我怎么处理？忠实还原原文，还是用费曼学习法扩写？"

**忠实类（不擅自扩展）**

论文/学术类：
- 保留原文所有论点、数据、案例、结论，不删减实质性内容
- 语言可以口语化，但信息密度不能降低
- 原文有7个要点，口播稿里也应该是7个
- 如果原文某个论点只有一句话没有展开，不要自作主张补充，先问用户
- 原文的引用、数据来源、研究方法等细节保留，不要用"研究发现"一笔带过

抒情/散文类：
- 保留原文的情感基调、意象、修辞风格
- 口语化改写时注意：不要把有诗意的表达改成大白话
- 原文的留白和节奏感要保留，不要为了"信息密度"填满每个停顿
- 如果原文有意境但表达不够清晰，先问用户要不要调整，不要直接改

**扩展类（主动增强）**

信息类/科普类：
- 默认启用 `references/EXPLAINER-SCRIPTING.md` 的信息/科普解释模式
- 原文的核心信息保留，但要判断信息是否完整
- 如果原文只说了"是什么"，补充"为什么"和"怎么做"
- 如果原文有观点但没有数据支撑，补充相关数据或案例
- 如果原文概念之间缺少联系，建立逻辑链条
- 如果原文停留在理论，补充实际应用场景
- 扩展的内容要和原文风格一致，不要突兀
- 先写 `feynman-notes.md` 暴露解释缺口和证据来源，再写 `script.md`
- 每个重要结论必须能追溯到 article、代码路径、资料来源或明确标注的推理

教程类：
- 如果有代码项目或操作材料，也启用信息/科普解释模式
- 原文的步骤保留，但要检查是否每个步骤都足够清晰
- 如果某个步骤只说了"做X"但没说"怎么做X"，补充具体操作方法
- 如果原文没有说明"为什么要做这一步"，补充原因（观众需要理解意图）
- 如果原文缺少"怎么判断做对了"，补充验证方法
- 不要机械地在每个步骤后面加"常见错误"，要根据内容判断哪里真的容易出错

**意图判断类（先问用户）**

商业/产品类：
- 先问用户：是想精炼卖点，还是深度对比，还是讲故事
- 精炼卖点模式：保留核心优势，删减冗余描述
- 深度对比模式：补充竞品对比、使用场景、用户反馈
- 讲故事模式：保留品牌故事，增强情感连接
- 不要擅自添加"用户好评"或"行业数据"，除非原文有提及

故事/叙事类：
- 保留原文的情节、人物、冲突、结局
- 可以增强叙事节奏：适当的地方放慢、适当的地方加速
- 可以增加画面感：用更具体的描述替代抽象概括
- 不要改变人物性格、事件走向、故事主题
- 如果原文叙事平淡，可以建议增加转折点，但要问用户

### 1.3 产出 script.md + outline.md

启用信息/科普解释模式时，先产出 `feynman-notes.md`：
- 目标观众、核心问题、结束收益
- 每个概念的：大白话解释 / 为什么需要 / 证据来源 / 常见误解 / 边界条件 / Payoff 句
- 如果有代码项目，记录关键代码路径和主流程
- 无法从材料补齐的内容标记"需要用户确认"，不要编造

script.md: B 站 / YouTube 风格口播稿，口语化、有节奏感。

**内容保真原则（重要）**：
- script.md 是对 article.md 的口语化改写，不是精简摘要
- 保留原文的核心论点、数据、案例、技术细节
- 可以增加过渡句、口语化表达、节奏感，但不要删减实质内容
- 如果原文有 7 个要点，script 里也应该是 7 个，不能压缩成 3 个
- 参考风格：B 站技术区 up 主、YouTube TechLead、抖音知识博主

outline.md: 章节切分 + 每步内容 + 信息池。

outline 必须写：章节切分 / 每章 scene 数 / 估时 / 每步屏幕内容 / 章节级信息池 / **每张卡片的形态标注（标准卡① / Oat卡② / Feature暗卡③ / 终端卡④）**
启用信息/科普解释模式时，outline 每个场景还必须写：解释单元 / 观众问题 / 证据来源 / Payoff 句 / 帧型 / 视觉重音
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
      - 章节分配：每个 Agent 拿 1~2 章，互不依赖的章节并行
      - 共享资源：tokens.css / components/ / global.css 由主 Agent 预先创建，子 Agent 只读引用
      - 合并规则：子 Agent 完成后由主 Agent 合并到 ChapterX.tsx，检查命名冲突
      - 限制：同一章的多个场景必须由同一个 Agent 完成（保证卡片节奏一致性）
6. 章节标题偏好
   - 带章节标题（章节标题场景算入暗场景配额）
   - 不带章节标题（暗场景配额不变，由普通场景承担）
   - 由 AI 根据内容长度决定

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

基础替换：
- _（下划线）→ 空格（init_chat_model → init chat model）
- -（连字符）→ 空格（max-retries → max retries）

Markdown 清理：
- **粗体** → 删除 ** 标记，保留文字
- *斜体* → 删除 * 标记，保留文字
- # 标题 → 删除 # 标记，保留标题文字
- 代码反引号 → 删除反引号，保留内容
- [链接文本](URL) → 只保留"链接文本"，删除 URL
- ![图片描述](URL) → 删除整行
- > 引用块 → 删除 > 符号，保留引用文字
- - 列表标记 / 1. 有序列表 → 删除标记符，保留内容
- --- 分割线 → 删除

编程符号清理：
- () → 保留内容，删除括号
- {} → 删除
- [] → 保留内容，删除括号
- | → 替换为空格
- \ ~ ^ → 删除
- => → 读作"变成"或删除

保留：中文标点（。！？，、；：）、英文标点（.,!?）

### 2.2 合成音频

> **⚠️ 必须使用 MiMo TTS，不要使用 hyperframes tts。**

API 配置：
  Model: mimo-v2.5-tts（专用 TTS 模型，非聊天模型 mimo-v2.5）
  API: https://token-plan-cn.xiaomimimo.com/v1/chat/completions（POST）
  认证: 请求头 api-key（非 Authorization: Bearer）
  Voice: 苏打
  Format: WAV
  请求间隔: 500ms

**请求体格式（关键）**：
```json
{
  "model": "mimo-v2.5-tts",
  "messages": [
    { "role": "user", "content": "要合成的文本" },
    { "role": "assistant", "content": "要合成的文本" }
  ],
  "voice": "苏打",
  "response_format": "wav"
}
```

> **⚠️ 易错点**：
> - assistant 消息的 content 必须和 user 消息一致（不能留空），否则 TTS 输出极短或无声
> - voice 和 response_format 在请求体顶层，**不要**嵌套在 audio 对象里
> - Voice 值为中文名（"苏打"），不是 "v_soda"

运行：
  node scripts/synthesize-audio.mjs           # 合成全部（跳过已存在）
  node scripts/synthesize-audio.mjs --force   # 强制重新合成全部

**synthesize-audio.mjs 脚本来源**：由 Claude 根据上方 API 配置和下方自动重试机制编写，首次合成时自动创建。如已有脚本，核对 API 配置和重试逻辑是否匹配。脚本必须包含：(1) 完整的文本清理逻辑（见上方清理规则）；(2) 自动重试机制（见下方重试配置）；(3) WAV 文件输出；(4) 失败记录和汇总报告。

**错误处理**：
- API 返回 401/403 → 检查 api-key 是否正确、是否过期
- API 返回 429 → 请求间隔太短，增大到 1000ms
- 网络超时 → 检查网络连通性，必要时使用代理
- 单个片段质量差 → 修改 audio-segments.json 的 text 字段后单独重新生成（只重新生成单个文件，步骤见下方）
- WAV 文件异常（0 字节） → 检查 API 返回格式，重新运行合成脚本
- TTS 服务完全不可用 → 用户可选择 (a) 等待服务恢复，(b) 跳过音频进入纯视觉模式

### 自动重试机制

synthesize-audio.mjs 内置自动重试逻辑，无需手动干预：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 最大重试次数 | 3 次 | 单个片段最多重试 3 次 |
| 退避策略 | 指数退避 | 500ms → 1000ms → 2000ms |
| 429 响应 | 自动翻倍间隔 | 遇到限流自动将请求间隔翻倍后重试 |
| 超时 | 30 秒 | 单次请求 30 秒超时，超时后重试 |
| 失败处理 | 记录并继续 | 单个片段失败不中断整体，记录失败文件继续处理下一个 |
| 完成后 | 汇总报告 | 全部完成后输出成功/失败统计 |

**只重新生成单个文件**（不要用 --force 全部重新生成）：
  1. 临时把 audio-segments.json 只保留要重新生成的条目
  2. 运行合成脚本（--force）
  3. 恢复完整的 audio-segments.json
  4. 测量新帧数，更新 ChapterX.tsx 常量
  5. 更新 subtitle-timings.json

### 2.3 测量帧数

合成完成后，从 WAV header 计算每个文件的真实帧数。

**铁律：帧数 = 秒数 × 30，向上取整。必须从 WAV header 读取，不能估算。**

**通用测量脚本**（自动读取 audio-segments.json，无需手动枚举文件名）：

```bash
node -e "
const fs = require('fs');
const segs = JSON.parse(fs.readFileSync('audio-segments.json', 'utf8'));
const seen = new Set();
segs.forEach(s => {
  if (seen.has(s.audio)) return;
  seen.add(s.audio);
  const p = 'public/audio/' + s.audio;
  if (!fs.existsSync(p)) { console.log(s.audio + ': 文件不存在'); return; }
  const buf = fs.readFileSync(p);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  const secs = dataSize / byteRate;
  const frames = Math.ceil(secs * 30);
  console.log(s.audio + ': ' + secs.toFixed(2) + 's (' + frames + ' frames)');
});
"
```

**误差检查**：测量结果与 `ChapterX.tsx` 中已声明的帧数常量相差超过 **2 帧**，必须重新测量并更新常量，不可忽略。

### 2.4 生成字幕时间戳

音频帧数测量完成后，生成 subtitle-timings.json，为后续字幕集成做准备。

**生成方式**：
```bash
node scripts/gen-subtitle-timings.mjs
```

脚本读取 audio-segments.json 的 text 字段和 2.3 步骤测量出的帧数，按句子拆分规则生成每句的 start/end 帧号。

**句子拆分规则**（与字幕系统章节一致）：
- 只按句末标点断句：。！？
- 超过 50 字的句子才按 ；： 再拆
- 相邻短句（<12 字）自动合并
- 禁止按逗号 ，, 拆分

**时间戳分配**：根据每句字符数占总文本的比例分配帧数（长句多分，短句少分），不要均分。

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

### 3.1 项目初始化 + 脚手架 + 设计系统

**项目初始化**（从零开始时）：
```bash
npm init -y
npm install remotion@4.0.301 @remotion/cli@4.0.301 @remotion/media-utils@4.0.301 react@^18.3.1 typescript@^5.6.3
```

版本锁定（重要，不要随意升级）：
  remotion: 4.0.301
  @remotion/cli: 4.0.301
  @remotion/media-utils: 4.0.301
  react: ^18.3.1
  typescript: ^5.6.3

脚手架：
  mkdir src/{styles,components,scenes} public/audio out scripts references

**必须创建的入口文件**：
- `src/index.ts`：`import { registerRoot } from 'remotion'; import { Root } from './Root'; registerRoot(Root);`
- `src/Root.tsx`：注册所有 Composition（每个 Chapter + FullVideo），设置默认 FPS=30, width=1920, height=1080

字体加载：在 global.css 中用 @import 导入 Google Fonts（Lora, Poppins, JetBrains Mono），否则会静默回退到 Georgia/Arial/monospace。

**CJK 字体（中文内容必加）**：Remotion 使用 headless Chromium 渲染，如果没有中文字体会回退到系统默认字体或方块。在 global.css 中追加：
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
```
然后在 font-family 中添加 `'Noto Sans SC'` 作为第一个 fallback：
```css
--font-sans: 'Poppins', 'Noto Sans SC', Arial, sans-serif;
```

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

做完第 1 章后必须停下来等用户验收。验收清单：

```
第 1 章开发完成，请验收：
  □ 音画同步（口播和画面出现时机一致）
  □ 卡片形态是否按 outline 标注实现（标准/Oat/Feature/终端）
  □ 明暗节奏是否符合规则（20~35% 暗色）
  □ 所有字体 >= 24px，颜色来自 tokens.css
  □ Studio 预览无报错

确认 OK 后回复「继续」。
```

### 3.3 第 2~N 章

三种模式：
- A) 逐章确认：每章做完验收
- B) 顺序开发：全部做完统一验收
- C) 并行开发：Agent Teams 并行（推荐最大并行度 3）

### 3.4 创建 FullVideo.tsx

所有章节开发完成后，创建 `src/FullVideo.tsx` 将各 Chapter 组合成完整视频：

```tsx
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Chapter1, TOTAL_FRAMES as CH1_FRAMES } from './Chapter1';
import { Chapter2, TOTAL_FRAMES as CH2_FRAMES } from './Chapter2';
// ...

const C1_START = 0;
const C2_START = C1_START + CH1_FRAMES;
// ...

export const FullVideo: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={C1_START} durationInFrames={CH1_FRAMES} name="Chapter 1">
      <Chapter1 />
    </Sequence>
    <Sequence from={C2_START} durationInFrames={CH2_FRAMES} name="Chapter 2">
      <Chapter2 />
    </Sequence>
    {/* ...更多章节 */}
  </AbsoluteFill>
);
```

确保 Root.tsx 中已注册 `FullVideo` Composition（总帧数 = 所有章节帧数之和）。

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

### 渲染配置

默认配置（在 Root.tsx 的 Composition 中设置）：
- 分辨率：1920×1080（16:9）
- 帧率：30fps
- 编码：h264（默认）

如需自定义，在渲染命令中添加参数：
```bash
--fps=60                        # 帧率
--width=1080 --height=1920      # 竖屏 9:16
--codec=h264                    # 编码格式
```

### 渲染命令

国内网络需要指定本地 Chrome（跨平台路径）：
```bash
# Windows
--browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
# macOS
--browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Linux
--browser-executable="/usr/bin/google-chrome"
# 国内环境优先使用本地 Chrome，不推荐自动下载（网络可能不通）
# Windows 备选：Microsoft Edge
--browser-executable="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
```

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

### 渲染故障排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Chrome 路径错误 | 路径不匹配或未安装 | 检查本地 Chrome 路径是否正确，或改用 Edge |
| 内存不足（OOM） | 长视频渲染占用大量内存 | 分段渲染各章节，再用 FFmpeg 合并 |
| TypeScript 编译失败 | 组件有语法错误 | 在 Studio 预览中定位错误，先修复再渲染 |
| 音频文件缺失 | public/audio/ 下文件不全 | 检查 audio-segments.json 与实际文件是否匹配 |
| 组件运行时异常 | interpolate 越界、未定义变量 | 在 Studio 中逐场景预览，定位报错场景 |

**重要**：渲染前务必先在 Remotion Studio 中预览确认无报错。


## 动画系统

### 核心规则

1. 帧驱动：useCurrentFrame() 是唯一时间源
2. 确定性：同一帧数永远产生同一画面
3. 所有 interpolate 必须有 extrapolateLeft/Right: 'clamp'

### 动画导入

```tsx
import { useCurrentFrame, interpolate, Easing } from 'remotion';
```

### 动画节奏：延迟对齐 + 快速动画

动画速度保持快（~18 帧 ≈ 0.6s），只调整开始帧来对齐音频。

```tsx
const FAST = 18;
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
- 生成脚本：node scripts/gen-subtitle-timings.mjs

**字幕样式**：
- 底部居中，bottom: 40px
- 半透明深色背景 rgba(20,20,19,0.85)
- 白色文字 #EBEAE4，28px
- 8 帧淡入 + 6 帧淡出

**字幕策略说明**：当前方案为硬字幕（烧入视频），适合 B 站/YouTube/视频号等平台。如需软字幕（SRT/ASS），可在渲染后用 FFmpeg 提取 subtitle-timings.json 生成 SRT 文件。硬字幕优点：所有平台可见、样式统一；软字幕优点：观众可开关/调整大小。

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

### 术语定义

在本 Skill 中，以下术语有明确区分：
- **场景（Scene）**：一个 Sequence 单元，对应一段音频、一个场景组件文件（如 Scene0Title.tsx）
- **帧型（Frame Type）**：场景的视觉构图模式，分"简洁帧"和"密集帧"两种
- 一个场景可以是简洁帧或密集帧，两者是构图方式，不是场景的分类

### 两种帧型（核心概念）

视频帧分两种，必须交替使用：

**简洁帧（氛围感，40%）**
- 大字标题（48-72px）、大面积留白（40%+）、不对称偏置
- 用于：章节开场、概念预告、核心结论
- 模板：大字独白、偏置构图、标题在下、底部信息栏

**密集帧（信息量，60%）**
- 有数据表/对比/解释、多层级排版、底部有结论
- 用于：特性详解、性能对比、架构图解、代码+运行结果
- 6 种模板（见 layout-gallery.html Part 4）：
  - **D1 数据表格**：6-8 行数据表+表头+高亮行+注释行+底部结论条。适合性能对比、参数对比
  - **D2 左文右数据**：左 55% 文字+5标签+4子卡片 / 右 45% 6个数据卡+总结条。适合概念配指标
  - **D3 编号列表**：6 步编号列表，每步有编号圆+标题+英文标注+说明+右侧状态标签。适合步骤拆解
  - **D4 左解释+右代码**：左 42% 描述+参数表+陷阱提示 / 右 58% 15行完整代码。适合 API 演示
  - **D5 网格卡片**：3×2 六卡片网格，一张 Oat 标记推荐。适合方案对比、工具选型
  - **D6 问题-改进对比**：左右各 5 个痛点/改进 + 进度条对比。适合痛点分析、前后对比

### 布局 ID 系统

所有场景必须标注布局 ID，用于规划和审稿时快速识别构图类型：

| 布局 ID | 名称 | 子类型 | 适用场景 |
|---------|------|--------|----------|
| S1 | 大字独白 | 简洁帧 | 核心观点、开场、结尾 |
| S2 | 标题+副标题 | 简洁帧 | 章节转场、概念引入 |
| S3 | 引用卡 | 简洁帧 | 名言、核心结论 |
| S4 | 数据高亮 | 简洁帧 | 关键数字、统计 |
| D1 | 数据表格 | 密集帧 | 6-8 行数据表、参数对比、性能对比 |
| D2 | 左文右数据 | 密集帧 | 左 55% 文字+标签 / 右 45% 数据卡，概念配指标 |
| D3 | 编号列表 | 密集帧 | 6 步编号列表，步骤拆解、流程展示 |
| D4 | 左解释+右代码 | 密集帧 | 左侧文字解释 + 右侧代码展示 |
| D5 | 网格卡片 | 密集帧 | 多卡片并列，分类、特性列举 |
| D6 | 问题-改进对比 | 密集帧 | 问题与改进方案对比、Before/After |
| F | Feature 暗卡 | 特殊帧 | 全章最重要的结论（每章最多 2 个） |
| T | Terminal | 特殊帧 | 终端/代码展示 |
| CC | CodeComparison | 全屏组件 | 左右代码对比 |
| TS | TerminalSequence | 全屏组件 | 终端操作序列 |

**布局 ID 使用规则**：
- 连续场景不能使用同一布局 ID
- 每章至少使用 2-3 种不同布局类型
- 全屏组件（CC / TS）前后必须有非全屏场景

**每章视觉形式要求**：
- 每章至少使用 2-3 种不同布局类型
- 至少包含 1 种简洁帧 + 1 种密集帧
- 避免单章全部使用同一种布局
- 建议组合：开场简洁帧 → 展开密集帧 → 喘息简洁帧 → 深入密集帧 → 总结简洁帧

### 帧型选择决策器

| 口播信号 | 优先帧型 | 画面任务 |
|---------|----------|----------|
| "先记住一句话"、"真正的问题是" | 简洁帧 | 制造停顿、建立预期、强化关键词 |
| "有三个原因"、"分成四步" | 密集帧 | 让结构完整可见，逐项揭示 |
| "对比一下"、"改进前后" | 密集帧 | 把差异放在同一视野内 |
| "这里很反直觉"、"注意这个细节" | 简洁帧 → 密集帧 | 先打断，再解释 |
| "到这里可以得出结论" | 简洁帧 / Feature 暗卡 | 回收信息，让观众能复述 |

**简洁帧负责改变观众状态，密集帧负责交付信息。** 简洁帧不能只是空，必须承担悬念、转折、总结、喘息中的一个任务。

### 视觉重音体系

同一帧最多一个主重音。重音强度要匹配口播强度：
- **Level 1 词级**：关键词、参数名、术语。用 accent 文本、下划线、色点。
- **Level 2 项级**：当前正在讲的列表项/代码行。用左边框、编号圆点、当前行高亮。
- **Level 3 区块级**：一个区域比其他区域重要。用 Oat 卡、浅 tint 提示、细边框。
- **Level 4 帧级**：核心结论、章节转折。用简洁帧、暗色主题、Feature 暗卡。
- **Level 5 节奏级**：情绪变化、段落换挡。用明暗切换、留白、短暂停顿。

禁止所有项同时高亮、之前项永久高亮、同章反复使用 Feature 暗卡、用高饱和整块背景制造重音。

### 观众留存节拍

每个场景至少标注一个节拍：
- **Hook**：用问题、反差、代价或结果让观众进入。
- **Map**：告诉观众这段有几个部分，但不提前铺满细节。
- **Reveal**：逐项交付信息，口播说到哪里，画面出现到哪里。
- **Contrast**：用前后、好坏、左右、旧新制造判断感。
- **Payoff**：把解释压成一句可复述的结论。

时间规则：
- 开场 8 秒内直接给问题、反差或承诺，不先铺背景。
- 每 20-35 秒至少一次轻转折（简洁帧、暗色帧、对比帧、代码运行结果、结论条）。
- 每 60-90 秒一句结构回收：刚解决了什么，下一段为什么重要。
- 结尾 12 秒给压缩版答案，最后一帧应像可截图的结论。

### 色彩用量

颜色是语法，不是装饰。默认比例：
- 80% 中性色承载阅读（Ivory / Ink / Slate / Cloud）
- 15% Oat、浅 tint、细分割线组织区域
- 5% accent 和辅助色负责真正注意力

同帧最多两种辅助色：一个主 accent，一个语义辅助色。Feature 暗卡内通常只保留 accent。颜色只使用当前颜色库里的既有 token，不新增 chart-yellow/purple 或 tint-yellow/purple。

### 逐层深入模式

同一知识点，用"放大镜"方式逐层展开：
```
概览（简洁帧）→ 详解（密集帧）→ 深挖 A（密集帧）→ 深挖 B（密集帧）
```
示例：RDD 五大特性 → 概览（简洁·五个标签）→ 详解（密集·每项一行解释）→ 深挖（密集·分区机制+代码+图）

### 章节节奏公式

```
章节开场（简洁·暗色）→ 概念预告（简洁）→ 详解（密集）→ 深挖（密集，可选）→ 下一概念（简洁）→ ...
```

**约束**：
- 不能连续 2 帧都是简洁帧（观众觉得空洞）
- 不能连续 3 帧都是密集帧（观众疲劳）
- 每屏布局不重复（连续场景结构不同）

### 构图参考

项目的 `references/layout-gallery.html` 包含完整构图示例：
- Part 1：8 种简洁帧模板（大字独白、偏置构图、标题在下...）
- Part 2：简洁 vs 密集对比（同一内容两种处理）
- Part 3：逐层深入模式（概览→详解→深挖）
- Part 4：6 种密集帧模板（数据表格、左文右数据、编号列表、左代码右解释、2×2 网格、问题-改进对比）

开发新场景前先浏览该文件确定构图方式。

详细规则见 `references/CHAPTER-CRAFT.md` Part 4: 布局构图规则。
创作判断见 `references/CREATIVE-GAP-PLAYBOOK.md`；可视化参考见 `references/creative-gap-playbook.html`。

### 内容边界

- 所有内容在 y=930 以上（永远遵守，即使不加字幕——用户发布时可能外挂字幕）
- 底部 padding >= 160px（为字幕留空间）
- 字体 >= 24px
- 每屏 1-2 个核心信息点

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

### 布局间距规则

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

**卡片样式**：按上方"四种卡片形态"表格实现（标准卡有边框，Oat/Feature/终端无边框）。禁止使用 `var(--c-surface)` 做卡片背景，只用 `var(--c-card-*)` 系列。

---

## 质检流程（Agent Teams 自动触发）

**核心规则**：每个 Phase 完成后，**必须并行派出两个独立 Agent** 进行质检。两个 Agent 全部 PASS 后才能进入下一个 Phase。任何一个 Agent 报 FAIL，必须修复后重新质检。

### 执行方式

每个 Checkpoint 通过单条消息并行派出两个 Agent（使用 Agent tool，两条调用写在同一消息中）：

```
Agent 1: description="质检 Phase N - 角色A", prompt="...", subagent_type="reviewer"
Agent 2: description="质检 Phase N - 角色B", prompt="...", subagent_type="reviewer"
```

两个 Agent 互不可见、互不依赖，各自独立读取项目文件并输出报告。

### Phase 1 完成后 → Checkpoint Plan 质检

**Agent 1：内容质检**
- 读取 `<project>/article.md` 和 `<project>/script.md`；如存在 `<project>/feynman-notes.md` 也必须读取
- 逐节对比：文章的每个知识点是否在口播稿中有覆盖
- 检查口播稿是否有文章中不存在的错误知识
- 检查口播语句是否自然（非书面语、无过长句子）
- 检查 script.md 中不含模糊写法（如"等等"、"诸如此类"、"就不展开了"、"大家可以自行了解"——这些是偷懒信号）
- 检查每个场景/段落是否有 Payoff 句（可复述的结论句），不能只是信息罗列而无收束
- 信息/科普解释模式：检查每个重要结论是否有证据来源或明确标注为推理
- 信息/科普解释模式：检查术语第一次出现是否有大白话解释
- **PASS 标准**：article.md 的每个核心知识点在 script.md 中均有对应覆盖；无模糊偷懒写法；每个段落有 Payoff 收束句
- **FAIL 标准**：存在未覆盖的知识点；有模糊写法超过 2 处；任意段落缺少 Payoff 句
- 输出：PASS / FAIL + 缺失知识点列表 + 模糊写法位置

**Agent 2：结构质检**
- 读取 `<project>/script.md` 和 `<project>/outline.md`；如存在 `<project>/feynman-notes.md` 也必须读取
- 检查场景数与口播段落数是否匹配
- 检查帧类型比例（简洁帧 30-45%，密集帧 55-70%）
- 检查暗色场景比例（20-35%）
- 检查连续简洁帧不超过 2 个
- 检查连续场景布局不重复（相邻场景不能使用相同构图模板，如连续两个居中大字独白）
- 检查每章是否有章节标题场景
- 信息/科普解释模式：检查每个场景是否有解释单元、观众问题、证据来源、Payoff 句
- **PASS 标准**：场景数与段落数一致；暗色比例 20-35%；无连续同布局；每章有标题场景
- **FAIL 标准**：场景数与段落数不匹配；暗色比例超出范围；连续 2 个以上场景使用相同布局；章节缺标题场景
- 输出：PASS / FAIL + 结构问题列表

### Phase 2 完成后 → Checkpoint Audio 质检

**Agent 1：音频质检**
- 读取 `<project>/audio-segments.json`
- 检查每个 segment 的 text 字段是否与 script.md 对应段落一致（逐字对比，不允许精简或改写）
- 检查 text 中是否有 TTS 不友好的字符（下划线 `_`、连字符 `-`、反引号 `` ` ``、`**`、`#`、`[]`、`()`、`{}`、`|`、`~`、`^`）
- 检查 audio 文件名是否按 chapter-scene 规则命名（如 ch1-0.wav）
- 检查每个 WAV 文件是否存在且大小 > 0 字节（0 字节 = TTS 合成失败）
- 尝试用 `node -e` 读取 WAV header 验证文件可解析（byteRate > 0, dataSize > 0）
- **PASS 标准**：所有 text 与 script.md 一致；无 TTS 不友好字符；所有 WAV 文件存在且可解析
- **FAIL 标准**：text 有不一致；存在未清理的符号；WAV 文件缺失或 0 字节
- 输出：PASS / FAIL + 文本不一致列表 + 异常文件列表

**Agent 2：帧数质检**
- 读取 `<project>/public/audio/` 下所有 WAV 文件
- 从 WAV header 读取 byteRate 和 dataSize，计算秒数 = dataSize / byteRate
- 帧数计算公式：`Math.ceil(seconds * 30)`（向上取整，不加缓冲）
- 与 ChapterX.tsx 中的帧数常量对比，误差必须 <= 2 帧
- 与 FullVideo.tsx 中的总帧数对比
- 检查各 Chapter 帧数之和是否等于 FullVideo 总帧数
- **PASS 标准**：所有 WAV 帧数与 ChapterX.tsx 常量误差 <= 2 帧；各 Chapter 帧数之和 = FullVideo 总帧数
- **FAIL 标准**：任意 WAV 帧数误差 > 2 帧；帧数之和不等于总帧数
- 输出：PASS / FAIL + 帧数不匹配列表（含文件名、期望值、实际值、误差）

### Phase 3 完成后 → Checkpoint Render 质检

双 Agent 质检 + 自检清单合并，逐条核对：

**Agent 1：代码质检**
- 读取 `<project>/src/` 下所有 .tsx 文件
- 运行静态质检脚本（如存在）：`node <skill>/scripts/lint-remotion-scenes.mjs <project>`
- 检查清单：
  - [ ] 已运行 `node <skill>/scripts/lint-remotion-scenes.mjs <project>`（或项目内同名脚本），无 error
  - [ ] 所有 interpolate 有 extrapolateLeft/Right: clamp（漏一个即 FAIL）
  - [ ] 无 Date.now / Math.random（非确定性 API，渲染会不一致）
  - [ ] 暗色场景用 AbsoluteFill className="dark-theme"（不要 div 包裹 Sequence）
  - [ ] 暗色场景的 AbsoluteFill style 中必须显式设置 `background: 'var(--c-bg)'`（否则父级亮色背景会透出，因为 CSS 变量作用域问题）
  - [ ] interpolateColor 用 3 参数形式
  - [ ] 字体 >= 24px（grep 所有 fontSize < 24，发现即 FAIL）
  - [ ] 所有颜色引用 tokens.css 变量（`var(--c-*)`），无硬编码 hex/rgba（grep `#[0-9a-fA-F]{3,8}` 和 `rgba\(` 排除 global.css/tokens.css 本身）
  - [ ] 无 emoji 当图标
  - [ ] 动画时长 >= 18 帧（FAST 常量 + 内联范围）
  - [ ] 无 `var(--c-surface)` 或 `var(--c-card-featured-*)` 残留
- **PASS 标准**：lint 脚本 0 error；所有 interpolate 有 clamp；无非确定性 API；无硬编码颜色；无 fontSize < 24
- **FAIL 标准**：lint 有 error；任意 interpolate 缺 clamp；使用 Date.now/Math.random；硬编码颜色超过 0 处；fontSize < 24 存在
- 输出：PASS / FAIL + 代码问题列表（含文件名和行号）

**Agent 2：视觉质检**
- 读取 `<project>/src/scenes/` 下所有场景文件
- 读取 `<project>/outline.md` 获取场景规划
- 检查清单：
  - [ ] 标题-内容间距 >= 30px（检查 top 值差）
  - [ ] 每个场景都有观众任务标注（看懂/记住/判断什么）
  - [ ] 每个场景只有一个主视觉焦点，1 秒内能判断先看哪里
  - [ ] 连续场景布局不重复（特别是章节标题场景——每章的构图方式必须不同：左对齐/右对齐/幽灵数字/底部锚定等，不能全是居中对齐）
  - [ ] accent 色克制使用：每场景最多 1-2 处 accent（装饰线、关键词高亮），副标题/标签等次要元素不要用 accent
  - [ ] 简洁帧的入场动画核心元素用 SLOW(24)，装饰元素用 FAST(18)，多元素需有 stagger 先后顺序
  - [ ] Feature 暗卡标题字号 >= 52px（建议 56px），确保视觉冲击力
  - [ ] 暗色场景比例 20-35%（统计所有场景的 className，超出范围即 FAIL）
  - [ ] 连续暗色场景不超过 1 个；连续亮色场景不超过 4 个
  - [ ] 所有内容 y < 930
  - [ ] 标准卡有 `border: 0.5px solid var(--c-card-border)`
  - [ ] Oat 卡无 border、无 boxShadow（纯靠 #E3DACC 背景区分）
  - [ ] Feature 暗卡按需使用（信息重音点才用，叙事型章节可不用），同章不超过 2 个
  - [ ] 卡片文字不用绿/蓝/红（用中性色阶或 accent 文字色）
  - [ ] 辅助色不做整块容器背景（只做标签/色点/左边框）
  - [ ] Feature 暗卡内同一种辅助色（不混用蓝+橙等多色标签）
  - [ ] 同帧最多两种辅助色，且辅助色有语义用途
  - [ ] 提示/警告用纯色浅底 + 左边框（不用整块高饱和填充）
  - [ ] 视觉重音与口播重音一致，当前项高亮随口播切换
  - [ ] 每 20-35 秒有轻转折，每 60-90 秒有结构回收
  - [ ] 每个密集帧有底部结论条或可复述的收束句
  - [ ] 每个场景都有入场动画（无跳切）
  - [ ] 音频和画面严格同步
  - [ ] 颜色来自 tokens.css（无硬编码 hex/rgba）
  - [ ] 明暗节奏合理（20-35% 暗色）
  - [ ] 无 AI 味视觉特征：无紫色粉红渐变、无高饱和霓虹、无 emoji 当图标、无 3D 渲染、无夸张弹跳动画（检查 easing 函数不含 Bounce/Elastic）
  - [ ] Studio 预览无报错
- **PASS 标准**：暗色比例 20-35%；无连续同布局；所有内容 y < 930；无 AI 味特征；Studio 无报错
- **FAIL 标准**：暗色比例超出范围；连续 3 个以上场景同布局；内容超出安全区；存在 AI 味特征；Studio 报错
- 输出：PASS / FAIL + 视觉问题列表（含场景名）

**静态质检命令**：
```bash
node <remotion-factory>/scripts/lint-remotion-scenes.mjs .
```

将 `<remotion-factory>` 替换为当前 skill 安装路径。该脚本只做静态扫描，不能替代 Studio 预览和成片播放检查。

### Phase 4 渲染后 → 成品质检

**Agent 1：同步质检**
- 读取 `<project>/subtitle-timings.json` 和 `<project>/audio-segments.json`
- 检查字幕时间戳是否与音频时长匹配（每句 start/end 在对应音频帧范围内）
- 检查字幕是否有重叠（前一句 end > 后一句 start）或间隙（相邻句间隔 > 30 帧 / 1 秒）
- 字幕与音频是否对齐：字幕出现时间与口播节奏一致（误差 <= 5 帧）
- 动画切换是否在音频提到内容时发生（关键元素入场帧与口播关键词帧误差 <= 10 帧）
- **PASS 标准**：无字幕重叠；无 > 1 秒间隙；字幕-音频对齐误差 <= 5 帧；动画-口播误差 <= 10 帧
- **FAIL 标准**：存在字幕重叠；间隙 > 1 秒；对齐误差 > 5 帧；动画-口播误差 > 10 帧
- 输出：PASS / FAIL + 同步问题列表（含帧号和期望值）

**Agent 2：成品质检**
- 读取渲染输出文件大小（应 > 10MB，小于 10MB 通常意味着渲染不完整）
- 检查 FullVideo.tsx 的总帧数是否覆盖所有章节（各 Chapter 帧数之和 = FullVideo 总帧数）
- 检查 Root.tsx 中 FullVideo 的 durationInFrames 是否正确
- 检查输出视频时长是否与帧数一致（总帧数 / 30fps = 预期秒数，误差 < 1 秒）
- 完整播放无报错（无黑屏、无卡顿、无音频缺失）
- 暗色场景视觉效果正确（暗色场景背景为深色而非白色）
- 字幕不遮挡主内容（字幕 y 坐标在安全区内，不覆盖卡片/文字）
- **PASS 标准**：文件 > 10MB；帧数一致；时长匹配；播放无异常；字幕不遮挡
- **FAIL 标准**：文件 < 10MB；帧数不一致；时长误差 >= 1 秒；播放有异常；字幕遮挡内容
- 输出：PASS / FAIL + 成品问题列表（含文件大小、时长、异常描述）

### 失败处理

任一 Agent 报 FAIL 时：
1. 收集两个 Agent 的所有 FAIL 项
2. 按优先级修复（代码问题 > 结构问题 > 内容问题）
3. 修复后**重新派出两个 Agent 质检**（使用相同 prompt）
4. 循环直到两个 Agent 都 PASS

---

## 回退与修改

实际开发中常需要回头修改前面 Phase 的内容。以下是修改影响范围：

| 修改内容 | 需要同步更新 |
|---------|------------|
| script.md 文本 | 重新合成对应音频 → 重新测量帧数 → 更新 ChapterX.tsx 常量 → 更新 subtitle-timings.json |
| audio-segments.json 增删场景 | 重新合成音频 → 重新测量帧数 → 更新 ChapterX.tsx Sequence 编排 → 更新 subtitle-timings.json |
| outline.md 场景增减 | 更新 ChapterX.tsx Sequence 编排 → 更新 FullVideo.tsx |
| tokens.css 颜色 | Studio 预览检查所有场景，无需重新合成音频 |
| 单个场景组件修改 | Studio 预览确认，无需重新合成音频 |

**原则**：改了 text → 必须重新合成音频。改了结构 → 必须更新 Sequence 编排。改了样式 → 只需预览。




