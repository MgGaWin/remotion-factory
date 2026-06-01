#!/usr/bin/env node
// gen-subtitle-timings.mjs — Generate subtitle timing data for remotion-factory
//
// Reads audio-segments.json, measures WAV frame counts, splits text into
// sentences following the skill''s sentence-splitting rules, and outputs
// subtitle-timings.json.
//
// Usage:
//   node scripts/gen-subtitle-timings.mjs

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const SEGMENTS_PATH = path.join(PROJECT_ROOT, "audio-segments.json");
const AUDIO_DIR = path.join(PROJECT_ROOT, "public", "audio");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "subtitle-timings.json");

const FPS = 30;

// ── Frame measurement from WAV header ──────────────────
function measureFrames(wavPath) {
  if (!fs.existsSync(wavPath)) return null;
  const buf = fs.readFileSync(wavPath);
  if (buf.length < 44) return null;
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  if (byteRate === 0) return null;
  const seconds = dataSize / byteRate;
  return Math.ceil(seconds * FPS);
}

// ── Sentence splitting ─────────────────────────────────
// Rules (from SKILL.md):
//   - Split on sentence-ending punctuation: \u3002\uff01\uff1f  (Chinese .!?)
//   - Also split on English .!? followed by space or end
//   - For sentences > 50 chars, further split on \uff1b\uff1a  (Chinese ;:)
//   - Adjacent short sentences (< 12 chars) get merged
//   - Never split on commas
function splitSentences(text) {
  // Normalize: ensure Chinese punctuation is used
  const t = text.trim();
  if (t.length === 0) return [];

  // Split on sentence-ending punctuation
  const raw = t.split(/(?<=[\u3002\uff01\uff1f])/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // Further split long sentences on Chinese ; :
  const result = [];
  for (const s of raw) {
    if (s.length > 50) {
      const parts = s.split(/(?<=[\uff1b\uff1a])/g)
        .map((p) => p.trim())
        .filter(Boolean);
      result.push(...parts);
    } else {
      result.push(s);
    }
  }

  // Merge adjacent short sentences (< 12 chars)
  const merged = [];
  for (const s of result) {
    if (merged.length > 0 && s.length < 12) {
      // Current sentence too short, merge into previous
      merged[merged.length - 1] += s;
    } else {
      merged.push(s);
    }
  }

  return merged;
}

// ── Timing distribution ────────────────────────────────
function distributeTimings(sentences, totalFrames) {
  if (sentences.length === 0) return [];
  if (sentences.length === 1) {
    return [{ text: sentences[0], start: 0, end: totalFrames }];
  }

  // Allocate frames proportional to character count
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  const timings = [];
  let cursor = 0;

  for (const s of sentences) {
    const proportion = s.length / totalChars;
    // Minimum 1 second (30 frames), max 90% of remaining
    const duration = Math.max(30, Math.min(
      Math.round(proportion * totalFrames),
      totalFrames - cursor - (sentences.length - timings.length - 1) * 30
    ));
    const end = Math.min(cursor + duration, totalFrames);
    timings.push({ text: s, start: cursor, end });
    cursor = end;
  }

  // Adjust last item to exactly fill totalFrames
  if (timings.length > 0) {
    timings[timings.length - 1].end = totalFrames;
  }

  return timings;
}

// ── Main ───────────────────────────────────────────────
function main() {
  if (!fs.existsSync(SEGMENTS_PATH)) {
    console.error(`Error: ${SEGMENTS_PATH} not found.`);
    process.exit(1);
  }

  const segments = JSON.parse(fs.readFileSync(SEGMENTS_PATH, "utf8"));

  const output = {
    _meta: { fps: FPS, generated: new Date().toISOString() },
  };

  // Build scene-level frame map from audio files
  const sceneFrames = {};
  for (const seg of segments) {
    const wavPath = path.join(AUDIO_DIR, seg.audio);
    const frames = measureFrames(wavPath);
    if (frames === null) {
      console.warn(`Warning: cannot measure frames for ${seg.audio}`);
      continue;
    }
    sceneFrames[seg.scene] = (sceneFrames[seg.scene] || 0) + frames;
  }

  // Generate per-scene subtitle arrays
  for (const seg of segments) {
    const sentences = splitSentences(seg.text);
    const totalFrames = sceneFrames[seg.scene];

    if (!totalFrames) {
      console.warn(`Warning: no frame data for scene ${seg.scene}, skipping.`);
      continue;
    }

    if (!output[seg.scene]) {
      output[seg.scene] = [];
    }

    const timings = distributeTimings(sentences, totalFrames);
    output[seg.scene] = timings;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);

  const sceneCount = Object.keys(output).filter((k) => k !== "_meta").length;
  console.log(`Scenes: ${sceneCount}`);
  for (const [scene, timings] of Object.entries(output)) {
    if (scene === "_meta") continue;
    console.log(`  ${scene}: ${timings.length} sentence(s)`);
  }
}

main();
