---
name: remotion-factory
description: |
  把一篇文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。
  流程：原始文章 → 口播稿 + outline → 用户对齐 → Remotion 开发 → 音频嵌入 → 渲染 MP4。
  适用场景：B 站 / YouTube / 视频号教程、产品演示、数据可视化视频、动态 PPT。
  本 Skill 不绑定特定样式，设计系统由用户偏好驱动。
---

# Remotion Video Presentation

把一篇文章或口播稿，用 Remotion 做成可直接渲染 MP4 的视频。产出物 = Remotion 项目 + 按章节切分的音频 + 最终 MP4。

## 适用场景

- "我有口播稿 / 一篇文章，帮我做成视频"
- 想做"动态 PPT"但要直接出 MP4
- 16:9 横屏视频，大字、留白、每屏有动效
- 教学 / 产品演示 / keynote 电影感
- B 站 / YouTube / 抖音视频内容

**核心特性**：
- 直接输出 MP4，不用录屏
- 动画用 `useCurrentFrame` + `interpolate`，帧级精确控制
- 音频用 `<Audio>` + `staticFile()` 内嵌时间轴
- Remotion Studio 实时预览
- `npx remotion render` 一键渲染

---

## 工作流总览

```
Phase 1   内容编写
   1.1  识别用户输入
   1.2  一次产出 script.md + outline.md
   ▼
[Checkpoint Plan]      ← 必须停。一次对齐 5 件事
   ▼
Phase 2   Remotion 开发
   2.1  脚手架 + 设计系统
   2.2  第 1 章 = 主线程 + 完整版本（强制 anchor）
        ▼
        [硬节点] 用户验收第 1 章 ← 不可跳过
        ▼
   2.3  第 2~N 章（按选定模式）
   ▼
[Checkpoint Audio]     ← 必须停。是否嵌入音频
   ▼
Phase 3   音频嵌入 + 渲染
   ▼
```

---

## 工作目录约定

```
my-video/
├── article.md              # 用户原文（开发阶段画面信息源）
├── script.md               # 口播稿
├── outline.md              # 开发计划
└── video/                  # Remotion 项目
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts        # registerRoot
    │   ├── Root.tsx         # Composition 注册
    │   ├── Chapter1.tsx     # 章节总控（Sequence 编排）
    │   ├── styles/
    │   │   ├── tokens.css   # 设计系统
    │   │   └── global.css   # 全局样式 + 字体
    │   ├── components/      # 共享组件（Terminal, Cards...）
    │   └── scenes/          # 每个场景一个文件
    ├── public/
    │   └── audio/           # wav 文件
    └── out/                 # 渲染输出的 MP4
```

---

## Phase 1 — 内容编写

### 1.1 识别用户输入

| 用户给的东西 | 该做的 |
|---|---|
| 原始文章 | 一次产出 `script.md` + `outline.md` |
| 直接口播稿 | 落盘成 `script.md`，产出 `outline.md` |
| 啥都没有 | 反问：先给素材或大纲 |

### 1.2 产出 script.md + outline.md

**script.md**：B 站风格口播稿，口语化、有节奏感。
**outline.md**：章节切分 + 每步内容 + 信息池。

**outline 的边界**：

| outline 必须写 | outline 不要写 |
|---|---|
| 章节切分 / 每章 scene 数 / 估时 | 具体动画类型 |
| 每步屏幕内容（终端 / 卡片 / 标语） | CSS / 实现细节 |
| 章节级信息池：从 article 抽的数字 / 案例 | 时长数值 |

**Remotion 特有：outline 里要标注每步的音频段落映射**

```markdown
## Chapter 1: 思考中（~50s）
- Scene 0: 阶段介绍（3.8s, ch1-0.wav）
- Scene 1: Cogitating 终端（16s, ch1-1.wav）
- Scene 2: 词义解释（10s, ch1-2.wav）
- Scene 3: 状态词卡片（19s, ch1-3.wav）
```

---

## Checkpoint Plan — 5 件事一次对齐

`script.md` + `outline.md` 写完后必须停下来。

```
内容计划写完，产出文件：
  📄 script.md      {X} 字 / ~{T} 分钟
  📄 outline.md     {N} 章 / {M} 场景 + 每章信息池

章节速览：
  1. <id>     <章节标题>    <S> 场景 ~<T>s
  2. ...

接下来一次对齐 5 件事：

  1. 稿子 (script.md) 要不要改？
  2. 开发计划 (outline.md) 要不要改？
  3. 选哪个设计风格？
  4. 素材怎么准备？
  5. 开发模式选哪个？
     A) 逐章确认（推荐）
     B) 顺序开发
     C) 并行开发（Agent Teams）
```

---

## Phase 2 — Remotion 开发

### 2.1 脚手架

```bash
mkdir my-video && cd my-video
mkdir -p src/{styles,components,scenes} public/audio out
```

**package.json**:
```json
{
  "scripts": {
    "start": "npx remotion studio",
    "render": "npx remotion render src/index.ts Chapter1 out/chapter1.mp4"
  },
  "dependencies": {
    "remotion": "4.0.301",
    "@remotion/cli": "4.0.301",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "typescript": "^5.6.3"
  }
}
```

**src/index.ts**:
```ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
```

**src/Root.tsx**:
```tsx
import { Composition } from 'remotion';
import { Chapter1, TOTAL_FRAMES } from './Chapter1';

export const RemotionRoot: React.FC = () => (
  <Composition id="Chapter1" component={Chapter1} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
);
```

### 2.2 第 1 章 — 主线程 + 强制验收

**核心**：第 1 章 = 完整版本一次到位（节奏 + 视觉 + 音频时长对齐）。

**Chapter1.tsx 模板**：
```tsx
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';

// 音频时长（帧数 @30fps）
const SCENE0_AUDIO = 116;  // 3.84s
const SCENE1_AUDIO = 485;  // 16.16s
const SCENE2_AUDIO = 298;  // 9.92s

const S0_START = 0;
const S1_START = S0_START + SCENE0_AUDIO;
const S2_START = S1_START + SCENE1_AUDIO;
const TOTAL_FRAMES = S2_START + SCENE2_AUDIO;

export { TOTAL_FRAMES };

export const Chapter1: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={S0_START} durationInFrames={SCENE0_AUDIO} name="Scene 0">
      <Audio src={staticFile('audio/ch1-0.wav')} />
      <Scene0 />
    </Sequence>
    <Sequence from={S1_START} durationInFrames={SCENE1_AUDIO} name="Scene 1">
      <Audio src={staticFile('audio/ch1-1.wav')} />
      <Scene1 />
    </Sequence>
    <Sequence from={S2_START} durationInFrames={SCENE2_AUDIO} name="Scene 2">
      <Audio src={staticFile('audio/ch1-2.wav')} />
      <Scene2 />
    </Sequence>
  </AbsoluteFill>
);
```

**场景组件模板**：
```tsx
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

export const Scene0: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const translateY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: '#FAF9F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
        {/* 内容 */}
      </div>
    </AbsoluteFill>
  );
};
```

**做完第 1 章后必须停下来等用户验收**：
```
第 1 章做完了，Remotion Studio 在 http://localhost:3000 运行。

验收重点：
  □ 视觉气质对不对？
  □ 节奏对不对？音频和画面是否同步？
  □ 动画是否流畅？有没有生硬的跳切？
  □ 反 AI 味检查

问题告诉我，我针对性改。OK 了告诉我"继续"。
```

### 2.3 第 2~N 章 — 按选定模式

三种模式：
- **A) 逐章确认**：每章做完验收
- **B) 顺序开发**：全部做完统一验收
- **C) 并行开发**：Agent Teams 并行

**多章节总控模板**（多个 Composition）：
```tsx
// Root.tsx
<Composition id="Chapter1" component={Chapter1} durationInFrames={CH1_FRAMES} fps={30} width={1920} height={1080} />
<Composition id="Chapter2" component={Chapter2} durationInFrames={CH2_FRAMES} fps={30} width={1920} height={1080} />
<Composition id="FullVideo" component={FullVideo} durationInFrames={CH1_FRAMES + CH2_FRAMES} fps={30} width={1920} height={1080} />
```

---

## Phase 3 — 音频嵌入 + 渲染

### 音频准备

```bash
# 复制音频到 public/audio/
cp ../audio/ch1-*.wav video/public/audio/

# 测量音频时长（Node.js）
node -e "
const fs = require('fs');
['ch1-0','ch1-1','ch1-2'].forEach(f => {
  const buf = fs.readFileSync('public/audio/' + f + '.wav');
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  console.log(f + ': ' + (dataSize/byteRate).toFixed(2) + 's (' + Math.ceil(dataSize/byteRate*30) + ' frames)');
});
"
```

### 渲染

```bash
# 用本地 Chrome 渲染（国内网络需要）
npx remotion render src/index.ts Chapter1 out/chapter1.mp4 --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"

# 渲染全部章节
npx remotion render src/index.ts FullVideo out/full-video.mp4 --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

---

## 设计原则

### Remotion 动画规则

1. **帧驱动**：所有动画基于 `useCurrentFrame()`，不用 `Date.now()` 或 `setTimeout`
2. **确定性**：同一帧数永远产生同一画面（渲染一致性）
3. **interpolate 代替 CSS transition**：
   ```tsx
   const opacity = interpolate(frame, [startFrame, endFrame], [0, 1], {
     extrapolateLeft: 'clamp',
     extrapolateRight: 'clamp',
     easing: Easing.out(Easing.cubic),
   });
   ```
4. **Sequence 编排**：用 `<Sequence from={N} durationInFrames={M}>` 切分场景
5. **音频同步**：`<Audio src={staticFile('audio/xxx.wav')} />` 放在对应 Sequence 内

### 视觉规范

- **画布**：1920×1080 固定，无响应式
- **字体**：≥ 24px（投影可读）
- **反 AI 味**：不要紫色粉红渐变、emoji 当图标、SVG 画人
- **设计系统**：tokens.css 管理颜色/字体/间距
- **内容密度**：每屏 1-2 个核心信息点，留白为王

### 常用动画模式

**淡入**：
```tsx
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
```

**上滑入场**：
```tsx
const y = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
```

**缩放弹入**：
```tsx
const scale = interpolate(frame, [0, 15], [0.8, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) });
```

**逐项延迟**：
```tsx
{items.map((item, i) => {
  const delay = i * 10;
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div key={i} style={{ opacity }}>{item}</div>;
})}
```

**旋转**：
```tsx
const rotation = interpolate(frame, [0, 300], [0, 1080], { extrapolateRight: 'clamp' });
```

---

## 音频合成（MiMo TTS）

**API 配置**：
```
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
VOICE=苏打（无 style）
```

**合成脚本**：`scripts/synthesize-audio.mjs`
```js
import fs from 'fs';
import path from 'path';

const segments = JSON.parse(fs.readFileSync('audio-segments.json', 'utf8'));
const apiKey = process.env.MIMO_API_KEY;
const baseUrl = process.env.MIMO_BASE_URL;

for (const seg of segments) {
  const outPath = path.join('public/audio', seg.audio);
  if (fs.existsSync(outPath)) { console.log(`skip ${seg.audio}`); continue; }

  const resp = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'MiMo-V2.5-TTS', input: seg.text, voice: '苏打' }),
  });

  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ ${seg.audio} (${(buffer.length/1024).toFixed(0)}KB)`);
}
```

---

## 自检清单

每章完成后必须过：

- [ ] 每个场景都有入场动画（无跳切）
- [ ] 音频和画面严格同步
- [ ] 字体 ≥ 24px
- [ ] 颜色来自 tokens.css（无乱入色）
- [ ] 无 `Date.now()` / `Math.random()`（确定性）
- [ ] 每个 `interpolate` 都有 `extrapolateLeft/Right: 'clamp'`
- [ ] `npm run start` 预览无报错
- [ ] `npm run render` 渲染成功

---

## 常见问题

| 问题 | 解决 |
|------|------|
| 渲染下载 Chrome 超时 | `--browser-executable` 指向本地 Chrome |
| 音频和画面不同步 | 检查帧数计算是否正确（秒数 × 30） |
| 字体加载失败 | 用 Google Fonts CDN 或本地 .woff2 |
| 动画卡顿 | 减少同时动画的元素数量 |
| 渲染文件太大 | `--codec h264` 或降低分辨率 |
