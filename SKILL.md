---
name: remotion-factory
description: |
  把一篇文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。
  流程：原始文章 → 口播稿 + outline → 用户对齐 → Remotion 开发 → 音频嵌入 → 渲染 MP4。
  适用场景：B 站 / YouTube / 视频号教程、产品演示、数据可视化视频、动态 PPT。
  本 Skill 不绑定特定样式，设计系统由用户偏好驱动。
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

---

## 工作流总览

Phase 1: 内容编写
  1.1 识别用户输入
  1.2 一次产出 script.md + outline.md
  → Checkpoint Plan: 必须停，一次对齐 5 件事

Phase 2: Remotion 开发
  2.1 脚手架 + 设计系统
  2.2 第 1 章 = 主线程 + 完整版本（强制 anchor）
  → 硬节点: 用户验收第 1 章，不可跳过
  2.3 第 2~N 章（按选定模式）

Phase 3: 音频嵌入 + 渲染

---

## 工作目录约定

my-video/
  article.md              # 用户原文
  script.md               # 口播稿
  outline.md              # 开发计划
  audio-segments.json     # 场景 → 音频映射 + 口播文本
  src/
    index.ts              # registerRoot
    Root.tsx              # Composition 注册
    Chapter1.tsx          # 章节总控（Sequence 编排）
    styles/tokens.css     # 设计系统
    styles/global.css     # 全局样式 + 字体
    components/           # 共享组件
    scenes/               # 每个场景一个文件
  public/audio/           # wav 文件
  scripts/synthesize-audio.mjs  # MiMo TTS 合成脚本
  out/                    # 渲染输出的 MP4

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

Remotion 特有：outline 里要标注每步的音频段落映射。

---

## Checkpoint Plan

script.md + outline.md 写完后必须停下来，一次对齐 5 件事：
1. 稿子要不要改？
2. 开发计划要不要改？
3. 选哪个设计风格？
4. 素材怎么准备？
5. 开发模式选哪个？（A 逐章确认 / B 顺序开发 / C 并行开发 Agent Teams）

---

## Phase 2 — Remotion 开发

### 2.0 版本锁定（重要）

Remotion 生态版本敏感，以下组合已验证可用：
- remotion: 4.0.301
- @remotion/cli: 4.0.301
- @remotion/media-utils: 4.0.301
- react: ^18.3.1
- typescript: ^5.6.3

### 2.1 脚手架

mkdir my-video && cd my-video
mkdir -p src/{styles,components,scenes} public/audio out scripts

### 2.2 第 1 章 — 主线程 + 强制验收

核心：第 1 章 = 完整版本一次到位（节奏 + 视觉 + 音频时长对齐）。

帧数必须从实际 WAV 文件测量，不要估算！

做完第 1 章后必须停下来等用户验收。

### 2.3 第 2~N 章

三种模式：
- A) 逐章确认：每章做完验收
- B) 顺序开发：全部做完统一验收
- C) 并行开发：Agent Teams 并行（推荐最大并行度 3）

---

## Phase 3 — 音频嵌入 + 渲染

### 音频合成（MiMo TTS）

⚠️ 重要：必须使用 MiMo TTS，不要使用 hyperframes tts。
hyperframes 使用的是 Kokoro 本地模型，与 MiMo TTS 完全不同。
本项目的音频合成只走 scripts/synthesize-audio.mjs。

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

### audio-segments.json 编写规范

**内容保真原则**：
- text 字段的内容来自 script.md，不是对 script.md 的再次精简
- 保持 script.md 的信息密度：要点数量、数据、案例、技术细节都要保留
- 可以微调语气使其更适合 TTS 朗读（比如断句、停顿），但不要删减内容
- 对照 article.md 检查：如果 article 有 7 个要点，script 有 7 个，audio-segments 也应该是 7 个

**文本清理规则（TTS 友好）**：
- 将 -（连字符）替换为空格，否则 TTS 会读出来
- 将 _（下划线）替换为空格，否则 TTS 会读出来
- 代码标识符如 init_chat_model → 口播时说 "init chat model"
- 参数名如 max-retries → 口播时说 "max retries"
- 保留中文标点

示例：
  { "chapter": "ch2", "scene": "Scene2_1CodeTerminal", "audio": "ch2-1.wav",
    "text": "这里面有七个参数，我们一个一个说。model 和 model provider 是最基本的。" }

注意：deepseek-v4-pro → deepseek v4 pro，init_chat_model → init chat model

### 帧数计算（必须从 WAV 文件测量）

node -e "
const fs = require('fs');
['ch1-0','ch1-1'].forEach(f => {
  const buf = fs.readFileSync('public/audio/' + f + '.wav');
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  console.log(f + ': ' + (dataSize/byteRate).toFixed(2) + 's (' + Math.ceil(dataSize/byteRate*30) + ' frames)');
});"

铁律：帧数必须从 WAV 文件 header 计算，不要凭感觉估算。

### 渲染

npm start                    # Studio 预览
npm run build                # 渲染默认章节
npx remotion render src/index.ts Chapter2 out/ch2.mp4

---

## 动画系统

### 核心规则

1. 帧驱动：useCurrentFrame() 是唯一时间源
2. 确定性：同一帧数永远产生同一画面
3. 所有 interpolate 必须有 extrapolateLeft/Right: 'clamp'

### 动画节奏：延迟对齐 + 快速动画

动画速度保持快（~15 帧 ≈ 0.5s），只调整开始帧来对齐音频。

const FAST = 15;
const BULLET_FRAMES = [252, 375, 470]; // 音频提到要点的时刻

const bulletOp = (i) => interpolate(
  frame, [BULLET_FRAMES[i], BULLET_FRAMES[i] + FAST], [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
);

不要把动画拉慢来"对齐"音频，那样看起来会很拖沓。

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

## 设计系统

  --c-accent: #D97757
  --c-bg: #FAF9F5
  --c-surface: #FFFFFF
  --c-text: #141413
  --c-terminal-bg: #1E1E2E
  --c-terminal-text: #CDD6F4
  --font-display: 'Inter', sans-serif
  --font-sans: 'Inter', sans-serif
  --font-mono: 'JetBrains Mono', monospace

反 AI 味检查：
- 不要紫色粉红渐变
- 不要 emoji 当图标
- 不要赛博朋克暗色（终端深色除外）
- 不要 SVG 画人

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
