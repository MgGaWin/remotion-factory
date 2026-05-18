# 音频合成指南

## MiMo TTS 配置

```
API: https://token-plan-cn.xiaomimimo.com/v1
Voice: 苏打（无 style）
Format: WAV
```

## 流程

### 1. 准备 audio-segments.json

```json
[
  { "id": "ch1-0", "text": "整个过程分为四个阶段。", "audio": "ch1-0.wav" },
  { "id": "ch1-1", "text": "你按下回车之后...", "audio": "ch1-1.wav" }
]
```

### 2. 合成

```bash
node scripts/synthesize-audio.mjs
```

### 3. 测量时长

```bash
node -e "
const fs = require('fs');
['ch1-0','ch1-1','ch1-2','ch1-3'].forEach(f => {
  const buf = fs.readFileSync('public/audio/' + f + '.wav');
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  const duration = dataSize / byteRate;
  console.log(f + ': ' + duration.toFixed(2) + 's (' + Math.ceil(duration * 30) + ' frames @30fps)');
});
"
```

### 4. 嵌入 Remotion

```tsx
import { Audio, staticFile } from 'remotion';

<Sequence from={0} durationInFrames={116} name="Scene 0">
  <Audio src={staticFile('audio/ch1-0.wav')} />
  <Scene0 />
</Sequence>
```

## 帧数计算

```
帧数 = 秒数 × fps（30）
例：3.84s × 30 = 115.2 → 向上取整 = 116 帧
```

## 时间轴编排

```
Scene 0: from=0,            duration=ch1-0帧数
Scene 1: from=ch1-0帧数,    duration=ch1-1帧数
Scene 2: from=S1_START+ch1-1帧数, duration=ch1-2帧数
Total = 所有音频帧数之和
```

## 常见问题

| 问题 | 解决 |
|------|------|
| 合成超时 | 检查 MIMO_API_KEY 是否有效 |
| 音频空白 | 检查 text 是否为空 |
| 时长不对 | 用 WAV header 计算，不要猜 |
| 渲染后没声音 | 确认 `<Audio>` 在 `<Sequence>` 内部 |
