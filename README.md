# Remotion Factory

Turn articles or scripts into MP4 videos using Remotion.

## What it does

- Takes an article or narration script as input
- Produces a Remotion project (React + TypeScript)
- Frame-precise animation with useCurrentFrame + interpolate
- Audio embedded directly in the timeline via MiMo TTS
- Renders to MP4 - no screen recording needed
- Content-faithful narration: preserves article depth, no over-summarization

## How to use

Feed this skill to Claude Code step by step:

1. Provide your article -> skill generates script.md + outline.md
2. Align on design -> pick style, confirm structure
3. Develop chapters -> Remotion project with scenes + audio
4. Render -> npx remotion render outputs MP4

## Key features

- Content fidelity: audio-segments.json text matches script.md faithfully
- TTS-safe text: automatically replaces _ and - with spaces
- Audio-visual sync: animations align to audio timestamps (~15 frames)
- Visual diversity: enforced layout variety across scenes
- Appear and stay: elements stay visible once animated in
- Version-locked: Remotion 4.0.301 + React 18.3 + TypeScript 5.6

## Requirements

- Node.js 18+
- Chrome browser (for rendering)
- MiMo TTS API key (MIMO_API_KEY env var)

## Structure

SKILL.md                    # Main skill document
references/
  CHAPTER-CRAFT.md          # Scene development guide + animation patterns
  AUDIO.md                  # Audio synthesis + frame alignment
