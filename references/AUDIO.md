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

基础替换：
- `_` → 空格（`init_chat_model` → `init chat model`）
- `-` → 空格（`max-retries` → `max retries`）

Markdown 清理：
- **粗体** → 删除 ** 标记，保留文字
- *斜体* → 删除 * 标记，保留文字
- # 标题 → 删除 # 标记，保留标题文字
- 代码反引号 → 删除反引号，保留内容
- [链接文本](URL) → 只保留"链接文本"，删除 URL
- ![图片描述](URL) → 删除整行
- > 引用块 → 删除 > 符号，保留引用文字
- - 列表标记 / 1. 有序列表 → 删除标记符，保留内容
- --- 分割线 → 删除

编程符号清理：
- () → 保留内容，删除括号
- {} → 删除
- [] → 保留内容，删除括号
- | → 替换为空格
- \ ~ ^ → 删除
- => → 读作"变成"或删除

保留：中文标点（。！？，、；：）、英文标点（.,!?）

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

---

## TTS 回退策略

MiMo TTS 是首选方案，但作为单点依赖存在服务不可用的风险。当 MiMo 完全不可用时（API 持续返回错误、服务宕机），可降级到 Edge TTS 作为备用方案。

### 回退触发条件

满足以下任一条件时启用回退：
- MiMo API 连续 5 次请求均失败（含重试）
- API 返回 502/503 且持续超过 10 分钟
- 用户明确要求使用免费 TTS

### Edge TTS 备用方案

Edge TTS 是 Microsoft Edge 浏览器内置的 TTS 引擎，免费、无需 API key、支持中文。缺点是音色选择较少、语速控制不如 MiMo 精细。

```bash
# 安装
npm install edge-tts

# 合成单个文本
npx edge-tts --voice zh-CN-XiaoxiaoNeural --text "你的文本" --write-media output.wav

# 批量合成（用 Python 脚本包装）
```

**回退注意事项**：
- Edge TTS 不支持 MiMo 的 WAV 直接输出格式，需要额外转换步骤
- 音色与 MiMo「苏打」不同，全片音色会不一致——如已合成部分 MiMo 音频，建议全部改用 Edge TTS 重新合成以保持一致
- 回退模式下仍需遵守文本清理规则（下划线转空格、Markdown 清除等）

### 回退后流程

1. 修改 `synthesize-audio.mjs` 或创建 `synthesize-audio-edge.mjs` 替换 API 调用
2. 重新合成全部音频
3. 重新测量帧数（WAV 格式相同，测量流程不变）
4. 在 Checkpoint Audio 阶段告知用户已使用备用 TTS，确认音色可接受

> 回退方案仅作为应急备用，不替代主流程。正常情况始终使用 MiMo TTS。

---

## 错误处理与故障排除

### 自动重试机制

`synthesize-audio.mjs` 内置重试逻辑：
- 最大重试次数：3 次
- 退避策略：指数退避（500ms → 1000ms → 2000ms）
- 429 响应：自动将请求间隔翻倍后重试
- 超时：单次请求 30 秒超时
- 失败处理：记录失败文件，继续处理下一个
- 完成后：输出成功/失败统计汇总
