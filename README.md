# 准备工作

```bash
git clone https://github.com/MgGaWin/remotion-factory.git ~/.claude/skills/remotion-factory
```

或下载 ZIP 解压到 `~/.claude/skills/remotion-factory/`。

## 你需要什么

- 一篇文章 / 口播稿 / 简略提纲 / 代码项目
- Node.js 18+
- Chrome 浏览器
- MiMo TTS API key（`MIMO_API_KEY` 环境变量）

---

## 快速开始

把素材丢给 Claude，一句话即可：

> 「帮我把这篇文章做成视频。」

Skill 会自动识别内容类型，执行四阶段流水线：

```
素材 -> Phase 1: 口播稿 + 大纲 -> Phase 2: 音频合成 -> Phase 3: Remotion 开发 -> Phase 4: 渲染 MP4
```

如果你想跳过音频（纯视觉视频），在 Phase 1 Checkpoint 时说明即可。

---

## 它能做什么

- 把文章或口播稿变成 Remotion 项目（React + TypeScript）
- 帧级精确动画（`useCurrentFrame` + `interpolate`）
- 音频直接内嵌时间轴（MiMo TTS 合成）
- 一键渲染 MP4，不用录屏
- 内容保真：保留文章深度，不过度精简
- 费曼扩写：简略笔记 + 代码/文档可先生成 `feynman-notes.md` 补齐解释链
- 设计参考图：操作员可放置草图/截图，Claude 识别后参考创作
- 默认 Anthropic 暖调赤陶色设计风格（通过 `tokens.css` 自定义）

**适用内容**：B 站 / YouTube / 视频号教程、科普解释、代码项目讲解、产品演示、数据可视化视频、动态 PPT。

---

## 工作流

### Phase 1: 内容编写

1. 识别输入类型，判断处理策略
2. 产出 `script.md` + `outline.md`（科普/代码类先产出 `feynman-notes.md`）
3. 在 Checkpoint Plan 停下来确认稿子、设计风格和开发模式

详细规则见 `references/EXPLAINER-SCRIPTING.md`。

### Phase 2: 音频合成（先音频，后开发）

1. 从 `script.md` 切分 `audio-segments.json`
2. 用 MiMo TTS 合成 WAV（`node scripts/synthesize-audio.mjs`）
3. 从 WAV header 测量帧数
4. 生成 `subtitle-timings.json`

详细规则见 `references/audio.md`。

### Phase 3: Remotion 开发

1. 项目初始化 + 脚手架 + 设计系统
2. 第 1 章完整版本一次到位（强制验收）
3. 第 2-N 章按选定模式开发
4. 创建 `FullVideo.tsx` 合并全片

场景开发指南见 `references/CHAPTER-CRAFT.md`。  
创作判断见 `references/CREATIVE-GAP-PLAYBOOK.md`。  
设计系统完整文档见 `references/DESIGN-SYSTEM.md`。

### Phase 4: 渲染 MP4

渲染前必须 Studio 预览确认无报错。使用本地 Chrome 渲染：

```bash
npx remotion render src/index.ts FullVideo out/full-video.mp4 --browser-executable="chrome路径"
```

渲染必须用户确认后执行，任何阶段不得自动渲染。

---

## 内容类型判断

| 用户给的 | 处理策略 |
|---------|---------|
| 原始文章 | 直接产出 script.md + outline.md |
| 口播稿 | 落盘成 script.md，产出 outline.md |
| 简略文章 + 代码/资料库 | 启用信息/科普解释模式，先产出 feynman-notes.md |
| 学术论文/研究报告 | 忠实还原，不擅自扩展 |
| 散文/叙事 | 口语化改写，保持情感基调 |
| 啥都没有 | 反问：先给素材或大纲 |

---

## 关键原则

1. **音频先行**：先合成 TTS 确定真实帧数，再开发场景。避免「先开发后拉时间轴」的常见陷阱。
2. **内容保真**：`script.md` 是原文的口语化改写，不是精简摘要。原稿 7 个要点，口播稿里也是 7 个。
3. **帧驱动**：`useCurrentFrame()` 是唯一时间源，无随机、无异步、无 CSS transition。
4. **出现就留下**：元素动画进入后保持可见，不加退出动画。
5. **硬切场景**：场景间直接替换，无渐变过渡。
6. **呈现为上**：动画服务于内容，不是装饰。

---

## 项目结构

```
my-video/
├── article.md              # 用户原文
├── feynman-notes.md        # 费曼扩写笔记（可选）
├── script.md               # 口播稿
├── outline.md              # 开发计划
├── audio-segments.json     # 场景-音频映射
├── subtitle-timings.json   # 字幕时间戳
├── references/             # 设计参考图（可选）
├── src/
│   ├── index.ts
│   ├── Root.tsx
│   ├── Chapter1.tsx..
│   ├── FullVideo.tsx
│   ├── styles/ (tokens.css, global.css)
│   ├── components/ (Subtitle.tsx..)
│   └── scenes/ (Scene0Title.tsx..)
├── public/audio/           # WAV 文件
├── scripts/                # synthesize-audio.mjs, gen-subtitle-timings.mjs
└── out/                    # 渲染输出的 MP4
```

**两个 `references/` 目录的区分**：
- Skill 内置 `references/`：文档和 Demo（始终可用）
- 项目 `references/`：操作员放置的设计草图（按项目可选）

---

## 参考文件路由

Skill 内置以下参考文档和 Demo：

| 文件 | 何时阅读 |
|------|---------|
| `references/EXPLAINER-SCRIPTING.md` | Phase 1：信息/科普/代码项目扩写 |
| `references/audio.md` | Phase 2：音频合成 + 帧数测量 |
| `references/CHAPTER-CRAFT.md` | Phase 3：场景开发 + 动效 + 构图 |
| `references/CREATIVE-GAP-PLAYBOOK.md` | Phase 3：创作判断（帧型/重音/留存/色彩） |
| `references/STYLE-ADAPTATION.md` | 用户要求变更默认 Anthropic 风格时 |
| `references/SKETCH-SVG.md` | 需要手绘 SVG 涂鸦时 |
| `references/DESIGN-SYSTEM.md` | 设计系统完整规范（颜色/卡片/排版/节奏/布局ID） |
| `references/QUALITY-CHECKS.md` | 质检流程详细标准 |

可视化 Demo（在浏览器中打开）：
- `references/color-preview.html`：全部 token、4 种卡片、明暗主题、10 阶中性色
- `references/surface-demo.html`：三层颜色模型、标签/色点/边框正确用法
- `references/sketch-demo.html`：88 个手绘 SVG 元素 + 可复制的 AI prompt
- `references/creative-gap-playbook.html`：创作判断可视化工作区
- `references/layout-gallery.html`：完整构图示例

---

## 版本锁定

```
remotion: 4.0.301
@remotion/cli: 4.0.301
@remotion/media-utils: 4.0.301
react: ^18.3.1
typescript: ^5.6.3
```

不要随意升级。

---

## 需求

- Node.js 18+
- Chrome 浏览器（渲染用）
- MiMo TTS API key（`MIMO_API_KEY` 环境变量）
