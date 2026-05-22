# Remotion Factory

把文章或口播稿用 Remotion 做成 MP4 视频。

## 功能

- 输入文章或口播稿 -> 输出 Remotion 项目
- 帧级动画控制（useCurrentFrame + interpolate）
- 使用 MiMo TTS（苏打音色）合成音频并嵌入时间轴
- 直接渲染 MP4，不用录屏
- 内容保真：口播文本保持原文信息密度，不会过度精简

## 使用方式

分步喂给 Claude Code：

1. 提供文章 -> 生成 script.md + outline.md
2. 对齐设计 -> 选风格、确认结构
3. 开发章节 -> Remotion 项目 + 场景 + 音频
4. 渲染 -> npx remotion render 输出 MP4

## 核心特性

- 内容保真：audio-segments.json 的文本忠实于 script.md
- TTS 友好：自动将 _ 和 - 替换为空格
- 音画同步：动画对齐音频时间戳，快速过渡（~15 帧）
- 视觉多样性：强制布局多样化
- 出现就留下：元素出现后保持可见
- 版本锁定：Remotion 4.0.301 + React 18.3 + TypeScript 5.6

## 环境要求

- Node.js 18+
- Chrome 浏览器（渲染用）
- MiMo TTS API Key（MIMO_API_KEY 环境变量）

## 文件结构

SKILL.md                    # 主技能文档
references/
  CHAPTER-CRAFT.md          # 场景开发指南 + 动画模式库
  AUDIO.md                  # 音频合成 + 帧数对齐
