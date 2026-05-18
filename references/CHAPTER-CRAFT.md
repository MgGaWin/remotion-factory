# 场景开发指南

## Part 0: 十条原则

1. **16:9 固定舞台**：1920×1080，无响应式
2. **帧驱动动画**：`useCurrentFrame()` 是唯一时间源
3. **每场景独占整屏**：`<AbsoluteFill>` 包裹
4. **音频 = 时长真相源**：wav 秒数 × 30 = 帧数
5. **Sequence 编排**：`<Sequence from={N} durationInFrames={M}>`
6. **确定性渲染**：无随机、无异步、无时间依赖
7. **内容驱动动画**：动画服务于内容，不是装饰
8. **逐项揭示**：列表/卡片逐个淡入，不要同时出现
9. **设计系统统一**：tokens.css 管理颜色/字体
10. **反 AI 味**：不要紫粉渐变、emoji、SVG 画人

## Part 1: 场景开发流程

### 开工 5 问

1. 这个场景的核心信息是什么？
2. 观众应该先看什么、后看什么？
3. 音频在说什么？（对齐口播节奏）
4. 用什么动画模式？（淡入/滑入/缩放/逐项）
5. 有没有需要从 article.md 补充的细节？

### 场景模板

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

export const SceneName: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [3, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{
      background: '#FAF9F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ opacity: titleOpacity }}>标题</h1>
      </div>
    </AbsoluteFill>
  );
};
```

## Part 2: 动画模式库

### 淡入 + 上滑
```tsx
const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const y = interpolate(frame, [delay, delay + 15], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
```

### 缩放弹入
```tsx
const scale = interpolate(frame, [delay, delay + 20], [0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) });
```

### 逐项延迟（列表/卡片）
```tsx
{items.map((item, i) => {
  const delay = 10 + i * 12;
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div key={i} style={{ opacity }}>{item}</div>;
})}
```

### 旋转（加载指示器）
```tsx
const rotation = interpolate(frame, [0, 300], [0, 1080], { extrapolateRight: 'clamp' });
```

### 数字递增
```tsx
const value = interpolate(frame, [startFrame, endFrame], [0, targetValue], { extrapolateRight: 'clamp' });
```

### 打字机效果
```tsx
const text = "要显示的文字";
const charCount = Math.floor(interpolate(frame, [startFrame, startFrame + text.length * 2], [0, text.length], { extrapolateRight: 'clamp' }));
const visibleText = text.slice(0, charCount);
```

## Part 3: 组件库

### Terminal 组件
```tsx
const Terminal: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <div style={{ width: 800, background: '#1a1a19', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.15)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#242423' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
      {title && <span style={{ marginLeft: 12, fontSize: 13, color: '#666' }}>{title}</span>}
    </div>
    <div style={{ padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {children}
    </div>
  </div>
);
```

### StageIntro 组件
```tsx
const StageIntro: React.FC<{ num: string; title: string; en: string }> = ({ num, title, en }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, letterSpacing: '0.2em', color: '#B0AEA5' }}>STAGE</span>
      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 120, fontWeight: 700, color: '#D97757' }}>{num}</span>
      <div style={{ width: 48, height: 3, background: '#D97757', borderRadius: 2 }} />
      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 56, fontWeight: 700, color: '#141413' }}>{title}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#B0AEA5' }}>{en}</span>
    </AbsoluteFill>
  );
};
```

## Part 4: 完工自检

- [ ] 每个场景都有入场动画（无跳切）
- [ ] `interpolate` 都有 `extrapolateLeft/Right: 'clamp'`
- [ ] 字体 ≥ 24px
- [ ] 颜色来自 tokens.css
- [ ] 无 `Date.now()` / `Math.random()`
- [ ] 音频和画面同步
- [ ] Studio 预览无报错
- [ ] 渲染成功出 MP4
