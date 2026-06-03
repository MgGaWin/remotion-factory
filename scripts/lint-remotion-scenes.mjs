#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const USAGE = `
Usage:
  node scripts/lint-remotion-scenes.mjs [project-root] [--json] [--warn-only]

Defaults:
  project-root = current working directory
  scan paths   = src/scenes, src/components, src/Chapter*.tsx, src/FullVideo.tsx

Checks:
  - fontSize below 24
  - interpolate calls missing extrapolateLeft/Right clamp
  - Date.now / Math.random
  - hard-coded hex/rgb/hsl colors in TSX scene code
  - emoji used as icons
  - forbidden card variables
  - risky y positions and small bottom subtitle space
  - Oat card with border/boxShadow
  - Feature dark card overuse in a single file
  - code block with terminal background missing color property
`;

const args = process.argv.slice(2);
const json = args.includes('--json');
const warnOnly = args.includes('--warn-only');
const help = args.includes('--help') || args.includes('-h');
const rootArg = args.find((arg) => !arg.startsWith('--'));

if (help) {
  console.log(USAGE.trim());
  process.exit(0);
}

const projectRoot = path.resolve(rootArg ?? process.cwd());

const CONFIG = {
  minFontSize: 24,
  subtitleSafeY: 930,
  minBottomSpace: 150,
  maxFeatureCardsPerFile: 2,
  extensions: new Set(['.ts', '.tsx', '.js', '.jsx']),
  excludedDirs: new Set(['node_modules', '.git', 'out', 'dist', 'build', '.next']),
};

const results = [];

function add(severity, file, line, rule, message, snippet = '') {
  results.push({
    severity,
    file: path.relative(projectRoot, file).replaceAll(path.sep, '/'),
    line,
    rule,
    message,
    snippet: snippet.trim(),
  });
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function listFiles(target) {
  if (!exists(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return CONFIG.extensions.has(path.extname(target)) ? [target] : [];
  }

  const out = [];
  const entries = fs.readdirSync(target, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (!CONFIG.excludedDirs.has(entry.name)) out.push(...listFiles(full));
    } else if (CONFIG.extensions.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function candidateFiles(root) {
  const src = path.join(root, 'src');
  const targets = [
    path.join(src, 'scenes'),
    path.join(src, 'components'),
  ];

  if (exists(src)) {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (entry.isFile() && /^Chapter.*\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        targets.push(path.join(src, entry.name));
      }
    }
    targets.push(path.join(src, 'FullVideo.tsx'));
  }

  const files = new Set();
  for (const target of targets) {
    for (const file of listFiles(target)) files.add(file);
  }
  return [...files].sort();
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function lineText(lines, line) {
  return lines[line - 1] ?? '';
}

function findMatchingParen(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '(') depth += 1;
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function checkFontSizes(file, text, lines) {
  const patterns = [
    /fontSize\s*:\s*(\d+(?:\.\d+)?)/g,
    /fontSize\s*:\s*['"](\d+(?:\.\d+)?)px['"]/g,
    /fontSize\s*=\s*{\s*(\d+(?:\.\d+)?)\s*}/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const size = Number(match[1]);
      if (size > 0 && size < CONFIG.minFontSize) {
        const line = lineOf(text, match.index);
        add('error', file, line, 'font-size-min', `fontSize ${size} is below ${CONFIG.minFontSize}px.`, lineText(lines, line));
      }
    }
  }
}

function checkInterpolateClamp(file, text, lines) {
  const pattern = /\binterpolate\s*\(/g;
  for (const match of text.matchAll(pattern)) {
    const open = text.indexOf('(', match.index);
    const close = findMatchingParen(text, open);
    if (close === -1) continue;
    const call = text.slice(match.index, close + 1);
    const hasLeft = /extrapolateLeft\s*:\s*['"]clamp['"]/.test(call);
    const hasRight = /extrapolateRight\s*:\s*['"]clamp['"]/.test(call);
    if (!hasLeft || !hasRight) {
      const line = lineOf(text, match.index);
      add('error', file, line, 'interpolate-clamp', 'interpolate() should include extrapolateLeft and extrapolateRight set to clamp.', lineText(lines, line));
    }
  }
}

function checkForbiddenRuntime(file, text, lines) {
  const checks = [
    { pattern: /\bDate\.now\s*\(/g, rule: 'no-date-now', message: 'Date.now() breaks deterministic rendering.' },
    { pattern: /\bMath\.random\s*\(/g, rule: 'no-math-random', message: 'Math.random() breaks deterministic rendering.' },
    { pattern: /var\(\s*--c-surface\s*\)/g, rule: 'no-card-surface', message: 'Do not use --c-surface as a card background; use --c-card-* variables.' },
    { pattern: /--c-card-featured-/g, rule: 'no-featured-token', message: 'Use --c-card-feature-* tokens, not --c-card-featured-*.' },
  ];

  for (const check of checks) {
    for (const match of text.matchAll(check.pattern)) {
      const line = lineOf(text, match.index);
      add('error', file, line, check.rule, check.message, lineText(lines, line));
    }
  }
}

function checkHardCodedColors(file, text, lines) {
  const patterns = [
    { pattern: /#[0-9a-fA-F]{3,8}\b/g, name: 'hex' },
    { pattern: /\brgba?\s*\(/g, name: 'rgb/rgba' },
    { pattern: /\bhsla?\s*\(/g, name: 'hsl/hsla' },
  ];

  for (const { pattern, name } of patterns) {
    for (const match of text.matchAll(pattern)) {
      const line = lineOf(text, match.index);
      const snippet = lineText(lines, line);
      if (/allow-hardcoded-color|lint-ignore-color/.test(snippet)) continue;
      add('warning', file, line, 'hard-coded-color', `Hard-coded ${name} color found; prefer tokens.css variables.`, snippet);
    }
  }
}

function checkEmoji(file, text, lines) {
  const emojiPattern = /\p{Emoji_Presentation}/gu;
  for (const match of text.matchAll(emojiPattern)) {
    const line = lineOf(text, match.index);
    const snippet = lineText(lines, line);
    if (/allow-emoji|lint-ignore-emoji/.test(snippet)) continue;
    add('warning', file, line, 'no-emoji-icons', 'Emoji detected; do not use emoji as icons in the visual system.', snippet);
  }
}

function checkPositionSafety(file, text, lines) {
  const numericStyle = /\b(top|y)\s*:\s*(\d+(?:\.\d+)?)/g;
  for (const match of text.matchAll(numericStyle)) {
    const value = Number(match[2]);
    if (value >= CONFIG.subtitleSafeY) {
      const line = lineOf(text, match.index);
      add('error', file, line, 'subtitle-safe-y', `${match[1]}:${value} is at or below subtitle safety boundary y=${CONFIG.subtitleSafeY}.`, lineText(lines, line));
    } else if (value >= CONFIG.subtitleSafeY - 70) {
      const line = lineOf(text, match.index);
      add('warning', file, line, 'subtitle-safe-y-near', `${match[1]}:${value} is close to subtitle safety boundary y=${CONFIG.subtitleSafeY}.`, lineText(lines, line));
    }
  }

  const bottomPattern = /\bbottom\s*:\s*(\d+(?:\.\d+)?)/g;
  for (const match of text.matchAll(bottomPattern)) {
    const value = Number(match[1]);
    if (value < CONFIG.minBottomSpace && !/Subtitle|caption/i.test(file)) {
      const line = lineOf(text, match.index);
      add('warning', file, line, 'subtitle-bottom-space', `bottom:${value} may leave less than ${CONFIG.minBottomSpace}px for subtitles.`, lineText(lines, line));
    }
  }
}

function checkCardPatterns(file, text, lines) {
  const oatPattern = /c-card-oat-bg/g;
  for (const match of text.matchAll(oatPattern)) {
    const start = Math.max(0, match.index - 450);
    const end = Math.min(text.length, match.index + 900);
    const block = text.slice(start, end);
    if (/\bborder\s*:/.test(block) || /\bboxShadow\s*:/.test(block)) {
      const line = lineOf(text, match.index);
      add('error', file, line, 'oat-card-clean', 'Oat cards should not use border or boxShadow.', lineText(lines, line));
    }
  }

  const featureCount = [...text.matchAll(/c-card-feature-bg/g)].length;
  if (featureCount > CONFIG.maxFeatureCardsPerFile) {
    add('warning', file, 1, 'feature-card-overuse', `Found ${featureCount} Feature dark cards in one file; keep each chapter to at most ${CONFIG.maxFeatureCardsPerFile}.`);
  }
}

function checkCodeBlockColor(file, text, lines) {
  // Code content blocks (with font-mono + terminal-bg) must have a color property
  // Skip outer wrapper divs (they only have background + borderRadius, no fontFamily)
  const terminalBgPattern = /c-terminal-bg/g;
  for (const match of text.matchAll(terminalBgPattern)) {
    const line = lineOf(text, match.index);
    // Find the style block containing this match
    let styleStart = line;
    let styleEnd = line;
    for (let i = line; i >= 0; i--) {
      if (lines[i] && lines[i].includes('{')) { styleStart = i; break; }
    }
    for (let i = line; i < lines.length; i++) {
      if (lines[i] && lines[i].includes('}')) { styleEnd = i; break; }
    }
    // Only check blocks that have fontFamily (code content areas, not outer wrappers)
    let hasFontFamily = false;
    for (let i = styleStart; i <= styleEnd; i++) {
      if (lines[i] && /fontFamily/.test(lines[i])) {
        hasFontFamily = true;
        break;
      }
    }
    if (!hasFontFamily) continue; // Skip outer wrapper
    // Check if any line in this style block has a color property
    let hasColor = false;
    for (let i = styleStart; i <= styleEnd; i++) {
      if (lines[i] && /color\s*:/.test(lines[i])) {
        hasColor = true;
        break;
      }
    }
    if (!hasColor) {
      add('error', file, line, 'code-block-color',
        'Code block with terminal background is missing a color property. Non-highlighted text will be invisible.',
        lineText(lines, line));
    }
  }
}

function checkText(text, file) {
  const clean = stripComments(text);
  const lines = text.split(/\r?\n/);

  checkFontSizes(file, clean, lines);
  checkInterpolateClamp(file, clean, lines);
  checkForbiddenRuntime(file, clean, lines);
  checkHardCodedColors(file, clean, lines);
  checkEmoji(file, clean, lines);
  checkPositionSafety(file, clean, lines);
  checkCardPatterns(file, clean, lines);
  checkCodeBlockColor(file, clean, lines);
}

const files = candidateFiles(projectRoot);

if (files.length === 0) {
  results.push({
    severity: 'warning',
    file: '.',
    line: 1,
    rule: 'no-files',
    message: 'No Remotion scene/component files found. Run from a project root or pass one explicitly.',
    snippet: '',
  });
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  checkText(text, file);
}

const errors = results.filter((item) => item.severity === 'error').length;
const warnings = results.filter((item) => item.severity === 'warning').length;

if (json) {
  console.log(JSON.stringify({ projectRoot, filesScanned: files.length, errors, warnings, results }, null, 2));
} else {
  console.log(`Remotion scene lint: ${files.length} file(s), ${errors} error(s), ${warnings} warning(s)`);
  for (const item of results) {
    const loc = `${item.file}:${item.line}`;
    console.log(`\n[${item.severity.toUpperCase()}] ${item.rule} ${loc}`);
    console.log(`  ${item.message}`);
    if (item.snippet) console.log(`  ${item.snippet}`);
  }
}

process.exit(errors > 0 && !warnOnly ? 1 : 0);
