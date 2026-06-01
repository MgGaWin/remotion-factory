# Design System — Remotion Factory

Extracted from SKILL.md. Covers the full visual design language, token system,
card patterns, rhythm rules, and layout IDs. Read this alongside the HTML demos
in `color-preview.html`, `surface-demo.html`, and `layout-gallery.html`.

---

## 1. Default Style: Anthropic "Intellectual Warmth"

Core philosophy: academic journal texture + humanist warmth + restrained intellectual elegance.
Explicitly rejects "aggressive" tech aesthetics (high-saturation deep blue, neon gradients, cold futuristic feel).

### Color Tokens (Light Theme)

```css
:root {
  /* Backgrounds */
  --c-bg: #FAF9F5;              /* Parchment white */
  --c-bg-warm: #F3F1EC;          /* Warm gray, card zones */
  --c-surface: #FFFFFF;          /* Modal/dialog surfaces only (NOT card bg) */

  /* Text */
  --c-text: #141413;             /* Deep ink black (never pure #000) */
  --c-text-secondary: #7A7870;   /* Secondary text */
  --c-text-muted: #9E9C94;       /* Muted / dividers */
  --c-divider: #B0AEA5;          /* Fine divider lines */

  /* Brand accent */
  --c-accent: #D97757;           /* Warm terracotta */
  --c-accent-deep: #C2522D;      /* Deep terracotta, hover/emphasis */

  /* Chart auxiliary colors */
  --c-chart-blue: #6A9BCC;       /* Morandi blue, low saturation */
  --c-chart-green: #788C5D;      /* Sage green, low saturation */
  --c-chart-gray: #E8E6DC;       /* Light gray chart background */

  /* 10-step neutral scale (Anthropic official) */
  --c-slate-medium: #3D3D3A;     /* Borders / focus rings */
  --c-slate-light: #5E5D59;      /* Tertiary text */
  --c-cloud-dark: #87867F;       /* Secondary / timestamps */
  --c-cloud-light: #D1CFC5;      /* Card fine borders / dividers */
  --c-oat: #E3DACC;              /* Warm fill card background */
  --c-ivory-medium: #F0EEE6;     /* Secondary surface / nav background */

  /* Terminal (code display) */
  --c-terminal-bg: #1E1E2E;
  --c-terminal-text: #CDD6F4;
  --c-terminal-red: #F38BA8;
}
```

### Color Tokens (Dark Theme)

```css
.dark-theme {
  --c-bg: #191917;              /* Deep charcoal with warmth */
  --c-bg-warm: #242422;
  --c-surface: #2D2C2A;

  --c-text: #EBEAE4;             /* Warm off-white (never pure white) */
  --c-text-secondary: #9E9C94;
  --c-text-muted: #666560;
  --c-divider: rgba(158, 156, 148, 0.15);

  --c-accent: #EE6B3E;           /* Brighter terracotta for dark bg */
  --c-accent-deep: #E58565;

  --c-chart-blue: #81A9D4;
  --c-chart-green: #8DA173;
  --c-chart-gray: #3A3936;
}
```

### Color Usage: Three-Layer Model

| Layer | Rule | Example |
|-------|------|---------|
| **Graphic layer** - free | Chart lines, SVG doodles, flow connectors | Three colors simultaneously OK |
| **Tag layer** - restrained | Small tag backgrounds, dots, numbered circles, left borders, accent text | Max 3 colors, total area < 5% of screen |
| **Container layer** - forbidden | Full card backgrounds, surface fills | Never fill containers with auxiliary colors |

**Accent (terracotta `#D97757`) use rules:**
- Allowed: text color (CTA/highlights), tag background (white text on accent), left border (3px solid), graphic strokes
- Forbidden: large container backgrounds
- Max 1-2 accent elements per section

**Tint callout containers** (pure light background + 3px left border):
- `--c-tint-blue: #EBF2F8` + `--c-tint-blue-border: #6A9BCC` — info/tips
- `--c-tint-green: #ECF0E6` + `--c-tint-green-border: #788C5D` — best practice
- `--c-tint-orange: #FAEDE6` + `--c-tint-orange-border: #D97757` — warning/caution

---

## 2. Card System

### Four Card Types

| Type | Background | Border | Radius | Semantic |
|------|-----------|--------|--------|----------|
| 1. Standard | `#FAF9F5` (same as page) | `0.5px solid #D1CFC5` | 8px | Information display, equal treatment |
| 2. Oat warm fill | `#E3DACC` | None | 8px | Important but not climax; a "pause" beat |
| 3. Feature dark | `#141413` | None | 24px | Chapter''s most important takeaway |
| 4. Terminal | `#1E1E2E` | None | 24px | Code / technical content |

### Card Decision Tree

For each card, answer three questions:

**Q1: If removed, what core insight would the audience miss?**
- "Not much" -> Standard 1
- "A key point" -> Oat 2
- "The soul of the section" -> Feature dark 3

**Q2: Has a dark card already been used in this chapter?**
- "Not yet" -> OK to use Feature dark if it''s core takeaway
- "Used one" -> OK for a second if truly the most important
- "Used two" -> Force downgrade to Oat. Max 2 Feature dark cards per chapter.

**Q3: Is this content "one thing" or "multiple parallel items"?**
- "Multiple, need comparison" -> Force Standard 1 (dark cards cannot hold lists)
- "One sentence / one idea" -> Consider dark or Oat

### Card Hard Constraints

| Constraint | Detail |
|------------|--------|
| Feature dark: need-based | Only if missing this content means losing key info |
| Max 2 Feature dark per chapter | More loses "most important" meaning |
| No lists in dark cards | Dark cards hold single-sentence conclusions only |
| No consecutive Oat cards | Must follow Oat with Standard (rhythm drops off) |
| Info-dense chapters: >= 1 Oat | Narrative chapters may skip |
| Max 1 non-standard card type per scene | Rest must be Standard |
| Standard cards must have border | `border: 0.5px solid var(--c-card-border)` |
| Oat cards: no border, no boxShadow | Distinguished purely by `#E3DACC` background |
| Dark card text: no green/blue/red | Use `var(--c-card-feature-text)` / `var(--c-card-feature-secondary)` |
| Oat card text: neutral only | Use `var(--c-card-oat-text)` or `var(--c-accent)` text color |

---

## 3. Typography

| Level | Size | Weight | Font | Use |
|-------|------|--------|------|-----|
| Hero | 80-100px | 700 | `var(--font-display)` | Chapter opening, core quote |
| Large heading | 48-60px | 700 | `var(--font-display)` | Scene theme |
| Subheading | 32-36px | 600 | `var(--font-sans)` | Card titles |
| Body | 24-28px | 400 | `var(--font-sans)` | Explanatory text |
| Label | 20-22px | 400 | `var(--font-sans)` | Data source, timestamps |
| Big number | 80-120px | 700 | `var(--font-display)` | Data focal point |
| Code | 22-24px | 400 | `var(--font-mono)` | Terminal/code blocks |

```css
--font-display: 'Lora', Georgia, serif;      /* Authority, tension */
--font-sans: 'Poppins', Arial, sans-serif;    /* Modern humanist */
--font-mono: 'JetBrains Mono', monospace;     /* Code */
```

For Chinese content, add `'Noto Sans SC'` as first fallback after Poppins.

---

## 4. Scene Rhythm System

### Rhythm-Driven (NOT Content-Driven)

Dark scenes are "accent beats" inserted by frequency, not by content type:
1. Scene 0 must be dark (opening impact)
2. After every 3-4 consecutive light scenes, insert 1 dark scene
3. If chapters exist, chapter opening scenes are natural dark positions (not forced)
4. Last scene may be dark (closing impact, optional)

**Constraints:**
- Max 1 consecutive dark scene
- Max 4 consecutive light scenes (including LightWithDarkCard)
- Dark scene ratio: 20-35%

### Scene Modes

| Mode | Background | Use |
|------|-----------|-----|
| `SceneLight` | `var(--c-bg)` parchment white | Body text, charts, flow steps |
| `SceneDark` | `#191917` deep charcoal | Opening title, core conclusions (accent beat) |
| `SceneLightWithDarkCard` | `var(--c-bg)` parchment white | Light scene with embedded dark card (code/terminal) |

---

## 5. Layout ID System

### Simple Frames (40%)

| ID | Name | Use |
|----|------|-----|
| S1 | Large text monologue | Core idea, opening, closing |
| S2 | Title + subtitle | Chapter transition, concept intro |
| S3 | Quote card | Quote, core takeaway |
| S4 | Data highlight | Key number, statistic |

### Dense Frames (60%)

| ID | Name | Structure |
|----|------|-----------|
| D1 | Data table | 6-8 row table + header + highlight row + footer |
| D2 | Left text + right data | L 55%: text+tags / R 45%: data cards |
| D3 | Numbered list | 6 steps with numbered circles + descriptions |
| D4 | Left explain + right code | L 42%: description / R 58%: code |
| D5 | Grid cards | 3x2 grid, one Oat marked as recommended |
| D6 | Problem-improvement compare | L/R: 5 pain points / improvements |

### Special Frames

| ID | Name | Use |
|----|------|-----|
| F | Feature dark card | Chapter''s most important takeaway (max 2/chapter) |
| T | Terminal | Code / tech content |
| CC | CodeComparison | Left/right code diff (full-screen component) |
| TS | TerminalSequence | Terminal operation sequence (full-screen component) |

**Rules:**
- Consecutive scenes cannot use the same layout ID
- At least 2-3 different layout types per chapter
- Full-screen components (CC/TS) must have non-full-screen scenes before and after
- Recommended arc: opening simple frame -> expand dense frame -> breathing simple frame -> deep dive dense frame -> summary simple frame

---

## 6. Visual Accent System (Levels 1-5)

One primary accent per frame. Accent strength must match voiceover intensity.

| Level | Scope | Tools |
|-------|-------|-------|
| 1 Word | Keywords, parameter names, terms | Accent text, underline, colored dot |
| 2 Item | Current list item / code line being discussed | Left border, numbered dot, row highlight |
| 3 Block | One region more important than others | Oat card, light tint, fine border |
| 4 Frame | Core takeaway, chapter turn | Simple frame, dark theme, Feature dark card |
| 5 Rhythm | Mood shift, paragraph gear change | Light/dark switch, whitespace, brief pause |

---

## 7. Audience Retention Beats

Every scene labels at least one beat:
- **Hook**: Enter with question, contrast, cost, or result
- **Map**: Tell audience how many parts (without laying out all details)
- **Reveal**: Deliver information item by item, synced with voiceover
- **Contrast**: Create judgment via before/after, good/bad, left/right, old/new
- **Payoff**: Compress explanation into a repeatable takeaway sentence

**Timing rules:**
- First 8 seconds: direct question, contrast, or promise (no background preamble)
- Every 20-35 seconds: at least one light turn (simple frame, dark frame, contrast, code result, conclusion bar)
- Every 60-90 seconds: one structural recap (what was solved, why next part matters)
- Last 12 seconds: compressed answer; last frame should look screenshot-worthy

---

## 8. Animation Rules

### Core Principles
- `useCurrentFrame()` is the sole time source
- Deterministic: same frame = same output
- All `interpolate()` must have `extrapolateLeft: 'clamp', extrapolateRight: 'clamp'`
- "Appear and stay": elements remain visible once animated in (`exitOp = 1`)

### Animation Pace
```tsx
const FAST = 18;  // Normal elements (0.6s)
const SLOW = 24;  // Important elements (0.8s)
```

### Scene Transitions
Hard cuts between scenes. No `interpolateColor` between scene components.
Anthropic official style: zero gradient, zero shadow softening, hard-edge transitions.

### Forbidden
- Bounce / Elastic easing
- Fast blinking / large deformations
- CSS transitions (not deterministic)

---

## 9. Spacing System (1920x1080)

| Layout | Padding | Notes |
|--------|---------|-------|
| Large text monologue | TB 160px, LR 200px | Maximum breathing room |
| Title + content | T 80px, B 160px, LR 100px | Standard flow |
| Two-column compare | TB 80px, LR 100px | Information dense |
| Data table | T 60px, B 160px, LR 80px | Maximize content area |
| Deep dive frame | T 60px, B 160px, LR 80px | Maximize content area |

### Subtitle Safety
- All content `y < 930`
- Bottom padding >= 160px (subtitle reservation, even when subtitles disabled)
- Subtitle component: `bottom: 40px`, semi-transparent dark bg `rgba(20,20,19,0.85)`, white text `#EBEAE4`, 28px

---

## 10. Negative Checklist

Things to NEVER do:
- High-saturation blue, neon gradients
- Purple-pink gradients
- Emoji as icons
- SVG-drawn people
- 3D rendering, fluid gradients, aurora effects
- Exaggerated bounce animations
- High-energy electronic BGM
- Auxiliary colors as full container backgrounds
- Scale font size with viewport width
- Hard-coded hex/rgba in scene files (use tokens)
- `var(--c-surface)` as card background
- Chinese text smaller than 24px
