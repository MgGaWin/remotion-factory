# Remotion Factory

把文章或口播稿用 [Remotion](https://remotion.dev) 做成 MP4 视频。

## 功能

- 输入文章或口播稿 → 输出 Remotion 项目
- 帧级动画控制（`useCurrentFrame` + `interpolate`）
- 音频直接嵌入时间轴
- 直接渲染 MP4，不用录屏

## 使用方式

分步喂给 Claude Code（或兼容的 AI 编程助手）：

1. **提供文章** → 生成 `script.md` + `outline.md`
2. **对齐设计** → 选风格、确认结构
3. **开发章节** → Remotion 项目 + 场景 + 音频
4. **渲染** → `npx remotion render` 输出 MP4

## 环境要求

- Node.js 18+
- Chrome 浏览器（渲染用）
- 可选：TTS API（语音合成）

## 文件结构

```
SKILL.md                    # 主技能文档
references/
  CHAPTER-CRAFT.md          # 场景开发指南 + 动画模式库
  AUDIO.md                  # 音频合成 + 帧数对齐
```
