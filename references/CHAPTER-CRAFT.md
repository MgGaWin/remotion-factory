# 场景开发指南

## Part 0: 十条原则

1. 16:9 固定舞台：1920x1080，无响应式
2. 帧驱动动画：useCurrentFrame() 是唯一时间源
3. 每场景独占整屏：AbsoluteFill 包裹
4. 音频 = 时长真相源：wav 秒数 x 30 = 帧数（从 WAV header 计算）
5. Sequence 编排：Sequence from={N} durationInFrames={M}
6. 确定性渲染：无随机、无异步、无时间依赖
7. 内容驱动动画：动画服务于内容，不是装饰
8. 逐项揭示：列表/卡片逐个淡入，不要同时出现
9. 设计系统统一：tokens.css 管理颜色/字体
10. 反 AI 味：不要紫粉渐变、emoji、SVG 画人

## Part 1: 场景开发流程

### 开工 6 问

1. 这个场景的核心信息是什么？
2. 观众应该先看什么、后看什么？
3. 音频在说什么？（对齐口播节奏）
4. 用什么动画模式？（淡入/滑入/缩放/逐项）
5. 有没有需要从 article.md 补充的细节？
6. outline 里这个场景的卡片形态标注是什么？（标准卡① / Oat卡② / Feature暗卡③ / 终端卡④）

## Part 2: 动画模式库

### 淡入 + 上滑
```tsx
const FAST = 18;
const opacity = interpolate(frame, [delay, delay + FAST], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
});
const y = interpolate(frame, [delay, delay + FAST], [30, 0], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
});
```

### 缩放弹入
```tsx
const scale = interpolate(frame, [delay, delay + 20], [0.85, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)),
});
```

### 逐项延迟（列表/卡片）
```tsx
items.map((item, i) => {
  const delay = 10 + i * 8;
  const opacity = interpolate(frame, [delay, delay + FAST], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
});
```

### 音频对齐动画（延迟对齐 + 快速动画）
```tsx
const FAST = 18;
const BULLET_FRAMES = [252, 375, 470]; // 音频提到要点的时刻

const bulletOp = (i) => interpolate(
  frame, [BULLET_FRAMES[i], BULLET_FRAMES[i] + FAST], [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
);
```

### "出现就留下"
```tsx
const exitOp = 1; // 不加退出动画
```

### 旋转（加载指示器）
```tsx
const rotation = interpolate(frame, [0, 300], [0, 1080], {
  extrapolateRight: 'clamp',
});
```

### 数字递增
```tsx
const value = interpolate(frame, [startFrame, endFrame], [0, targetValue], {
  extrapolateRight: 'clamp',
});
```

### 打字机效果
```tsx
const charCount = Math.floor(interpolate(
  frame, [startFrame, startFrame + text.length * 2], [0, text.length],
  { extrapolateRight: 'clamp' }
));
const visibleText = text.slice(0, charCount);
```

### 明暗主题组件

整场景暗色（推荐，必须用 AbsoluteFill）：
```tsx
<AbsoluteFill className="dark-theme" style={{ padding: 100 }}>
  <h1 style={{ color: 'var(--c-text)' }}>标题</h1>
</AbsoluteFill>
```

场景内局部切换（18 帧 easeInOut）：
```tsx
const SWITCH_FRAME = 100;
const SWITCH = 18;
const bgColor = interpolateColor(frame,
  [SWITCH_FRAME, SWITCH_FRAME + SWITCH],
  ['#FAF9F5', '#191917'],
  { easing: Easing.inOut(Easing.cubic) }
);
```

注意：不要用 CSS transition，Remotion 不支持。必须用 interpolateColor。

分屏对比（左右明暗）：
```tsx
<div style={{ display: 'flex', width: '100%', height: '100%' }}>
  <div style={{ width: '50%', background: 'var(--c-bg)', color: 'var(--c-text)' }}>{/* 亮 */}</div>
  <div style={{ width: '50%', background: '#191917', color: '#EBEAE4' }}>{/* 暗 */}</div>
</div>
```

### SVG 描边动画
```tsx
const lineProgress = interpolate(frame, [startFrame, endFrame], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
<path d={CURVE_PATH}
  strokeDasharray={CURVE_LENGTH}
  strokeDashoffset={CURVE_LENGTH * (1 - lineProgress)} />
```

### 卡片速查表

```tsx
// ① 标准卡
{ background: 'var(--c-card-bg)', border: '0.5px solid var(--c-card-border)', borderRadius: 8 }

// ② Oat 卡（无边框，靠颜色区分）
{ background: 'var(--c-card-oat-bg)', borderRadius: 8 }

// ③ Feature 暗卡（每章最多 1 个，只放单句结论）
{ background: 'var(--c-card-feature-bg)', borderRadius: 24, color: 'var(--c-card-feature-text)' }

// ④ 终端卡
{ background: 'var(--c-card-terminal-bg)', borderRadius: 24, color: 'var(--c-card-terminal-text)' }

// 亮底暗卡片容器（代码在亮色场景时用，不切整页）
<AbsoluteFill style={{ background: 'var(--c-bg)', padding: '80px 100px' }}>
  {/* 正文内容 */}
  <div style={{ background: 'var(--c-card-terminal-bg)', borderRadius: 24, padding: '48px 56px' }}>
    {/* 代码内容 */}
  </div>
</AbsoluteFill>
```

## Part 3: 组件库

### Terminal 组件
```tsx
<div style={{
  width: 800,
  background: 'var(--c-terminal-bg)',
  borderRadius: 24,
  overflow: 'hidden',
}}>
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', background: '#242423',
  }}>
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
  </div>
  <div style={{ padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
    {children}
  </div>
</div>
```

### StageIntro 组件
居中布局，STAGE 标签 + 大号编号 + 分隔线 + 标题 + 英文副标题

## Part 4: 完工自检

- [ ] 每个场景都有入场动画（无跳切）
- [ ] 动画时长 >= 18 帧（FAST 常量 + 内联范围）
- [ ] interpolate 都有 extrapolateLeft/Right: 'clamp'
- [ ] 字体 >= 24px
- [ ] 颜色来自 tokens.css（无硬编码 hex/rgba）
- [ ] 无 Date.now() / Math.random()
- [ ] 所有内容在 y=930 以上
- [ ] 标准卡有 border: 0.5px solid var(--c-card-border)
- [ ] Oat 卡无 border、无 boxShadow
- [ ] 每章恰好 1 个 Feature 暗卡（放核心结论，单句）
- [ ] 代码高亮只跟随当前参数（不持久）
- [ ] 音频和画面同步
- [ ] Studio 预览无报错
- [ ] 渲染成功出 MP4
