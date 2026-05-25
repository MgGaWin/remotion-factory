# 音频合成指南

## MiMo TTS 配置

| 项 | 值 |
|---|---|
| Model | `mimo-v2.5-tts` |
| API | `https://token-plan-cn.xiaomimimo.com/v1/chat/completions`（POST） |
| 认证 | 请求头 `api-key`（**非** `Authorization: Bearer`） |
| Voice | 苏打（无 style） |
| Format | WAV |
| 请求间隔 | 500ms |

> ⚠️ **不要使用 hyperframes tts。** hyperframes 使用 Kokoro 本地模型，与 MiMo TTS 完全不同。本项目只走 `scripts/synthesize-audio.mjs`。

---

## 工作流位置

音频合成在 **Phase 2**（Remotion 开发之前）。

```
先合成音频 → 测量帧数 → 确认无误 → 再开发动画
```

帧数是动画时长的唯一真相来源，不可先开发再补音频。

---

## 流程

### 1. 准备 audio-segments.json

**内容保真原则**：
- `text` 来自 `script.md`，不要再次精简
- 保持原文信息密度
- 对照 `article.md` 检查完整性

**文本清理规则（TTS 友好）**：
- `_` → 空格（`init_chat_model` → `init chat model`）
- `-` → 空格（`max-retries` → `max retries`）
- 保留中文标点

---

### 2. 合成音频

```bash
node scripts/synthesize-audio.mjs           # 合成全部（跳过已存在）
node scripts/synthesize-audio.mjs --force   # 强制重新合成全部
```

> ⚠️ **禁止随意使用 `--force`。**
> `--force` 会重新合成所有片段，耗时长、消耗 API 额度，且会覆盖已确认 OK 的音频。
> **只在以下情况使用**：初次合成失败、或需要整体重录。
>
> **只重新合成指定文件**（正确做法）：
> 1. 临时编辑 `audio-segments.json`，只保留需要重新生成的条目
> 2. 运行 `node scripts/synthesize-audio.mjs --force`
> 3. 恢复完整的 `audio-segments.json`

---

### 3. 测量帧数

合成完成后，必须从 WAV header 计算每个文件的真实帧数。

**铁律：帧数 = 秒数 × 30，向上取整。必须从 WAV header 读取，不能估算。**

**通用测量脚本**（自动读取 audio-segments.json，无需手动枚举文件名）：

```bash
node -e "
const fs = require('fs');
const segs = JSON.parse(fs.readFileSync('audio-segments.json', 'utf8'));
const seen = new Set();
segs.forEach(s => {
  if (seen.has(s.audio)) return;
  seen.add(s.audio);
  const p = 'public/audio/' + s.audio;
  if (!fs.existsSync(p)) { console.log(s.audio + ': 文件不存在'); return; }
  const buf = fs.readFileSync(p);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  const secs = dataSize / byteRate;
  const frames = Math.ceil(secs * 30);
  console.log(s.audio + ': ' + secs.toFixed(2) + 's (' + frames + ' frames)');
});
"
```

**误差检查**：测量结果与 `ChapterX.tsx` 中已声明的帧数常量相差超过 **2 帧**，必须重新测量并更新常量，不可忽略。

---

### 4. 嵌入 Remotion

帧数确定后，写入 `ChapterX.tsx`：

```tsx
// 帧数来自上一步的测量结果，不要估算
const SCENE0_AUDIO = 116;
const SCENE1_AUDIO = 485;

const S0_START = 0;
const S1_START = S0_START + SCENE0_AUDIO;
const TOTAL_FRAMES = S1_START + SCENE1_AUDIO;
```

---

## Checkpoint Audio（必须停下来确认）

音频合成 + 帧数测量完成后，**必须停下来**，向用户逐项确认：

```
音频合成完成：
  ✅ ch1-0.wav  3.84s (116 frames)
  ✅ ch1-1.wav  16.16s (485 frames)
  ...（列出所有文件）

请确认：
  □ 每个音频都能正常播放？
  □ TTS 有没有读出符号（下划线 / 连字符）？有则修改 text 后单独重新生成
  □ 语速 / 语气是否合适？不合适的单独重新生成（不要 --force 全部）
  □ 帧数常量是否已写入 ChapterX.tsx？

有问题请告诉我，我针对性修复。确认 OK 后回复「继续」。
```

---

## 重新生成音频后的完整操作

重新生成任意音频文件后，必须按顺序执行以下步骤，**不可跳过**：

1. **重新测量帧数**：运行上方通用测量脚本，获取新的帧数值
2. **更新帧数常量**：修改 `ChapterX.tsx` 中对应场景的帧数常量（`SCENE_X_AUDIO`）
3. **重新对齐手动帧号**：检查该章节 `scenes/` 目录下所有使用手动帧号的动画常量（如 `BULLET_FRAMES`、`delay` 等），与新帧数重新对齐——这些是「在音频某个时间点触发的动画」，帧号变了必须跟着更新
4. **更新字幕时间戳**：重新生成该场景对应的 `subtitle-timings.json` 条目（帧数变了，字幕时间戳要重算）
5. **Studio 预览确认**：在 Remotion Studio 中预览，确认音画同步无误
