# Remotion Factory

Turn articles or scripts into MP4 videos using [Remotion](https://remotion.dev).

## What it does

- Takes an article or narration script as input
- Produces a Remotion project (React + TypeScript)
- Frame-precise animation with `useCurrentFrame` + `interpolate`
- Audio embedded directly in the timeline
- Renders to MP4 — no screen recording needed

## How to use

Feed this skill to Claude Code (or compatible AI coding assistant) step by step:

1. **Provide your article** → skill generates `script.md` + `outline.md`
2. **Align on design** → pick style, confirm structure
3. **Develop chapters** → Remotion project with scenes + audio
4. **Render** → `npx remotion render` outputs MP4

## Requirements

- Node.js 18+
- Chrome browser (for rendering)
- Optional: TTS API for voiceover synthesis

## Structure

```
SKILL.md                    # Main skill document
references/
  CHAPTER-CRAFT.md          # Scene development guide + animation patterns
  AUDIO.md                  # Audio synthesis + frame alignment
```
