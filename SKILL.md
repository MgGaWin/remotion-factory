---

name: remotion-factory
version: 3.0.0
description: |
  把文章、口播稿、简略提纲、信息科普内容或代码项目，用 Remotion 做成可直接渲染 MP4 的视频。
  流程：原始材料 -> 费曼扩写/口播稿 -> 音频合成 -> Remotion 开发 -> 渲染 MP4。
  适用场景：B 站 / YouTube / 视频号教程、科普解释、代码项目讲解、产品演示、数据可视化视频、动态 PPT。
  默认设计风格：Anthropic 暖调赤陶色人文极简。用户可自定义。

---

# Remotion Video Presentation

把文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。

## 快速开始

把素材丢过来，一句话即可：

> 「帮我把这篇文章做成视频。」

Skill 自动执行四阶段流水线：**内容编写 -> 音频合成 -> Remotion 开发 -> 渲染 MP4**。

最简路径：丢文章 -> 确认稿子和风格 -> 等音频合成完成 -> 确认第 1 章效果 -> 全部完成渲染。

如果想跳过音频（纯视觉视频），在 Phase 1 Checkpoint 说「不加配音」即可。

---

## 版本记录

- 3.0.0: 架构重组 -- SKILL.md 瘦身至 ~470 行，设计系统和质检规范独立为 DESIGN-SYSTEM.md / QUALITY-CHECKS.md；补齐 synthesize-audio.mjs 和 gen-subtitle-timings.mjs 脚本；新增快速开始章节；默认开启配音和字幕
- 2.0.0: 全面整改 -- TTS 文本清理规则完善、Chrome 渲染指引明确、质检流程强化、明暗节奏用户可选、导演审美系统
- 1.14.0: 信息/科普解释模式 -- 费曼扩写、简略文章+代码项目转口播稿
- 1.13.0: Agent Teams 自动质检 -- 每 Phase 双 Agent 并行质检、PASS/FAIL 闸门
- 1.12.0: 工程化补强 -- lint 脚本、风格迁移指南
- 1.11.0: 创作判断层 -- 帧型选择、视觉重音、观众留存、色彩用量

---

## 适用场景

- 「我有口播稿 / 一篇文章，帮我做成视频」
- 想做「动态 PPT」但要直接出 MP4
- 16:9 横屏视频，大字、留白、每屏有动效
- 教学 / 产品演示 / keynote 电影感
- B 站 / YouTube / 抖音视频内容

**核心特性**：直接输出 MP4（不用录屏）、帧级精确动画控制、音频内嵌时间轴、支持设计参考图、默认 Anthropic 暖调赤陶色设计。

---

## 参考文件路由

开发不同阶段应查阅对应参考文档：

| 阶段 | 参考文档 | 用途 |
|------|---------|------|
| Phase 1 | `references/EXPLAINER-SCRIPTING.md` | 信息/科普/代码项目的内容扩写策略 |
| Phase 2 | `references/audio.md` | 音频合成、帧数测量、字幕时间戳 |
| Phase 3 | `references/CHAPTER-CRAFT.md` | 场景开发流程、动画模式、构图规则 |
| Phase 3 | `references/CREATIVE-GAP-PLAYBOOK.md` | 创作判断：帧型选择、视觉重音、留存节拍、色彩用量 |
| Phase 3 | `references/DESIGN-SYSTEM.md` | 完整设计系统：颜色 Token、卡片形态、排版、明暗节奏、布局 ID |
| 风格迁移 | `references/STYLE-ADAPTATION.md` | 更换默认 Anthropic 暖调风格时的迁移指南 |
| 手绘 SVG | `references/SKETCH-SVG.md` | Anthropic 风格手绘涂鸦 SVG 制作 |
| 全流程 | `references/QUALITY-CHECKS.md` | 各 Phase 双 Agent 质检详细标准 |

可视化 Demo（在浏览器打开）：`color-preview.html`, `surface-demo.html`, `sketch-demo.html`, `creative-gap-playbook.html`, `layout-gallery.html`。

---

## 工作流总览

```
Phase 1   内容编写
   1.1  识别用户输入
   1.2  内容类型判断
   1.3  产出 script.md + outline.md
   v
[Checkpoint Plan]      双 Agent 质检（内容+结构），PASS 后继续
   v
Phase 2   音频合成（先音频，后开发）
   2.1  生成 audio-segments.json
   2.2  合成音频（MiMo TTS）+ 错误处理
   2.3  测量帧数 -> 确定每个场景时长
   2.4  生成 subtitle-timings.json
   v
[Checkpoint Audio]     双 Agent 质检（音频+帧数），PASS 后继续
   v
Phase 3   Remotion 开发
   3.1  项目初始化 + 脚手架 + 设计系统
   3.2  第 1 章 = 完整版本一次到位（强制验收）
        v
        [硬节点] 用户验收第 1 章 -- 不可跳过
        v
   3.3  第 2~N 章（按选定模式）
   3.4  创建 FullVideo.tsx（全片合并）
   v
[Checkpoint Render]    双 Agent 质检（代码+视觉），PASS 后继续
   v
Phase 4   渲染 MP4 + 故障排查
   v
[Checkpoint Final]     双 Agent 质检（同步+成品），PASS 后交付
```

**核心规则**：每个 Phase 完成后必须质检。这不是建议，是硬性前置条件。根据 references/QUALITY-CHECKS.md 中的清单，并行派出两个独立 Agent 执行检查，全部 PASS 才能进入下一 Phase。任一 FAIL 则修复后重新质检（修复 -> 重新派 Agent -> 循环直到双 PASS）。非 Claude Code 环境下使用降级自检路径。

---

## 项目结构

```
my-video/
├── article.md              # 用户原文
├── feynman-notes.md        # 费曼扩写笔记（信息/科普模式推荐）
├── script.md               # 口播稿
├── outline.md              # 开发计划 + 卡片形态标注 + 场景规划
├── audio-segments.json     # 场景 -> 音频映射 + 口播文本
├── subtitle-timings.json   # 字幕时间戳
├── references/             # 设计参考图（可选，png/jpg/webp/gif）
├── src/
│   ├── index.ts            # registerRoot
│   ├── Root.tsx             # Composition 注册 (FPS=30, 1920x1080)
│   ├── Chapter1.tsx         # 章节总控（Sequence 编排）
│   ├── FullVideo.tsx        # 全片合并
│   ├── styles/
│   │   ├── tokens.css       # 设计系统（所有颜色/字体/卡片变量）
│   │   └── global.css       # 全局样式 + 字体导入（含 CJK 字体）
│   ├── components/          # 共享组件（Subtitle.tsx..）
│   └── scenes/              # 每个场景一个文件
├── public/
│   └── audio/               # WAV 文件
├── scripts/
│   ├── synthesize-audio.mjs # MiMo TTS 合成脚本
│   └── gen-subtitle-timings.mjs # 字幕时间戳生成
└── out/                     # 渲染输出的 MP4
```

**两个 `references/` 目录**：Skill 内置的 `references/` 是文档和 Demo（始终可用）；项目下的 `references/` 是操作员放置的设计草图（按项目可选）。

---

## Phase 1: 内容编写

### 1.1 识别用户输入

| 用户给的 | 该做的 |
|---------|--------|
| 原始文章 | 一次产出 script.md + outline.md |
| 口播稿 | 落盘为 script.md，产出 outline.md |
| 简略文章 + 代码项目/资料库 | 启用信息/科普解释模式，先产出 feynman-notes.md |
| 学术论文 | 忠实还原，不扩展 |
| 散文/叙事 | 口语化，保持情感基调 |
| 啥都没有 | 反问：先给素材 |

**边界条件**：超短内容（<500 字）建议补充素材；超长内容（>5000 字）建议分集；多篇文章问用户合并还是分多期。

### 1.2 内容类型判断

读完用户输入后，按以下顺序判断类型：

1. 学术论文/研究报告？-> 忠实类，保留所有论点和数据
2. 个人经历/散文故事？-> 抒情类，口语化但保留情感基调
3. 商业/产品介绍？-> 先问用户：精炼卖点 / 深度对比 / 讲故事
4. 故事/案例叙事？-> 叙事类，保持叙事节奏
5. 代码/技术文档/API？
   - 有操作步骤 -> 教程类（费曼扩写）
   - 有原理解释 -> 代码项目讲解（费曼扩写）
6. 数据/报告/统计 -> 数据解读
7. 观点/分析/评论 -> 理清逻辑链
8. 以上都不是 -> 信息类/科普类（费曼扩写，核心策略）

详细规则见 `references/EXPLAINER-SCRIPTING.md`。

### 1.3 产出物

**feynman-notes.md**（信息/科普模式）：目标观众、核心问题、结束收益；每个概念的大白话解释 / 新人类比（须满足类比构造三标准） / 为什么需要 / 证据来源（按内容类型分类标注） / 常见误解 / 边界条件 / 解释层级(L1/L2/L3) / Payoff 句。如需代码项目，记录关键代码路径。

**script.md**：B 站 / YouTube 风格口播稿，口语化、有节奏感。

**内容保真原则**：script.md 是对 article.md 的口语化改写，不是精简摘要。保留核心论点和数据，原文 7 个要点 script 里也是 7 个。禁止模糊写法如「等等」、「诸如此类」、「就不展开了」、「大家可以自行了解」。

**outline.md**：章节切分 / 每章 scene 数 / 估时 / 每步屏幕内容 / 每张卡片的形态标注（标准卡1 / Oat卡2 / Feature暗卡3 / 终端卡4）。信息/科普模式还需标注解释单元 / 观众问题 / 证据来源 / Payoff 句。不要写具体动画类型和 CSS 实现。

如果 `references/` 目录下有设计参考图，识别图片内容并在 outline 中注明。

---

## Checkpoint Plan

script.md + outline.md 写完后必须停下来，确认以下 6 件事：

1. 稿子要不要改？
2. 开发计划要不要改？
3. 设计风格确认（默认 Anthropic 暖调赤陶，还是自定义？）
4. 素材准备（参考图是否已放入 references/）
5. 开发模式：A) 逐章确认 B) 顺序开发 C) 并行开发（Agent Teams，最大并行度 3）
6. 章节标题偏好：带章节标题 / 不带 / 由 AI 决定

确认后自动派出双 Agent 质检。质检标准见 `references/QUALITY-CHECKS.md`。

---

## Phase 2: 音频合成（先音频，后开发）

> **核心原则：先合成音频，确定每个场景的真实时长，再开发动画。**

### 2.1 生成 audio-segments.json

从 script.md 提取口播文本，按场景切分。text 字段来自 script.md，不要再次精简。

**audio-segments.json 格式**：
```json
[
  {
    "chapter": "ch1",
    "scene": "Scene0Title",
    "audio": "ch1-0.wav",
    "text": "Hello，大家好，今天我们聊聊..."
  }
]
```

**文本清理规则（TTS 友好）**：下划线 `_` -> 空格；连字符 `-` -> 空格；删除 Markdown 标记（`**`, `#`, 反引号, 链接 URL, 图片行, 引用符）；删除编程符号（`{}`, `[]`, `()`, `|`, `~`, `^`）；保留中文标点和英文 `.`, `!`, `?`。

### 2.2 合成音频

使用 MiMo TTS（不要用 hyperframes tts）：

**API 配置**：
- Model: `mimo-v2.5-tts`
- API: `https://token-plan-cn.xiaomimimo.com/v1/chat/completions`
- 认证: 请求头 `api-key`
- Voice: 苏打
- Format: WAV

**易错点**：assistant 消息的 content 必须和 user 消息一致（不能留空），否则输出极短或无声；voice 和 response_format 在请求体顶层，不嵌套在 audio 对象里。

运行合成：
```bash
node scripts/synthesize-audio.mjs           # 合成全部（跳过已存在）
node scripts/synthesize-audio.mjs --force   # 强制重新合成
node scripts/synthesize-audio.mjs --only=ch1-0.wav  # 只合成单个
```

脚本内置自动重试机制（最多 3 次，指数退避：500ms -> 1000ms -> 2000ms）。

**错误处理**：401/403 -> 检查 api-key；429 -> 增大请求间隔到 1000ms；网络超时 -> 检查网络或使用代理；单个片段质量差 -> 只重新生成该文件。

详细规则见 `references/audio.md`。

### 2.3 测量帧数

从 WAV header 计算真实帧数：

```bash
node -e "
const fs = require('fs');
const segs = JSON.parse(fs.readFileSync('audio-segments.json', 'utf8'));
const seen = new Set();
segs.forEach(s => {
  if (seen.has(s.audio)) return;
  seen.add(s.audio);
  const p = 'public/audio/' + s.audio;
  if (!fs.existsSync(p)) { console.log(s.audio + ': MISSING'); return; }
  const buf = fs.readFileSync(p);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  const secs = dataSize / byteRate;
  const frames = Math.ceil(secs * 30);
  console.log(s.audio + ': ' + secs.toFixed(2) + 's (' + frames + ' frames)');
});
"
```

**铁律**：帧数 = 秒数 x 30，向上取整。必须从 WAV header 读取，不能估算。测量与已声明常量误差超过 2 帧必须重新测量。

### 2.4 生成字幕时间戳

```bash
node scripts/gen-subtitle-timings.mjs
```

句子拆分规则：只按句末标点（。！？）断句；超过 50 字才按 ；： 再拆；相邻短句（<12 字）自动合并；禁止按逗号拆分。时间戳按字符比例分配，长句多分短句少分。

---

## Checkpoint Audio

音频合成完成后停下来确认：

- 每个音频都能正常播放？
- TTS 有没有读出符号？如果有，修改 text 重新生成
- 语速/语气合适？不合适的单独重新生成（不要 `--force` 全部）
- 帧数已写入 ChapterX.tsx？

确认后自动派出双 Agent 质检。详见 `references/QUALITY-CHECKS.md`。

---

## Phase 3: Remotion 开发

### 3.1 项目初始化 + 脚手架 + 设计系统

```bash
npm init -y
npm install remotion@4.0.301 @remotion/cli@4.0.301 @remotion/media-utils@4.0.301 react@^18.3.1 typescript@^5.6.3
```

**版本锁定**（不要随意升级）：remotion 4.0.301, react ^18.3.1, typescript ^5.6.3。

脚手架：
```bash
mkdir src/styles src/components src/scenes public/audio out scripts references
```

**必须创建**：
- `src/index.ts`：`registerRoot(Root)`
- `src/Root.tsx`：注册所有 Composition（FPS=30, 1920x1080）
- `src/styles/tokens.css`：设计系统（默认 Anthropic 暖调赤陶，见 `references/DESIGN-SYSTEM.md`）
- `src/styles/global.css`：全局样式 + 字体（含 CJK 字体 `Noto Sans SC`）

### 3.2 第 1 章 -- 主线程 + 强制验收

第 1 章 = 完整版本一次到位。帧数从 Phase 2 确定，直接使用。

**Chapter1.tsx 模板**：
```tsx
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';

const SCENE0_AUDIO = 116;  // 从 Phase 2 测量获取
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
    {/* ... */}
  </AbsoluteFill>
);
```

做完第 1 章后必须停止，等用户验收。验收清单：音画同步、卡片形态按 outline 标注实现、明暗节奏 20-35%、字体 >= 24px、Studio 预览无报错。用户回复「继续」后才进入后续章节。

### 3.3 第 2-N 章

三种模式：A) 逐章确认（推荐）B) 顺序开发 C) 并行开发（Agent Teams，最大并行度 3）。

场景开发指南见 `references/CHAPTER-CRAFT.md`，创作判断见 `references/CREATIVE-GAP-PLAYBOOK.md`。

### 3.4 创建 FullVideo.tsx

```tsx
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Chapter1, TOTAL_FRAMES as CH1 } from './Chapter1';
import { Chapter2, TOTAL_FRAMES as CH2 } from './Chapter2';

export const FullVideo: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={CH1} name="Chapter 1"><Chapter1 /></Sequence>
    <Sequence from={CH1} durationInFrames={CH2} name="Chapter 2"><Chapter2 /></Sequence>
  </AbsoluteFill>
);
```

Root.tsx 已注册 FullVideo Composition（总帧数 = 所有章节帧数之和）。

---

## Checkpoint Render

所有章节开发完成 + 音频就绪后，渲染前必须确认：

- 所有章节开发完成？
- 所有音频文件就绪？
- Studio 预览确认无问题？
- 帧数与音频时长匹配？
- 配音选择（默认 MiMo TTS 苏打音色 / 不加配音）？
- 字幕选择（默认硬字幕 / 不加字幕）？
- 渲染范围（仅章节 / 仅全片 / 两者都渲染）？

**默认值**：用户未明确说明时，使用 MiMo TTS 配音 + 硬字幕 + 渲染完整视频。用户说了「不加配音」「不加字幕」则跳过对应部分。

确认后自动派出双 Agent 质检。详见 `references/QUALITY-CHECKS.md`。

**渲染 MP4 必须在章节 + 音频全部就绪且用户确认后才能执行。任何阶段不得自动渲染。**

---

## Phase 4: 渲染 MP4

### 渲染命令

国内网络需要指定本地 Chrome（不推荐自动下载，网络可能不通）：

```bash
# Windows
npx remotion render src/index.ts FullVideo out/full-video.mp4 --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
# 备选：Microsoft Edge
# --browser-executable="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
```

### 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Chrome 路径错误 | 路径不匹配 | 检查路径或用 Edge |
| 内存不足 | 长视频占用大量内存 | 分段渲染各章节再用 FFmpeg 合并 |
| TypeScript 编译失败 | 组件有语法错误 | Studio 预览定位错误 |
| 音频文件缺失 | public/audio/ 不全 | 检查 audio-segments.json 与实际文件 |
| 组件运行时异常 | interpolate 越界 | Studio 逐场景预览 |

渲染前务必先在 Remotion Studio 中预览确认无报错。

---

## 设计系统速览

默认 Anthropic "Intellectual Warmth" -- 学术报刊感 + 人文主义关怀 + 克制的知识分子风。

**核心 Token**：底色 `#FAF9F5` 羊皮纸白，文字 `#141413` 深油墨黑，品牌色 `#D97757` 暖调赤陶。亮暗双主题，暗色底 `#191917`。

**四种卡片**：标准卡（`#FAF9F5` + 0.5px 边框）、Oat 暖填充卡（`#E3DACC` 无边框）、Feature 暗卡（`#141413` 核心结论）、终端卡（`#1E1E2E` 代码展示）。

**明暗节奏**：场景 0 必须暗色（开场重音），每 3-4 亮色 -> 1 暗色。暗色占比 20-35%。

**布局 ID 系统**：简洁帧 S1-S4 + 密集帧 D1-D6 + 全屏组件 CC/TS。连续场景不重复同一布局。

**反面清单**：禁止紫粉渐变、霓虹、emoji 当图标、3D 渲染、弹跳动画、辅助色做容器背景、字号 < 24px、硬编码颜色。

完整规范见 `references/DESIGN-SYSTEM.md`。

---

## 质检速览

全流程四个 Checkpoint，每个 Checkpoint 自动并行派出两个独立 Agent 质检。

| Checkpoint | Agent 1 | Agent 2 |
|-----------|---------|---------|
| Plan | 内容覆盖、自然度、无模糊写法 | 场景数、帧型比例、暗色比例、布局多样性 |
| Audio | 文本一致性、TTS 友好、WAV 完整性 | WAV 帧数与代码常量匹配 |
| Render | 代码规范（lint/颜色/字号/确定性） | 视觉效果（明暗/重音/字幕安全/无 AI 味） |
| Final | 字幕与音频同步 | 成品完整性（文件大小/时长/播放） |

任一 FAIL 修复后重新质检。全部 PASS 才进入下一 Phase。

完整标准见 `references/QUALITY-CHECKS.md`。

---

## 回退与修改

| 修改内容 | 需要同步更新 |
|---------|------------|
| script.md 文本 | 重新合成音频 -> 重新测量帧数 -> 更新 ChapterX.tsx -> 更新 subtitle-timings.json |
| audio-segments.json 增删 | 重新合成 -> 重新测量 -> 更新 Sequence 编排 -> 更新 subtitle-timings.json |
| outline.md 场景增减 | 更新 Sequence 编排 -> 更新 FullVideo.tsx |
| tokens.css 颜色 | Studio 预览检查，无需重新合成音频 |
| 单个场景组件修改 | Studio 预览确认，无需重新合成音频 |

**原则**：改了 text -> 必须重新合成音频。改了结构 -> 更新 Sequence 编排。改了样式 -> 只需预览。
