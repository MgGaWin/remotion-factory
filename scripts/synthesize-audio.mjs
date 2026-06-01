#!/usr/bin/env node
// synthesize-audio.mjs — MiMo TTS audio synthesis for remotion-factory
//
// Usage:
//   node scripts/synthesize-audio.mjs                    # synthesize all (skip existing)
//   node scripts/synthesize-audio.mjs --force            # re-synthesize all
//   node scripts/synthesize-audio.mjs --only ch1-0.wav   # single file
//
// Environment:
//   MIMO_API_KEY — MiMo TTS API key

import fs from "node:fs";
import path from "node:path";

// ── Config ──────────────────────────────────────────────
const API_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions";
const API_KEY = process.env.MIMO_API_KEY;
const VOICE = "\u82cf\u6253"; // \u82cf\u6253
const MODEL = "mimo-v2.5-tts";
const REQUEST_INTERVAL_MS = 500;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1] ?? null;
const HELP = args.includes("--help") || args.includes("-h");

if (HELP) {
  console.log([
    "Usage:",
    "  node scripts/synthesize-audio.mjs [--force] [--only=ch1-0.wav]",
    "",
    "Options:",
    "  --force     Re-synthesize all files even if they already exist",
    "  --only=X    Only synthesize the specified file",
    "  --help      Show this help",
  ].join("\n"));
  process.exit(0);
}

const PROJECT_ROOT = process.cwd();
const SEGMENTS_PATH = path.join(PROJECT_ROOT, "audio-segments.json");
const AUDIO_DIR = path.join(PROJECT_ROOT, "public", "audio");

// ── Text cleaning ──────────────────────────────────────
function cleanText(text) {
  let t = text;
  // Markdown removal
  t = t.replace(/\*\*(.+?)\*\*/g, "$1");       // bold
  t = t.replace(/\*(.+?)\*/g, "$1");           // italic
  t = t.replace(/^#{1,6}\s+/gm, "");           // headings
  t = t.replace(/`{1,3}[^`]*`{1,3}/g, "");    // inline code / code blocks
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links
  t = t.replace(/!\[.*?\]\([^)]+\)/g, "");     // images
  t = t.replace(/^>\s?/gm, "");                // blockquotes
  t = t.replace(/^[\s]*[-*+]\s/gm, "");        // unordered lists
  t = t.replace(/^\d+\.\s/gm, "");             // ordered lists
  t = t.replace(/^---+$/gm, "");               // horizontal rules
  // Symbol replacement
  t = t.replace(/_/g, " ");                    // underscores to spaces
  t = t.replace(/-/g, " ");                    // hyphens to spaces
  t = t.replace(/[|~^\\]/g, " ");             // pipe, tilde, caret, backslash
  t = t.replace(/[{}]/g, "");                  // braces
  t = t.replace(/[\[\]]/g, "");                // brackets (after links handled)
  t = t.replace(/[()]/g, "");                  // parentheses
  t = t.replace(/=>/g, " ");                   // arrow
  // Collapse whitespace
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// ── API call ───────────────────────────────────────────
async function synthesize(text, retries = MAX_RETRIES) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: "user", content: text },
      { role: "assistant", content: text },
    ],
    voice: VOICE,
    response_format: "wav",
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }

      // MiMo returns audio bytes directly (not base64)
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) {
        throw new Error(`Response too small: ${buf.length} bytes`);
      }
      return buf;
    } catch (err) {
      const is429 = err.message?.includes("429");
      const isTimeout = err.name === "AbortError";
      const wait = is429
        ? REQUEST_INTERVAL_MS * Math.pow(2, attempt)
        : 500 * Math.pow(2, attempt - 1);

      if (attempt < retries) {
        console.warn(
          `  Retry ${attempt}/${retries} in ${wait}ms: ${err.message?.slice?.(0, 80) ?? err}`
        );
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

// ── Main ───────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error("Error: MIMO_API_KEY environment variable is not set.");
    process.exit(1);
  }

  if (!fs.existsSync(SEGMENTS_PATH)) {
    console.error(`Error: ${SEGMENTS_PATH} not found.`);
    process.exit(1);
  }

  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const segments = JSON.parse(fs.readFileSync(SEGMENTS_PATH, "utf8"));
  const seen = new Set();
  const queue = [];
  for (const seg of segments) {
    if (seen.has(seg.audio)) continue;
    seen.add(seg.audio);
    queue.push(seg);
  }

  if (ONLY) {
    const idx = queue.findIndex((s) => s.audio === ONLY);
    if (idx === -1) {
      console.error(`Error: --only=${ONLY} not found in audio-segments.json`);
      process.exit(1);
    }
    queue.splice(0, queue.length, queue[idx]);
  }

  let success = 0;
  let skipped = 0;
  const failures = [];

  for (let i = 0; i < queue.length; i++) {
    const seg = queue[i];
    const outPath = path.join(AUDIO_DIR, seg.audio);

    if (!FORCE && !ONLY && fs.existsSync(outPath) && fs.statSync(outPath).size > 100) {
      console.log(`[${i + 1}/${queue.length}] SKIP  ${seg.audio} (exists)`);
      skipped++;
      continue;
    }

    const clean = cleanText(seg.text);
    if (clean.length === 0) {
      console.warn(`[${i + 1}/${queue.length}] SKIP  ${seg.audio} (empty after cleaning)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${queue.length}] SYNC  ${seg.audio} (${clean.length} chars)`);

    try {
      const buf = await synthesize(clean);
      fs.writeFileSync(outPath, buf);
      console.log(`  -> OK  ${buf.length} bytes`);
      success++;
    } catch (err) {
      console.error(`  -> FAIL: ${err.message?.slice?.(0, 120) ?? err}`);
      failures.push({ file: seg.audio, error: String(err) });
      // Write empty file so we know it was attempted
      try { fs.writeFileSync(outPath, Buffer.alloc(0)); } catch {}
    }

    // Rate limiting between segments
    if (i < queue.length - 1) {
      await new Promise((r) => setTimeout(r, REQUEST_INTERVAL_MS));
    }
  }

  // ── Summary ─────────────────────────────
  console.log("");
  console.log("=".repeat(50));
  console.log(`Done: ${success} ok, ${skipped} skipped, ${failures.length} failed`);
  if (failures.length > 0) {
    console.log("Failures:");
    for (const f of failures) {
      console.log(`  ${f.file}: ${f.error}`);
    }
  }
  process.exit(failures.length > 0 ? 1 : 0);
}

main();
