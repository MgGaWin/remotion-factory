# 音频合成指南

## MiMo TTS 配置

Model: mimo-v2.5-tts
API: https://token-plan-cn.xiaomimimo.com/v1/chat/completions（POST）
认证: 请求头 api-key（非 Authorization: Bearer）
Voice: 苏打（无 style）
Format: WAV
请求间隔: 500ms

⚠️ 不要使用 hyperframes tts。hyperframes 使用 Kokoro 本地模型，与 MiMo TTS 完全不同。
本项目只走 scripts/synthesize-audio.mjs。

## 工作流位置

音频合成在 Phase 2（Remotion 开发之前）。
先合成音频 → 测量帧数 → 再开发动画。

## 流程

### 1. 准备 audio-segments.json

内容保真原则：
- text 来自 script.md，不要再次精简
- 保持原文信息密度
- 对照 article.md 检查完整性

文本清理规则：
- _ → 空格（init_chat_model → init chat model）
- - → 空格（max-retries → max retries）
- 保留中文标点

### 2. 合成

node scripts/synthesize-audio.mjs           # 合成全部
node scripts/synthesize-audio.mjs --force   # 强制重新合成

只重新合成指定文件：编辑 audio-segments.json，临时只保留需要重新生成的条目，运行后再恢复完整文件。

### 3. 测量帧数

node -e "
const fs = require('fs');
['ch1-0','ch1-1'].forEach(f => {
  const buf = fs.readFileSync('public/audio/' + f + '.wav');
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  console.log(f + ': ' + (dataSize/byteRate).toFixed(2) + 's (' + Math.ceil(dataSize/byteRate*30) + ' frames)');
});"

帧数 = 秒数 x 30，向上取整。铁律：必须从 WAV header 计算。

### 4. 嵌入 Remotion

帧数确定后，在 ChapterX.tsx 中使用：
  const SCENE0_AUDIO = 116;  // 从测量结果获取

## 重新生成音频后的操作

1. 重新测量新 WAV 文件的帧数
2. 更新 ChapterX.tsx 中的帧数常量
3. 如果动画帧号是手动指定的，需要重新听音频确认
4. Studio 预览确认同步

## 常见问题

| 问题 | 解决 |
|------|------|
| 合成超时 | 检查 MIMO_API_KEY |
| 音频空白 | 检查 text 是否为空 |
| 时长不对 | 用 WAV header 计算 |
| 渲染后没声音 | Audio 在 Sequence 内部 |
| TTS 读出符号 | text 中替换 _ 和 - |
| 被 hyperframes 干扰 | 使用 MiMo TTS |

