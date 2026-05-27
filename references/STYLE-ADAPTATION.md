# 风格迁移指南

用于用户要求改变默认 Anthropic 暖调风格时。目标是换视觉气质，但不破坏 Remotion Factory 的音频先行、字幕安全区、帧型节奏和质检规则。

## 不可改变的底层约束

- 仍然使用音频先行：先确定 wav 帧数，再开发场景。
- 仍然保持 1920x1080、30fps、内容 y < 930、底部留 160px。
- 仍然使用简洁帧 / 密集帧交替。
- 仍然使用 `tokens.css` 管理颜色、字体、卡片变量。
- 仍然保持字体 >= 24px，代码 >= 22px。
- 仍然禁止随机、时间依赖、CSS transition。
- 仍然执行 `scripts/lint-remotion-scenes.mjs` 静态检查。

## 风格迁移流程

### 1. 提取用户意图

先确认 5 件事：

1. 领域：技术教程、产品演示、财经分析、教育课程、品牌宣传等。
2. 观众：开发者、管理层、学生、消费者、投资人等。
3. 平台：B 站、YouTube、视频号、课程平台、企业内训等。
4. 情绪：克制、锋利、亲切、权威、年轻、戏剧化等。
5. 禁区：不要像什么；必须保留什么品牌元素。

### 2. 选择风格档位

不要直接复制某个品牌官网。选择一个档位，再用 token 映射实现。

| 档位 | 适用 | 视觉关键词 | 风险 |
|---|---|---|---|
| Academic Warm | 技术教程、概念讲解 | 纸张、暖灰、衬线、大留白 | 过于安静 |
| Product Keynote | 产品演示、发布会 | 高对比、大标题、精确动效 | 容易变营销页 |
| Data Editorial | 财经、数据分析 | 表格、细线、严肃中性色 | 容易太密 |
| Blackboard Course | 教育、推导、算法 | 深色板面、粉笔线、逐步推导 | 容易低质手写风 |
| Studio Minimal | 品牌片、观点视频 | 大留白、强图像、少字 | 容易信息不足 |

### 3. 改 token，不改业务代码

优先改 `src/styles/tokens.css`：

```css
:root {
  --c-bg: ...;
  --c-text: ...;
  --c-accent: ...;
  --font-display: ...;
  --font-sans: ...;
  --c-card-bg: ...;
  --c-card-border: ...;
}

.dark-theme {
  --c-bg: ...;
  --c-text: ...;
  --c-accent: ...;
}
```

不要在 Scene 文件里到处硬编码 hex。默认只使用当前颜色库中的既有 token，不新增 `chart-yellow`、`chart-purple`、`tint-yellow`、`tint-purple` 等新色相 token。除非用户明确提供新品牌色并要求扩展，否则不要扩展颜色库。

### 4. 再调构图和动效

| 风格档位 | 构图调整 | 动效调整 |
|---|---|---|
| Academic Warm | 不对称偏置、大留白、细线 | 18-24 帧淡入/上滑 |
| Product Keynote | 大标题、单物件聚焦、强对比 | 18 帧精准切入，少量缩放 |
| Data Editorial | 表格和注释密度更高，结论条更明确 | 逐行揭示，当前行高亮 |
| Blackboard Course | 左推导右解释，手绘线条辅助 | 线条描边、逐步出现 |
| Studio Minimal | 一屏一个概念，图像优先 | 慢淡入，少量平移 |

## 现有色库映射

风格迁移优先通过布局、字号、留白、明暗比例、动效节奏完成；颜色只在现有库内重新分配用途。

| 用途 | 使用现有 token |
|---|---|
| 主强调 | `--c-accent` / `--c-accent-deep` |
| 数据类别 A | `--c-chart-blue` |
| 数据类别 B | `--c-chart-green` |
| 数据背景/弱区分 | `--c-chart-gray` / `--c-oat` / `--c-bg-warm` |
| 提示 | `--c-tint-blue` + `--c-tint-blue-border` |
| 最佳实践 | `--c-tint-green` + `--c-tint-green-border` |
| 注意/警告 | `--c-tint-orange` + `--c-tint-orange-border` |
| 暗色结论 | `--c-card-feature-*` |
| 代码/终端 | `--c-card-terminal-*` |

### 各风格的颜色策略

| 风格档位 | 颜色处理 |
|---|---|
| Product Keynote | 提高 `--c-accent` 使用优先级，但不增加新色相 |
| Data Editorial | 主要使用中性色 + `--c-chart-blue` / `--c-chart-green` 两类数据色 |
| Blackboard Course | 优先使用 `.dark-theme` 既有暗色 token，不新增暗色 tint |
| Studio Minimal | 减少辅助色，只保留 `--c-accent` 和中性色 |

如果现有蓝/绿/橙不足以表达四类以上数据，不要新增 yellow/purple。改用编号、线型、明暗、纹理、位置或分组标签区分。

## 风格迁移质检

- [ ] 新风格仍然能读清楚：标题、正文、注释层级明确。
- [ ] 新风格没有破坏字幕安全区。
- [ ] 新风格没有把辅助色变成大面积容器背景。
- [ ] 新风格没有让暗色场景超过 35%，除非整片明确是深色课程风。
- [ ] 新风格没有为了气氛牺牲信息密度。
- [ ] 新风格没有引入高饱和紫粉渐变、3D、无意义光效。
- [ ] 新风格没有新增未授权色相 token（如 chart-yellow、chart-purple、tint-yellow、tint-purple）。
- [ ] Scene 文件没有硬编码大量 hex；颜色主要来自 tokens。
- [ ] 已运行 `node scripts/lint-remotion-scenes.mjs .` 或技能内置同名脚本。
