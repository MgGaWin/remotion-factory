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
- Visual diversity: enforced layout variety across scenes
- Appear and stay: elements stay visible once animated in
- Reference images: drop sketches in references/ directory
- Agent Teams quality checks at every phase
- Render guard: MP4 rendering only after full verification
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
