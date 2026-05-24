# Hand-drawn Sketch SVG — Anthropic Humane Aesthetic

Anthropic 官网和视频中大量使用的手绘涂鸦风格 SVG，核心是 **"不完美的人文感"**。
本文档拆解其视觉特征、生成思路、实现步骤，并提供可直接复用的代码模板。

---

## 目录

1. [视觉特征拆解](#1-视觉特征拆解)
2. [技术原理](#2-技术原理)
3. [三步生成法](#3-三步生成法)
4. [SVG 滤镜详解](#4-svg-滤镜详解)
5. [Path 编写技巧](#5-path-编写技巧)
6. [动画实现](#6-动画实现)
7. [Remotion 集成](#7-remotion-集成)
8. [代码模板库](#8-代码模板库)
9. [调参速查表](#9-调参速查表)
10. [常见问题](#10-常见问题)

---

## 1. 视觉特征拆解

### 三个核心特征

| 特征 | 说明 | 技术实现 |
|------|------|----------|
| **不完美线条** | 线条轻微抖动、粗细不均、圆不是正圆 | `<path>` + 贝塞尔曲线抖动坐标 |
| **粗糙边缘** | 线条边缘有纸张摩擦/铅笔画的毛刺感 | `feTurbulence` + `feDisplacementMap` 滤镜 |
| **手绘生长动画** | 像有支无形钢笔实时勾勒出来 | `stroke-dasharray` + `stroke-dashoffset` |

### 设计意图

- 不用 `<circle>` `<rect>` 等标准几何标签 → 全部用 `<path>` 手绘
- 闭合路径故意"画过头" → 模仿提笔时的惯性
- 线条起点/终点有轻微重叠 → 模仿手绘时的首尾交接
- 滤镜强度克制（scale 1~3）→ 保持可读性

### 适合用涂鸦的场景

- 概念关系图（A → B 的连接线）
- 文字强调（下划线、圆圈高亮）
- 章节开场的装饰性图形
- 流程图的非精确连线

### 不适合用涂鸦的场景

- 数据可视化图表（需要精确 SVG，不加粗糙滤镜）
- 代码 / 终端场景（风格冲突）
- 信息密集的卡片内部（涂鸦会抢注意力）
- 每个场景最多 1~2 处涂鸦，不要铺满

---

## 2. 技术原理

```
┌─────────────────────────────────────────────────────┐
│  SVG Path (不完美贝塞尔曲线)                          │
│  ↓                                                   │
│  feTurbulence (生成 Perlin 噪声场)                    │
│  ↓                                                   │
│  feDisplacementMap (沿噪声场扭曲路径)                  │
│  ↓                                                   │
│  stroke-dasharray + stroke-dashoffset (笔画生长动画)   │
│  ↓                                                   │
│  animation: drawIn (CSS 动画驱动)                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. 三步生成法

### Step 1: 写不完美的 Path

**原则：** 不用标准几何标签，用 `M`/`C`/`Q` 贝塞尔曲线拼接，坐标故意偏移 2~5px。

```html
<!-- 错误：完美圆 -->
<circle cx="50" cy="50" r="40" />

<!-- 正确：手绘圆（4段贝塞尔，闭合处故意画过头） -->
<path d="M 50,15
         C 78,12  95,35  92,58
         C 89,81  68,95  45,93
         C 22,91   8,70  12,48
         C 16,26  32,14  52,15
         C 62,15  76,20  84,30" />
```

**坐标抖动规则：**
- 控制点偏移 ±3~8px（相对于理想位置）
- 起点和终点故意不完全重合（差 2~4px）
- 闭合路径的最后一段延伸一小段（模仿提笔）

### Step 2: 加粗糙滤镜

```html
<defs>
  <filter id="rough">
    <feTurbulence type="fractalNoise"
      baseFrequency="0.04"   <!-- 控制噪声粒度，0.03~0.06 -->
      numOctaves="3"          <!-- 噪声层数，3~4 -->
      seed="2"                <!-- 随机种子，不同元素用不同值 -->
      result="noise"/>
    <feDisplacementMap
      in="SourceGraphic"
      in2="noise"
      scale="1.8"             <!-- 扭曲强度，1~3 最佳 -->
      xChannelSelector="R"
      yChannelSelector="G"/>
  </filter>
</defs>
```

### Step 3: 加生长动画

```css
@keyframes drawIn {
  from { stroke-dashoffset: var(--path-len); }
  to   { stroke-dashoffset: 0; }
}

.sketch-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: var(--path-len);
  animation: drawIn 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

---

## 4. SVG 滤镜详解

### feTurbulence 参数

| 参数 | 作用 | 推荐值 | 说明 |
|------|------|--------|------|
| `type` | 噪声类型 | `fractalNoise` | 比 `turbulence` 更自然 |
| `baseFrequency` | 噪声频率 | 0.03~0.06 | 越大越细碎，越小越平滑 |
| `numOctaves` | 噪声层数 | 3~4 | 越多细节越丰富，性能越差 |
| `seed` | 随机种子 | 任意整数 | 不同元素用不同种子避免重复 |

### feDisplacementMap 参数

| 参数 | 作用 | 推荐值 | 说明 |
|------|------|--------|------|
| `scale` | 扭曲强度 | 1~3 | 越大越"粗糙"，超过 4 开始失真 |
| `xChannelSelector` | X 轴噪声通道 | `R` | 通常用红色通道 |
| `yChannelSelector` | Y 轴噪声通道 | `G` | 通常用绿色通道 |

### 滤镜强度参考

```
scale: 1.0  → 极轻微抖动，适合细线条
scale: 1.5  → 轻微粗糙，适合一般涂鸦
scale: 2.0  → 中等粗糙，最常用
scale: 2.5  → 明显粗糙，适合粗线条
scale: 4.0  → 强烈扭曲，仅用于装饰性效果
```

### 共享滤镜模板（推荐）

在页面顶部定义一次，所有 SVG 共用：

```html
<svg width="0" height="0" style="position:absolute">
  <defs>
    <filter id="r1"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="r2"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="r3"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="19" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="r4"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="42" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="r5"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="88" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>
  </defs>
</svg>
```

---

## 5. Path 编写技巧

### 5.1 不完美圆

```
思路：4 段三阶贝塞尔曲线拼成近似圆，每段控制点偏移 ±5px

M 起点(x,y)
C 控制1(x,y)  控制2(x,y)  终点(x,y)   ← 第1弧
C 控制1(x,y)  控制2(x,y)  终点(x,y)   ← 第2弧
C 控制1(x,y)  控制2(x,y)  终点(x,y)   ← 第3弧
C 控制1(x,y)  控制2(x,y)  终点(x,y)   ← 第4弧
C 控制1(x,y)  控制2(x,y)  终点(x,y)   ← 闭合延伸（画过头）
```

### 5.2 不完美矩形

```
思路：4 段直线用轻微曲线替代，每边中间控制点偏移 ±2px

M 左上角
C 上边中点偏移  右上角
C 右边中点偏移  右下角
C 下边中点偏移  左下角
C 左边中点偏移  回到左上角附近
```

### 5.3 手绘箭头

```
思路：轴线用 S 形贝塞尔曲线，箭头两翼不对称

轴线：M 起点 C 控制点(微微弯曲) 终点
左翼：M 轴线终点 L 偏左上方
右翼：M 轴线终点 L 偏右下方（角度/长度与左翼不同）
```

### 5.4 波浪下划线

```
思路：多个 S 形贝塞尔段拼接，每段波峰波谷偏移

M 起点
C 波峰1  波谷1  波峰2
C 波谷2  波峰3  波谷3
...
```

### 5.5 坐标抖动速查

| 形状 | 抖动幅度 | 说明 |
|------|----------|------|
| 圆/椭圆 | 控制点 ±5~8px | 让圆不那么圆 |
| 矩形 | 边中点 ±2~3px | 让直线微微弯曲 |
| 箭头轴线 | 中间控制点 ±3~5px | 让轴线有 S 弧度 |
| 箭头翼 | 长度/角度 ±2px | 两翼故意不对称 |
| 连接线 | 中间控制点 ±4~6px | 让连接线有自然弧度 |
| 下划线 | 波峰波谷 ±3~4px | 让下划线有波浪感 |

---

## 6. 动画实现

> ⚠️ 以下 CSS 写法仅用于 HTML 演示（sketch-demo.html）。
> Remotion 组件里禁止使用 CSS animation，必须用 interpolate 驱动，见第 7 节。

### 6.1 基础生长动画

```css
@keyframes drawIn {
  from { stroke-dashoffset: var(--path-len); }
  to   { stroke-dashoffset: 0; }
}

.sketch-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.draw-animated {
  stroke-dasharray: var(--path-len);
  animation: drawIn 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

### 6.2 延迟级联（多元素依次出现）

```css
.d1 { animation-delay: 0.15s; }
.d2 { animation-delay: 0.3s; }
.d3 { animation-delay: 0.45s; }
.d4 { animation-delay: 0.6s; }
.d5 { animation-delay: 0.75s; }
.d6 { animation-delay: 0.9s; }
.d7 { animation-delay: 1.05s; }
.d8 { animation-delay: 1.2s; }
```

### 6.3 文字淡入（配合 Path 动画）

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
}
```

### 6.4 帧抖动（高级：呼吸感）

```css
@keyframes wiggle {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(0.3px, -0.2px) rotate(0.2deg); }
  50% { transform: translate(-0.2px, 0.3px) rotate(-0.15deg); }
  75% { transform: translate(0.3px, 0.1px) rotate(0.1deg); }
}

.wiggle-subtle {
  animation: wiggle 3s ease-in-out infinite;
}
```

### 6.5 pathLen 估算

`--path-len` 不需要精确值，略大于实际路径长度即可（动画会 clamp）。

| 形状 | 估算 pathLen |
|------|-------------|
| 小圆 (r≈40) | 250~300 |
| 中圆 (r≈60) | 350~400 |
| 矩形 (100x60) | 300~350 |
| 箭头轴线 | 100~130 |
| 箭头单翼 | 20~30 |
| 波浪下划线 | 250~320 |
| 连接线 | 50~80 |

---

## 7. Remotion 集成

### 7.1 React 组件模板

```tsx
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

const ROUGH_FILTER = `
  <filter id="rough">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
`;

export const SketchCircle: React.FC<{
  color?: string;
  strokeWidth?: number;
  delay?: number;
}> = ({ color = "#D97757", strokeWidth = 2.2, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pathLen = 440;
  const duration = 28; // 涂鸦生长动画，比普通淡入稍慢但不超过 30 帧
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = pathLen * (1 - progress);

  // 手绘不完美圆的 Path
  const d = "M 50,15 C 78,12 95,35 92,58 C 89,81 68,95 45,93 C 22,91 8,70 12,48 C 16,26 32,14 52,15 C 62,15 76,20 84,30";

  return (
    <svg width="320" height="320" viewBox="0 0 100 100">
      <defs>
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed={2} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={1.8} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#rough)"
        strokeDasharray={pathLen}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};
```

### 7.2 帧驱动动画要点

```tsx
// ❌ 错误：CSS animation（Remotion 渲染时不保证一致）
<div style={{ animation: "drawIn 1.6s forwards" }} />

// ✅ 正确：用 interpolate 计算当前帧的 dashoffset
const progress = interpolate(frame, [0, totalFrames], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const dashOffset = pathLen * (1 - progress);
```

### 7.3 多元素级联

```tsx
const items = [/* path configs */];

items.map((item, i) => {
  const itemDelay = i * 8; // 每个元素延迟 8 帧
  const progress = interpolate(frame - itemDelay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',   // ← 必须有
    extrapolateRight: 'clamp',  // ← 必须有
  });
  // ...
});
```

### 7.4 帧抖动（Remotion 版）

```tsx
// Math.sin/cos 是帧驱动的，同一帧永远同一结果 → 允许使用
// Math.random() 每帧不同 → 严格禁止
// 微弱的帧抖动，模拟胶片质感
const jitterX = Math.sin(frame * 0.8) * 0.3;
const jitterY = Math.cos(frame * 0.6) * 0.2;

<g transform={`translate(${jitterX}, ${jitterY})`}>
  {/* sketch elements */}
</g>
```

---

## 8. 代码模板库

### 8.1 基础形状

#### 圆圈
```html
<path d="M 50,15 C 78,12 95,35 92,58 C 89,81 68,95 45,93 C 22,91 8,70 12,48 C 16,26 32,14 52,15 C 62,15 76,20 84,30"
  fill="none" stroke="#D97757" stroke-width="2.2" filter="url(#rough)"/>
```

#### 矩形
```html
<path d="M 18,12 C 40,10 80,11 102,13 C 104,25 103,55 101,67 C 80,69 40,68 19,66 C 17,55 18,25 19,13"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
```

#### 圆角矩形
```html
<path d="M 30,12 C 50,10 75,10 90,14 C 100,18 104,30 103,45 C 102,58 98,66 88,68 C 72,70 45,70 32,67 C 20,64 16,55 17,42 C 18,28 22,16 32,13"
  fill="none" stroke="#D97757" stroke-width="2" filter="url(#rough)"/>
```

#### 三角形
```html
<path d="M 50,12 L 90,85 C 75,88 60,87 50,86 C 35,88 20,87 10,85 Z"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
```

#### 菱形
```html
<path d="M 50,8 C 72,22 92,42 90,52 C 88,65 72,82 50,92 C 28,82 12,65 10,52 C 8,42 28,22 50,8"
  fill="none" stroke="#6A9BCC" stroke-width="2" filter="url(#rough)"/>
```

### 8.2 箭头

#### 单向箭头
```html
<!-- 轴线 -->
<path d="M 10,20 C 40,18 80,22 115,20"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
<!-- 箭头翼 -->
<path d="M 108,14 L 122,20 L 108,26"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
```

#### 双向箭头
```html
<path d="M 25,20 C 50,17 90,23 115,20"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
<path d="M 30,20 L 18,14 M 30,20 L 16,26"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
<path d="M 110,14 L 124,20 L 110,26"
  fill="none" stroke="#141413" stroke-width="2" filter="url(#rough)"/>
```

#### 弧形箭头
```html
<path d="M 15,65 C 20,30 55,10 80,25"
  fill="none" stroke="#D97757" stroke-width="2" filter="url(#rough)"/>
<path d="M 74,18 L 84,28 L 76,32"
  fill="none" stroke="#D97757" stroke-width="2" filter="url(#rough)"/>
```

### 8.3 文字强调

#### 波浪下划线
```html
<path d="M 4,8 C 30,4 60,12 90,6 C 120,0 150,12 180,6 C 210,0 240,10 256,7"
  stroke="#D97757" stroke-width="3" opacity="0.65" filter="url(#rough)"/>
```

#### 圆圈高亮
```html
<path d="M 35,8 C 70,2 160,3 215,10 C 230,15 235,28 228,40 C 218,50 150,52 80,50 C 30,48 8,38 10,25 C 12,14 22,8 38,7"
  stroke="#D97757" stroke-width="2" opacity="0.5" filter="url(#rough)"/>
```

#### 方框高亮
```html
<path d="M 12,6 C 70,4 170,5 225,7 C 228,15 227,35 225,43 C 170,45 70,44 15,42 C 12,35 13,15 14,7"
  stroke="#788C5D" stroke-width="1.8" opacity="0.55" filter="url(#rough)"/>
```

### 8.4 常用图标

#### 勾选
```html
<path d="M 14,26 L 22,34 L 38,16"
  stroke="#788C5D" stroke-width="3.5" filter="url(#rough)"/>
```

#### 叉号
```html
<path d="M 14,14 L 48,48" stroke="#C97B7B" stroke-width="3" filter="url(#rough)"/>
<path d="M 46,14 L 12,48" stroke="#C97B7B" stroke-width="3" filter="url(#rough)"/>
```

#### 灯泡
```html
<!-- 玻璃 -->
<path d="M 25,8 C 38,8 44,18 43,30 C 42,40 35,48 30,52 L 20,52 C 15,48 8,40 7,30 C 6,18 12,8 25,8"
  stroke="#D9A057" stroke-width="2" filter="url(#rough)"/>
<!-- 底座 -->
<path d="M 18,54 L 32,54 L 30,60 L 20,60 Z"
  stroke="#D9A057" stroke-width="1.5" filter="url(#rough)"/>
```

#### 放大镜
```html
<path d="M 26,10 C 36,8 46,14 46,26 C 46,38 36,46 24,44 C 12,42 6,32 8,22 C 10,14 16,10 28,10"
  stroke="#141413" stroke-width="2" filter="url(#rough)"/>
<path d="M 40,40 L 54,54"
  stroke="#141413" stroke-width="2.5" filter="url(#rough)"/>
```

### 8.5 对话气泡

#### 说话气泡
```html
<path d="M 25,15 C 50,10 120,11 150,14 C 158,18 160,28 158,40 C 156,52 150,58 140,60 L 75,62 L 55,85 L 60,60 C 40,62 20,58 16,48 C 12,38 14,22 26,15"
  stroke="#141413" stroke-width="2" filter="url(#rough)"/>
```

#### 思考气泡
```html
<path d="M 40,20 C 60,10 140,12 165,18 C 178,24 180,40 175,52 C 168,64 148,68 100,66 C 52,68 22,62 18,50 C 14,38 20,24 42,20"
  stroke="#6A9BCC" stroke-width="2" filter="url(#rough)"/>
<!-- 思考点 -->
<circle cx="62" cy="72" r="4" fill="none" stroke="#6A9BCC" stroke-width="1.5"/>
<circle cx="48" cy="84" r="3" fill="none" stroke="#6A9BCC" stroke-width="1.5"/>
<circle cx="40" cy="94" r="2" fill="none" stroke="#6A9BCC" stroke-width="1.5"/>
```

### 8.6 图表

#### 折线图坐标轴
```html
<!-- Y 轴 + X 轴 -->
<path d="M 25,10 L 23,120 C 26,122 100,121 200,120"
  stroke="#141413" stroke-width="1.5" filter="url(#rough)"/>
```

#### 数据线
```html
<path d="M 35,105 C 50,100 60,85 75,78 C 90,71 100,90 115,65 C 130,40 145,50 160,35"
  stroke="#D97757" stroke-width="2" filter="url(#rough)"/>
```

---

## 9. 调参速查表

### 颜色系统（Anthropic 暖调）

```css
--terracotta: #D97757;    /* 主色：赤陶色 */
--ink: #141413;           /* 文字/线条：墨色 */
--paper: #FAF9F5;         /* 背景：羊皮纸 */
--blue-muted: #6A9BCC;    /* 辅助蓝 */
--sage: #788C5D;          /* 辅助绿 */
--gold: #D9A057;          /* 辅助金 */
--rose: #C97B7B;          /* 辅助红（错误/否定） */
```

> 暗色场景下：线条改用 `var(--c-text)`（#EBEAE4），accent 改用 `var(--c-accent)`（#EE6B3E）。
> `--gold: #D9A057` 和 `--rose: #C97B7B` 是本文件扩展色，tokens.css 里没有对应 token，使用时直接硬编码，不要用 var()。

### 线条粗细

| 场景 | strokeWidth | 说明 |
|------|-------------|------|
| 主要形状 | 2~2.5 | 圆、矩形、箭头轴线 |
| 次要细节 | 1.5~1.8 | 箭头翼、连接线 |
| 装饰性 | 1~1.2 | 标注线、虚线、十字标记 |
| 强调 | 3~3.5 | 粗下划线、重点勾选 |

### 动画时长

| 元素 | 时长 | easing |
|------|------|--------|
| 主形状 | 1.5~2s | cubic-bezier(0.4, 0, 0.2, 1) |
| 箭头/连接线 | 0.8~1.2s | 同上 |
| 文字淡入 | 0.4~0.6s | ease |
| 级联延迟 | 0.15~0.3s 间隔 | — |

---

## 10. 常见问题

### Q: pathLen 怎么确定？
不需要精确。设一个比实际路径大的值即可，`stroke-dashoffset` 会自动 clamp。经验值：小形状 200~300，中形状 300~500，大形状 500+。

### Q: 不同元素怎么避免滤镜噪声重复？
给每个 `<filter>` 设置不同的 `seed` 值。建议预定义 5~8 个不同 seed 的滤镜，按需选用。

### Q: 滤镜性能问题？
SVG 滤镜在大量元素时会影响性能。建议：
- 共享滤镜定义（页面级 `<defs>`）
- 避免在动画中动态改变滤镜参数
- Remotion 渲染时滤镜是静态的，不影响最终 MP4

### Q: 怎么让涂鸦"画完"后保持不动？
CSS 版：`animation-fill-mode: forwards`（已包含在模板中）
Remotion 版：`extrapolateRight: "clamp"`（已包含在模板中）

### Q: 能不能用 AI 生成这些 Path？
可以，但需要明确提示：
- "不要用 `<circle>` `<rect>` 等标准标签，必须用 `<path>`"
- "控制点坐标故意偏移 3~8px 模拟手抖"
- "闭合路径最后一段延伸一小段，模仿提笔"
- "配合 `feTurbulence` + `feDisplacementMap` 滤镜产生粗糙边缘"
