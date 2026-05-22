# 音频合成指南

## MiMo TTS 配置

Model: mimo-v2.5-tts
API: https://token-plan-cn.xiaomimimo.com/v1
认证: 请求头 api-key（非 Authorization: Bearer）
Voice: 苏打（无 style）
Format: WAV
请求间隔: 500ms

⚠️ 不要使用 hyperframes tts。hyperframes 使用 Kokoro 本地模型，与 MiMo TTS 完全不同。
本项目只走 scripts/synthesize-audio.mjs。

## 流程

### 1. 准备 audio-segments.json

**内容保真原则**：
- text 来自 script.md，不要再次精简
- 保持原文信息密度：要点数量、数据、案例都要保留
- 对照 article.md 检查完整性

**文本清理规则**：
- _ → 空格（init_chat_model → init chat model）
- - → 空格（max-retries → max retries）
- 保留中文标点

### 2. 合成

node scripts/synthesize-audio.mjs           # 合成全部（跳过已存在的）
node scripts/synthesize-audio.mjs --force   # 强制重新合成全部

**只重新合成指定文件**：编辑 audio-segments.json，临时只保留需要重新生成的条目，运行后再恢复完整文件。不要用 --force 全部重新生成。

### 3. 测量时长

node -e "
const fs = require('fs');
['ch1-0','ch1-1'].forEach(f => {
  const buf = fs.readFileSync('public/audio/' + f + '.wav');
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  console.log(f + ': ' + (dataSize/byteRate).toFixed(2) + 's (' + Math.ceil(dataSize/byteRate*30) + ' frames)');
});"

### 4. 嵌入 Remotion

import { Audio, staticFile } from 'remotion';

Sequence from={0} durationInFrames={116} name="Scene 0"
  Audio src={staticFile('audio/ch1-0.wav')} volume={1}
  Scene0

## 帧数计算

帧数 = 秒数 x fps（30）
例：3.84s x 30 = 115.2 → 向上取整 = 116 帧

铁律：必须从 WAV 文件 header 计算，不要凭感觉估算。

## 重新生成音频后的操作

1. 重新测量新 WAV 文件的帧数
2. 更新 ChapterX.tsx 中的 S0_DUR、S1_DUR 等常量
3. 如果动画帧号是手动指定的（如 BULLET_FRAMES），需要重新听音频确认时间点
4. Studio 预览确认同步

## 常见问题

| 问题 | 解决 |
|------|------|
| 合成超时 | 检查 MIMO_API_KEY 是否有效 |
| 音频空白 | 检查 text 是否为空 |
| 时长不对 | 用 WAV header 计算 |
| 渲染后没声音 | 确认 Audio 在 Sequence 内部 |
| TTS 读出符号 | text 中把 _ 和 - 替换为空格 |
| 被 hyperframes 干扰 | 明确告诉 Claude 使用 MiMo TTS |
