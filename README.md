# Remotion Factory

Turn articles or scripts into MP4 videos using Remotion.

## What it does

- Takes an article or narration script as input
- Produces a Remotion project (React + TypeScript)
- Frame-precise animation with useCurrentFrame + interpolate
- Audio embedded directly in the timeline via MiMo TTS
- Renders to MP4 - no screen recording needed
- Content-faithful narration: preserves article depth, no over-summarization
- Reference images: operators can drop design sketches for Claude to reference

## Workflow (Audio-First)

1. Provide your article -> skill generates script.md + outline.md
2. Align on design -> pick style, confirm structure
3. **Synthesize audio first** -> determine real scene durations
4. Develop chapters -> Remotion project with known frame counts
5. Render MP4 -> only after everything is verified

## Key features

- **Audio-first**: synthesize audio before developing scenes to avoid frame misalignment
- Content fidelity: audio-segments.json text matches script.md faithfully
- TTS-safe text: automatically replaces _ and - with spaces
- Default style: Anthropic warm terracotta (customizable via tokens.css)
- **Color system**: three-layer model (graphic / tag / container) with tint callout tokens
- Visual diversity: enforced layout variety across scenes
- Appear and stay: elements stay visible once animated in
- Reference images: drop sketches in references/ directory
- Agent Teams quality checks at every phase
- Render guard: MP4 rendering only after full verification
- Version-locked: Remotion 4.0.301 + React 18.3 + TypeScript 5.6

## Design system highlights

- **Four card types**: Standard (border), Oat (warm fill), Feature dark (near-black), Terminal (code)
- **Rhythm-driven themes**: dark scenes at fixed intervals, not content-driven
- **Accent color model**: colors only for tags/dots/borders, never as full container fills
- **Tint callouts**: `#EBF2F8` (blue), `#ECF0E6` (green), `#FAEDE6` (orange) with left border
- **10-step neutral scale**: Anthropic's Ink → Slate → Cloud → Oat → Ivory

## Requirements

- Node.js 18+
- Chrome browser (for rendering)
- MiMo TTS API key (MIMO_API_KEY env var)

## Structure

```
SKILL.md                          # Main skill document
manifest.json                     # Skill metadata
references/
  CHAPTER-CRAFT.md                # Scene development guide + animation patterns
  AUDIO.md                        # Audio synthesis + frame alignment
  SKETCH-SVG.md                   # Hand-drawn SVG guide (Anthropic Humane Aesthetic)
  sketch-demo.html                # Interactive SVG demo (88 animated elements)
  color-preview.html              # Full color palette visualization (tokens + cards)
  surface-demo.html               # Color application rules (three-layer model)
```

## Reference HTML files

Open these in your browser to preview the design system:

| File | What it shows |
|------|---------------|
| `color-preview.html` | All tokens, 4 card types, light/dark theme, 10-step neutral scale |
| `surface-demo.html` | Three-layer color model, correct tag/dot/border patterns, tint callouts |
| `sketch-demo.html` | 88 hand-drawn SVG elements with copyable AI prompts |
