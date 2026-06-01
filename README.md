# Remotion Factory

Turn articles, scripts, or code projects into MP4 videos using Remotion.

## Install

```bash
git clone https://github.com/MgGaWin/remotion-factory.git ~/.claude/skills/remotion-factory
```

Or download the [ZIP](https://github.com/MgGaWin/remotion-factory/archive/refs/heads/main.zip) and extract to `~/.claude/skills/remotion-factory/`.

## What You Need

- An article / script / outline / code project
- Node.js 18+
- Chrome browser (for rendering)
- MiMo TTS API key (`MIMO_API_KEY` environment variable)

---

## Quick Start

Drop your material to Claude, one sentence is enough:

> "Turn this article into a video."

The skill auto-detects content type and runs a 4-phase pipeline:

```
Material -> Phase 1: Script + Outline -> Phase 2: Audio Synthesis -> Phase 3: Remotion Dev -> Phase 4: Render MP4
```

To skip audio (visual-only video), say "no audio" at Phase 1 Checkpoint.

---

## Features

- Articles/scripts -> Remotion project (React + TypeScript)
- Frame-perfect animation (`useCurrentFrame` + `interpolate`)
- Audio embedded in timeline (MiMo TTS synthesis)
- **Audio and subtitles enabled by default** (skip only if user explicitly says so)
- One-command MP4 render, no screen recording
- Content fidelity: preserves article depth, no over-simplification
- Feynman expansion: brief notes + code/docs -> `feynman-notes.md` -> polished script
- Design reference images: operator can place sketches, Claude recognizes and references them
- Default Anthropic "Intellectual Warmth" design (customizable via `tokens.css`)
- TTS fallback: auto-degrades to Edge TTS when MiMo TTS is unavailable

**Use cases**: Bilibili / YouTube tutorials, code project explainers, product demos, data visualization videos, dynamic presentations.

---

## Workflow

1. Provide article -> generate `script.md` + `outline.md`
2. Align design -> choose style, confirm structure
3. **Synthesize audio first** -> determine real duration per scene
4. Develop chapters -> build animations based on real frame counts
5. Render MP4 -> only after all confirmations

---

## Design System

- **Four card types**: Standard (border), Oat (warm fill), Feature dark (near-black), Terminal (code)
- **Rhythm-driven themes**: dark scenes inserted by frequency, not content type
- **Three-layer color model**: graphic layer (free), tag layer (restrained), container layer (forbidden)
- **Tint callout containers**: pure light bg + left border (blue/green/orange)
- **10-step neutral scale**: Anthropic Ink -> Slate -> Cloud -> Oat -> Ivory

---

## File Structure

```
remotion-factory/
├── SKILL.md                        # Main workflow routing (~470 lines)
├── manifest.json                   # Skill metadata
├── scripts/
│   ├── lint-remotion-scenes.mjs     # Static quality check
│   ├── synthesize-audio.mjs         # MiMo TTS synthesis
│   └── gen-subtitle-timings.mjs     # Subtitle timing generator
└── references/
    ├── DESIGN-SYSTEM.md             # Full design system
    ├── QUALITY-CHECKS.md            # Quality check standards
    ├── CHAPTER-CRAFT.md             # Scene development guide
    ├── EXPLAINER-SCRIPTING.md       # Feynman expansion guide
    ├── CREATIVE-GAP-PLAYBOOK.md     # Creative judgment guide
    ├── STYLE-ADAPTATION.md          # Style migration guide
    ├── audio.md                     # Audio synthesis + TTS fallback
    ├── SKETCH-SVG.md                # SVG doodle guide
    └── *.html                       # Visual demos (open in browser)
```

---

## Version

Current: **v3.0.0**

- v3.0.0: Architecture refactor — SKILL.md slimmed to ~470 lines, design system and QA extracted to dedicated docs; shipped synthesize-audio.mjs and gen-subtitle-timings.mjs scripts; TTS fallback strategy; audio/subtitles on by default
- v2.0.0: Full rework — TTS text cleaning, Chrome local-first, QA pipeline, light/dark rhythm
- v1.14.0: Explainer mode — Feynman expansion, code project to script
- v1.13.0: Agent Teams — dual-Agent parallel QA at every checkpoint
