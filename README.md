<div align="center">

# 🎥 Remotion Factory

**将文章、脚本或代码项目转化为 MP4 视频 · Claude Code 技能**

[![Version](https://img.shields.io/github/v/release/MgGaWin/remotion-factory?style=flat-square&label=Version&color=blue)](https://github.com/MgGaWin/remotion-factory/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-0078d4?style=flat-square&logo=visualstudiocode)]()
[![License](https://img.shields.io/github/license/MgGaWin/remotion-factory?style=flat-square&color=green)](LICENSE)
[![Stars](https://img.shields.io/github/stars/MgGaWin/remotion-factory?style=flat-square&color=yellow)]()

---

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [工作流程](#-工作流程) · [设计系统](#-设计系统) · [文件结构](#-文件结构) · [更新日志](#-更新日志) · [许可证](#-许可证)

</div>

## ✨ 功能特性

| 功能 | 说明 |
|:---|:---|
| 📝 **文章转视频** | 文章/脚本/代码项目 → Remotion 项目（React + TypeScript） |
| 🎯 **帧精确动画** | `useCurrentFrame` + `interpolate` 实现像素级精确控制 |
| 🔊 **音频嵌入** | MiMo TTS 合成，自动回退到 Edge TTS |
| 📺 **字幕叠加** | 帧精确时间轴的字幕系统，音频和字幕默认开启 |
| 🎬 **一键渲染** | 一条命令渲染 MP4，无需录屏 |
| 📖 **费曼展开** | 简要笔记 + 代码/文档 → `feynman-notes.md` → 精炼口播稿 |
| 🎨 **默认设计** | Anthropic "Intellectual Warmth" 设计系统（可自定义 `tokens.css`） |
| 🖼️ **设计参考图** | 放入草图，Claude 自动识别并参考 |
| 🔄 **TTS 回退** | MiMo TTS 不可用时自动降级到 Edge TTS |

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/MgGaWin/remotion-factory.git ~/.claude/skills/remotion-factory
```

或下载 [ZIP](https://github.com/MgGaWin/remotion-factory/archive/refs/heads/main.zip) 解压到 `~/.claude/skills/remotion-factory/`。

### 环境要求

- Node.js 18+
- Chrome 浏览器（渲染用）
- MiMo TTS API Key（`MIMO_API_KEY` 环境变量）

### 基本使用

向 Claude 提供素材，一句话即可：

> "把这篇文章做成视频。"

技能自动检测内容类型，运行 4 阶段流水线：

```
素材 → 阶段1: 口播稿+大纲 → 阶段2: 语音合成 → 阶段3: Remotion开发 → 阶段4: 渲染MP4
```

## 🔄 工作流程

1. **提供素材** → 生成 `script.md` + `outline.md`
2. **对齐设计** → 选择风格，确认结构
3. **先合成语音** → 确定每场景真实时长
4. **开发章节** → 基于真实帧数构建动画
5. **渲染 MP4** → 所有确认后才渲染

## 🎨 设计系统

- **四种卡片类型**：Standard（边框）、Oat（暖色填充）、Feature（深色）、Terminal（代码）
- **节奏驱动主题**：按频率插入暗色场景，非内容类型决定
- **三层色彩模型**：图形层（自由）、标签层（克制）、容器层（禁用）
- **10 级中性色阶**：Anthropic Ink → Slate → Cloud → Oat → Ivory

## 📁 文件结构

```
remotion-factory/
├── SKILL.md                        # 主工作流路由（~470行）
├── manifest.json                   # 技能元数据
├── scripts/
│   ├── lint-remotion-scenes.mjs    # 静态质量检查
│   ├── synthesize-audio.mjs        # MiMo TTS 合成
│   └── gen-subtitle-timings.mjs    # 字幕时间轴生成
└── references/
    ├── DESIGN-SYSTEM.md            # 完整设计系统
    ├── QUALITY-CHECKS.md           # 质量检查标准
    ├── CHAPTER-CRAFT.md            # 场景开发指南
    ├── EXPLAINER-SCRIPTING.md      # 费曼展开指南
    └── *.html                      # 视觉演示（浏览器打开）
```

## 📋 更新日志

### v3.0.0
- 架构重构：SKILL.md 精简至 ~470 行，设计系统和 QA 提取到专用文档
- 新增 synthesize-audio.mjs 和 gen-subtitle-timings.mjs 脚本
- TTS 回退策略
- 音频/字幕默认开启

### v2.0.0
- 全面重做：TTS 文本清洗、Chrome 本地优先、QA 流水线、明暗节奏

### v1.14.0
- 解释模式：费曼展开、代码项目转口播稿

### v1.13.0
- Agent Teams：每个检查点双代理并行 QA

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！**

</div>
