# Quality Checks — Remotion Factory

Extracted from SKILL.md. Dual-Agent quality assurance at every phase checkpoint.
Each phase must PASS both independent Agents before proceeding.

---

## Core Rule

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

## Checkpoint Plan (Phase 1 Complete)

### Agent 1: Content QA

**Reads:** `<project>/article.md`, `<project>/script.md`; if `<project>/feynman-notes.md` exists, read it too.

**Checklist:**
- Each knowledge point in article covered in script
- No erroneous knowledge introduced in script
- Narration sentences are natural (not written-language style, no excessively long sentences)
- No lazy phrases: "etc.", "and so on", "won''t expand here", "you can look it up yourself"
- Every scene/paragraph has a Payoff sentence (repeatable takeaway)
- Explainer mode: every important conclusion has evidence source or marked inference
- Explainer mode: every term has plain-language explanation on first appearance

**PASS:** All core knowledge covered; no lazy phrases; every paragraph has Payoff.
**FAIL:** Uncovered knowledge; > 2 lazy phrases; any paragraph missing Payoff.

### Agent 2: Structure QA

**Reads:** `<project>/script.md`, `<project>/outline.md`; if `<project>/feynman-notes.md` exists, read it too.

**Checklist:**
- Scene count matches narration paragraph count
- Frame type ratio: simple 30-45%, dense 55-70%
- Dark scene ratio: 20-35%
- No consecutive simple frames > 2
- Consecutive scenes don''t repeat layout
- Every chapter has a chapter title scene
- Explainer mode: every scene has explanation unit, audience question, evidence source, Payoff sentence

**PASS:** Scene/paragraph count matches; dark ratio 20-35%; no consecutive same-layout; every chapter has title scene.
**FAIL:** Scene/paragraph mismatch; dark ratio out of range; 3+ consecutive same-layout; chapter missing title scene.

---

## Checkpoint Audio (Phase 2 Complete)

### Agent 1: Audio QA

**Reads:** `<project>/audio-segments.json`

**Checklist:**
- Each segment''s `text` field matches script.md corresponding paragraph verbatim
- No TTS-unfriendly characters: `_`, `-`, `` ` ``, `**`, `#`, `[]`, `()`, `{}`, `|`, `~`, `^`
- Audio filenames follow `chapter-scene` naming (e.g., `ch1-0.wav`)
- Every WAV file exists and size > 0 bytes
- Attempt `node -e` to read WAV header: byteRate > 0, dataSize > 0

**PASS:** All text matches script.md; no unclean symbols; all WAV files present and parseable.
**FAIL:** Text mismatch; uncleaned symbols present; WAV missing or 0 bytes.

### Agent 2: Frame Count QA

**Reads:** `<project>/public/audio/` all WAV files

**Checklist:**
- Read byteRate and dataSize from WAV header, calculate seconds = dataSize / byteRate
- Frame count = `Math.ceil(seconds * 30)` (no buffer added)
- Compare with ChapterX.tsx constants: error <= 2 frames
- Compare with FullVideo.tsx total frames
- Sum of all Chapter frames equals FullVideo total frames

**PASS:** All WAV frames match ChapterX.tsx constants within 2 frames; sum equals FullVideo total.
**FAIL:** Any WAV frame error > 2 frames; sum mismatch.

---

## Checkpoint Render (Phase 3 Complete)

### Agent 1: Code QA

**Reads:** `<project>/src/` all `.tsx` files

**Before running manual checks, run static lint:**
```bash
node <skill>/scripts/lint-remotion-scenes.mjs <project>
```

**Checklist:**
- Static lint: 0 errors
- All `interpolate()` have `extrapolateLeft/Right: 'clamp'` (missing one = FAIL)
- No `Date.now` / `Math.random` (non-deterministic)
- Dark scenes use `AbsoluteFill className="dark-theme"` (not div wrapping Sequence)
- Dark scene AbsoluteFill style explicitly sets `background: 'var(--c-bg)'`
- `interpolateColor` uses 3-parameter form
- All `fontSize >= 24px` (grep and verify)
- All colors use `var(--c-*)` tokens, no hard-coded hex/rgba in scene files
- No emoji as icons
- Animation duration >= 18 frames (`FAST` constant + inline ranges)
- No `var(--c-surface)` or `var(--c-card-featured-*)` residuals

**PASS:** Lint 0 errors; all interpolate clamped; no non-deterministic APIs; no hard-coded colors; no fontSize < 24.
**FAIL:** Lint errors; any interpolate missing clamp; Date.now/Math.random used; hard-coded colors exist; fontSize < 24 exists.

### Agent 2: Visual QA

**Reads:** `<project>/src/scenes/` all scene files, `<project>/outline.md`

**Checklist:**
- Title-content spacing >= 30px
- Every scene has audience task annotation
- Only one primary visual focal point per scene (viewer knows where to look within 1 second)
- Consecutive scenes don''t repeat layout
- Accent color restrained: max 1-2 accent elements per scene
- Simple frame entrance: core elements use SLOW(24), decorative use FAST(18), multi-element staggered
- Feature dark card title font >= 52px (recommended 56px)
- Dark scene ratio 20-35%
- Max 1 consecutive dark; max 4 consecutive light
- All content y < 930
- Standard cards have `border: 0.5px solid var(--c-card-border)`
- Oat cards: no border, no boxShadow
- Feature dark cards: need-based only, max 2 per chapter (narrative chapters may skip)
- Card text: no green/blue/red (use neutral scale or accent text color)
- Auxiliary colors: no full container backgrounds (tags/dots/left-borders only)
- Feature dark card: one auxiliary color type per card
- Max 2 auxiliary colors per frame, each with semantic purpose
- Callouts: pure light bg + left border (no full high-saturation fill)
- Visual accent matches voiceover accent; current highlight switches with narration
- Light turn every 20-35s; structural recap every 60-90s
- Every dense frame has a bottom conclusion bar or repeatable payoff sentence
- Every scene has entrance animation (no jump cuts)
- Audio and visuals strictly synchronized
- Colors from tokens.css (no hard-coded hex/rgba)
- Light/dark rhythm reasonable (20-35% dark)
- No AI-slop visuals: no purple-pink gradients, no neon, no emoji as icons, no 3D, no bounce/elastic easing
- Studio preview: no errors

**PASS:** Dark ratio 20-35%; no consecutive same-layout; all content y < 930; no AI-slop; Studio no errors.
**FAIL:** Dark ratio out of range; 3+ consecutive same-layout; content exceeds safe zone; AI-slop present; Studio errors.

### Static Lint Command

```bash
node <remotion-factory>/scripts/lint-remotion-scenes.mjs .
```

Replace `<remotion-factory>` with skill install path. This script does static scans only; cannot replace Studio preview or full playback review.

---

## Checkpoint Final (Phase 4 Complete)

### Agent 1: Sync QA

**Reads:** `<project>/subtitle-timings.json`, `<project>/audio-segments.json`

**Checklist:**
- Subtitle timestamps match audio duration (each sentence start/end within audio frame range)
- No subtitle overlaps (previous end > next start)
- No subtitle gaps > 30 frames / 1 second
- Subtitle-audio alignment error <= 5 frames
- Animation entry frames match voiceover keyword frames within 10 frames

**PASS:** No overlaps; no gaps > 1s; subtitle-audio error <= 5 frames; animation-voiceover error <= 10 frames.
**FAIL:** Overlaps exist; gaps > 1s; alignment error > 5 frames; animation-voiceover error > 10 frames.

### Agent 2: Final Product QA

**Reads:** Render output files

**Checklist:**
- Output file size > 10MB (< 10MB = incomplete render)
- FullVideo.tsx total frames cover all chapters (sum matches)
- Root.tsx FullVideo `durationInFrames` correct
- Output video duration matches frame count (total frames / 30fps = expected seconds, error < 1s)
- Dark scenes: visual effect correct (dark background, not white) — verify by checking the scene file uses `className="dark-theme"` and has explicit `background: 'var(--c-bg)'`
- Subtitles don''t block main content (subtitle y in safe zone)
- **Human confirmation required**: play the output MP4 and verify no black screens, no stutter, no missing audio. Agent cannot execute this check — mark as "Awaiting human" and present to user.

**PASS:** File > 10MB; frame count consistent; duration matches; all agent-executable checks pass; "Awaiting human" items flagged for user review.
**FAIL:** File < 10MB; frame count mismatch; duration error >= 1s; dark scenes missing theme class; subtitles block content.

---

## Failure Handling

When any Agent reports FAIL:
1. Collect all FAIL items from both Agents
2. Fix by priority: code issues > structure issues > content issues
3. Re-dispatch both Agents with same prompts after fixes
4. Loop until both Agents PASS
