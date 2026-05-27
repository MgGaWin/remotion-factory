# Remotion Factory

把文章或口播稿用 Remotion 做成 MP4 视频。

## 安装

```bash
# 克隆到 Claude Code 技能目录
git clone https://github.com/MgGaWin/remotion-factory.git ~/.claude/skills/remotion-factory
```

或下载 [ZIP 压缩包](https://github.com/MgGaWin/remotion-factory/archive/refs/heads/main.zip)，解压到 `~/.claude/skills/remotion-factory/`。

## 功能

- 输入文章或口播稿 -> 输出 Remotion 项目
- 帧级动画控制（useCurrentFrame + interpolate）
- 使用 MiMo TTS（苏打音色）合成音频并嵌入时间轴
- 直接渲染 MP4，不用录屏
- 内容保真：口播文本保持原文信息密度
- 参考图支持：操作员可放草图，Claude 识别后参考创作

## 工作流（音频先行）

1. 提供文章 -> 生成 script.md + outline.md
2. 对齐设计 -> 选风格、确认结构
3. **先合成音频** -> 确定每个场景的真实时长
4. 开发章节 -> 基于真实帧数开发动画
5. 渲染 MP4 -> 全部确认后才渲染

## 核心特性

- 音频先行：先合成音频再开发，避免帧号错位
- 内容保真：audio-segments.json 忠实于 script.md
- TTS 友好：自动将 _ 和 - 替换为空格
- 默认风格：Anthropic 暖调赤陶色（可通过 tokens.css 自定义）
- 风格迁移：通过 STYLE-ADAPTATION.md 在不破坏工作流的前提下替换视觉气质
- **配色体系**：辅助色三层模型（图形层/标签层/容器层）+ tint 提示容器
- 视觉多样性：强制布局多样化
- 创作判断层：帧型选择、视觉重音、观众留存、色彩用量、好坏对比审稿
- 出现就留下：元素出现后保持可见
- 参考图：references/ 目录放草图/截图
- Agent Teams 质检：每个阶段后双 Agent 独立质检
- 静态场景 lint：检查小字号、缺少 clamp、硬编码颜色、越界、随机数等常见硬伤
- 渲染保护：章节 + 音频全部就绪且确认后才可渲染
- 版本锁定：Remotion 4.0.301 + React 18.3 + TypeScript 5.6

## 设计体系要点

- **四种卡片形态**：标准卡（边框）、Oat 卡（暖填充）、Feature 暗卡（近黑底）、终端卡（代码）
- **节奏驱动主题**：暗色场景按固定间隔插入，不是内容驱动
- **辅助色三层模型**：图形层放开用、标签层克制用、容器背景禁止用
- **提示容器**：纯色浅底 + 左边框（`#EBF2F8` 蓝 / `#ECF0E6` 绿 / `#FAEDE6` 橙）
- **10 档中性色阶**：Anthropic Ink → Slate → Cloud → Oat → Ivory

## 环境要求

- Node.js 18+
- Chrome 浏览器（渲染用）
- MiMo TTS API Key（MIMO_API_KEY 环境变量）

## 文件结构

```
remotion-factory/                   # 技能目录（~/.claude/skills/）
├── SKILL.md                        # 主文件
├── manifest.json                   # 技能元数据
├── scripts/
│   └── lint-remotion-scenes.mjs     # Remotion 场景静态质检脚本
└── references/                     # 技能内置文档（随技能分发）
    ├── CHAPTER-CRAFT.md            # 场景开发指南 + 动画模式库
    ├── CREATIVE-GAP-PLAYBOOK.md    # 创作判断指南（帧型/重音/留存/色彩/好坏对比）
    ├── STYLE-ADAPTATION.md         # 风格迁移与 token 映射指南
    ├── audio.md                    # 音频合成 + 帧对齐
    ├── SKETCH-SVG.md               # 手绘涂鸦 SVG 指南
    ├── sketch-demo.html            # 涂鸦交互式演示（88 个动画元素）
    ├── color-preview.html          # 配色全景预览（全部 token 可视化）
    ├── surface-demo.html           # 辅助色应用体系演示（三层模型）
    └── creative-gap-playbook.html  # 创作缺口补全可视化参考

my-video/                           # 用户项目目录（独立于技能）
├── article.md                      # 用户原文
├── script.md                       # 口播稿
├── references/                     # 用户的设计参考图（可选）
│   └── sketch-01.png               # 操作员放的草图/截图
└── src/                            # Remotion 源码
```

**注意**：两层 `references/` 用途不同：
- **技能的 `references/`** = 内置文档和演示（始终可用）
- **项目的 `references/`** = 操作员提供的设计参考图（按项目，可选）

## 参考 HTML 文件

浏览器直接打开，预览设计系统：

| 文件 | 内容 |
|------|------|
| `color-preview.html` | 全部 token、四种卡片、亮暗主题、10 档色阶 |
| `surface-demo.html` | 辅助色三层模型、正确做法、tint 提示容器 |
| `sketch-demo.html` | 88 个涂鸦元素 + AI 提示词一键复制 |
| `creative-gap-playbook.html` | 帧型选择、重音、留存、色彩、好坏对比的可视化工作台 |
