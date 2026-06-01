# 质检规范 — Remotion Factory

从 SKILL.md 提取。每个阶段 Checkpoint 并行派出两个独立 Agent 质检。
全部 PASS 才能进入下一阶段。

---

## 核心规则

每个 Phase 完成后，**必须**并行派出两个独立 Agent 执行质检。这不是建议，是进入下一阶段的硬性前置条件。两个 Agent 全部 PASS 之前，不得开始下一 Phase。

### 派发方式

在 Claude Code 环境中，通过 **单条消息中的两条并行 Agent tool 调用** 实现。两个 Agent 互不可见、互不依赖，各自独立读取项目文件并输出 PASS/FAIL 报告。

**Claude Code 派发格式**（到达 Checkpoint 时直接执行，不要只读文档）：

```
你必须在同一条消息中并行创建两个 Agent：

Agent 1（内容/代码/同步质检角色）：
  使用 agent tool，设置 description="QA Phase N - Role A"，subagent_type="reviewer"，
  在 prompt 中写入下方对应 Checkpoint 的 Agent 1 完整清单。

Agent 2（结构/视觉/成品质检角色）：
  使用 agent tool，设置 description="QA Phase N - Role B"，subagent_type="reviewer"，
  在 prompt 中写入下方对应 Checkpoint 的 Agent 2 完整清单。
```

**关键规则**：
- 两条 Agent tool 调用必须写在同一消息中（并行派发）
- 两个 Agent 读取的是同一份项目文件，但各自独立判断，不共享上下文
- 等待两个 Agent 都返回结果后，再汇总判断 PASS/FAIL

### 降级路径（非 Claude Code 环境）

当 Agent tool 不可用时（Cursor、独立 CLI 等环境），必须降级为顺序自检：

1. 按下方 Checklist 逐条核对，不得跳过
2. 每条标注 PASS 或 FAIL，附具体文件名和行号
3. 全部 PASS 后才进入下一 Phase
4. 降级模式下重试循环仍然生效：FAIL -> 修复 -> 重新自检

降级模式的信息不对称风险（同一模型既开发又质检，容易漏掉自己的错误）需在最终交付时告知用户，建议用户在 Checkpoint Render 阶段人工抽查。

---

## Checkpoint Plan（Phase 1 完成）

### Agent 1：内容质检

**读取：** `<project>/article.md`、`<project>/script.md`；如存在 `<project>/feynman-notes.md` 也必须读取

**检查清单：**
- article.md 的每个核心知识点在 script.md 中均有对应覆盖
- script.md 中没有引入原文不存在的错误知识
- 口播语句自然（非书面语、无过长句子）
- 无模糊偷懒写法："等等"、"诸如此类"、"就不展开了"、"大家可以自行了解"
- 每个场景/段落都有 Payoff 句（可复述的结论句）
- 信息/科普解释模式：每个重要结论有证据来源或明确标注为推理
- 信息/科普解释模式：术语第一次出现有大白话解释

**PASS：** 所有核心知识点覆盖；无模糊写法；每个段落有 Payoff
**FAIL：** 有未覆盖的知识点；模糊写法超过 2 处；任意段落缺少 Payoff

### Agent 2：结构质检

**读取：** `<project>/script.md`、`<project>/outline.md`；如存在 `<project>/feynman-notes.md` 也必须读取

**检查清单：**
- 场景数与口播段落数匹配
- 帧型比例：简洁帧 30-45%，密集帧 55-70%
- 暗色场景比例：20-35%
- 连续简洁帧不超过 2 个
- 连续场景布局不重复
- 每章有章节标题场景
- 信息/科普解释模式：每个场景有解释单元、观众问题、证据来源、Payoff 句

**PASS：** 场景/段落数一致；暗色比例 20-35%；无连续同布局；每章有标题场景
**FAIL：** 场景/段落数不匹配；暗色比例超出范围；3+ 连续同布局；章节缺标题场景

---

## Checkpoint Audio（Phase 2 完成）

### Agent 1：音频质检

**读取：** `<project>/audio-segments.json`

**检查清单：**
- 每个 segment 的 `text` 字段与 script.md 对应段落逐字一致
- text 中无 TTS 不友好字符：`_`、`-`、`` ` ``、`**`、`#`、`[]`、`()`、`{}`、`|`、`~`、`^`
- 音频文件名按 `chapter-scene` 规则命名（如 `ch1-0.wav`）
- 每个 WAV 文件存在且大小 > 0 字节
- 尝试 `node -e` 读取 WAV header：byteRate > 0，dataSize > 0

**PASS：** 所有 text 与 script.md 一致；无不干净符号；所有 WAV 文件存在且可解析
**FAIL：** text 不一致；有未清理的符号；WAV 缺失或 0 字节

### Agent 2：帧数质检

**读取：** `<project>/public/audio/` 下所有 WAV 文件

**检查清单：**
- 从 WAV header 读取 byteRate 和 dataSize，计算秒数 = dataSize / byteRate
- 帧数 = `Math.ceil(seconds * 30)`（向上取整，不加缓冲）
- 与 ChapterX.tsx 中的帧数常量对比，误差 <= 2 帧
- 与 FullVideo.tsx 中的总帧数对比
- 各 Chapter 帧数之和 = FullVideo 总帧数

**PASS：** 所有 WAV 帧数与 ChapterX.tsx 常量误差 <= 2 帧；帧数之和 = 总帧数
**FAIL：** 任意 WAV 帧数误差 > 2 帧；帧数之和不等于总帧数

---

## Checkpoint Render（Phase 3 完成）

### Agent 1：代码质检

**读取：** `<project>/src/` 下所有 `.tsx` 文件

**先运行静态 lint：**
```bash
node <skill>/scripts/lint-remotion-scenes.mjs <project>
```

**检查清单：**
- 静态 lint：0 errors
- 所有 `interpolate()` 有 `extrapolateLeft/Right: 'clamp'`（漏一个即 FAIL）
- 无 `Date.now` / `Math.random`（非确定性 API）
- 暗色场景用 `AbsoluteFill className="dark-theme"`（不要 div 包裹 Sequence）
- 暗色场景的 AbsoluteFill style 中显式设置 `background: 'var(--c-bg)'`
- `interpolateColor` 用 3 参数形式
- 所有 `fontSize >= 24px`（grep 验证）
- 所有颜色引用 `var(--c-*)` token，无硬编码 hex/rgba
- 无 emoji 当图标
- 动画时长 >= 18 帧（FAST 常量 + 内联范围）
- 无 `var(--c-surface)` 或 `var(--c-card-featured-*)` 残留

**PASS：** lint 0 errors；所有 interpolate 有 clamp；无非确定性 API；无硬编码颜色；无 fontSize < 24
**FAIL：** lint 有 error；任意 interpolate 缺 clamp；使用 Date.now/Math.random；硬编码颜色存在；fontSize < 24 存在

### Agent 2：视觉质检

**读取：** `<project>/src/scenes/` 下所有场景文件，`<project>/outline.md`

**检查清单：**
- 标题-内容间距 >= 30px
- 每个场景有观众任务标注
- 每个场景只有一个主视觉焦点，1 秒内能判断先看哪里
- 连续场景布局不重复
- accent 色克制使用：每场景最多 1-2 处 accent
- 简洁帧入场动画核心元素用 SLOW(24)，装饰元素用 FAST(18)
- Feature 暗卡标题字号 >= 52px
- 暗色场景比例 20-35%
- 连续暗色场景不超过 1 个；连续亮色场景不超过 4 个
- 所有内容 y < 930
- 标准卡有 `border: 0.5px solid var(--c-card-border)`
- Oat 卡无 border、无 boxShadow
- Feature 暗卡按需使用，同章不超过 2 个
- 卡片文字不用绿/蓝/红（用中性色阶或 accent 文字色）
- 辅助色不做整块容器背景（只做标签/色点/左边框）
- Feature 暗卡内同一种辅助色（不混用）
- 同帧最多两种辅助色
- 提示/警告用纯色浅底 + 左边框
- 视觉重音与口播重音一致
- 每 20-35 秒有轻转折，每 60-90 秒有结构回收
- 每个密集帧有底部结论条或可复述的收束句
- 每个场景有入场动画（无跳切）
- 音频和画面严格同步
- 颜色来自 tokens.css（无硬编码）
- 明暗节奏合理（20-35% 暗色）
- 无 AI 味视觉特征：无紫色粉红渐变、无高饱和霓虹、无 emoji 当图标、无 3D 渲染、无夸张弹跳动画
- Studio 预览无报错

**PASS：** 暗色比例 20-35%；无连续同布局；所有内容 y < 930；无 AI 味特征；Studio 无报错
**FAIL：** 暗色比例超出范围；3+ 连续同布局；内容超出安全区；有 AI 味特征；Studio 报错

### 静态 Lint 命令

```bash
node <remotion-factory>/scripts/lint-remotion-scenes.mjs .
```

将 `<remotion-factory>` 替换为当前 skill 安装路径。该脚本只做静态扫描，不能替代 Studio 预览和成片播放检查。

---

## Checkpoint Final（Phase 4 完成）

### Agent 1：同步质检

**读取：** `<project>/subtitle-timings.json`、`<project>/audio-segments.json`

**检查清单：**
- 字幕时间戳与音频时长匹配（每句 start/end 在对应音频帧范围内）
- 无字幕重叠（前一句 end > 后一句 start）
- 无字幕间隙 > 30 帧 / 1 秒
- 字幕-音频对齐误差 <= 5 帧
- 动画入场帧与口播关键词帧误差 <= 10 帧

**PASS：** 无重叠；无 > 1 秒间隙；字幕-音频误差 <= 5 帧；动画-口播误差 <= 10 帧
**FAIL：** 有重叠；间隙 > 1 秒；对齐误差 > 5 帧；动画-口播误差 > 10 帧

### Agent 2：成品质检

**读取：** 渲染输出文件

**检查清单：**
- 输出文件大小 > 10MB（< 10MB 通常意味着渲染不完整）
- FullVideo.tsx 总帧数覆盖所有章节（各 Chapter 帧数之和 = 总帧数）
- Root.tsx 中 FullVideo 的 `durationInFrames` 正确
- 输出视频时长与帧数一致（总帧数 / 30fps = 预期秒数，误差 < 1 秒）
- 暗色场景视觉效果正确（暗色背景而非白色）——检查场景文件是否用 `className="dark-theme"` 并有 `background: 'var(--c-bg)'`
- 字幕不遮挡主内容（字幕 y 坐标在安全区内）
- **需要人工确认**：播放输出 MP4 验证无黑屏、无卡顿、无音频缺失。Agent 无法执行此检查——标记为"等待人工确认"并展示给用户

**PASS：** 文件 > 10MB；帧数一致；时长匹配；Agent 可执行检查全部通过；"等待人工确认"项已标记
**FAIL：** 文件 < 10MB；帧数不一致；时长误差 >= 1 秒；暗色场景缺主题类名；字幕遮挡内容

---

## 失败处理

当任一 Agent 报 FAIL 时：
1. 收集两个 Agent 的所有 FAIL 项
2. 按优先级修复：代码问题 > 结构问题 > 内容问题
3. 修复后**重新派出两个 Agent 质检**（使用相同 prompt）
4. 循环直到两个 Agent 都 PASS
