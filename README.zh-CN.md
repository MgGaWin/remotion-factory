# Remotion Factory

把文章或口播稿用 Remotion 做成 MP4 视频。

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
- 视觉多样性：强制布局多样化
- 出现就留下：元素出现后保持可见
- 参考图：references/ 目录放草图/截图
- Agent Teams 质检：每个阶段后双 Agent 独立质检
- 渲染保护：章节 + 音频全部就绪且确认后才可渲染
- 版本锁定：Remotion 4.0.301 + React 18.3 + TypeScript 5.6

## 环境要求

- Node.js 18+
- Chrome 浏览器（渲染用）
- MiMo TTS API Key（MIMO_API_KEY 环境变量）
