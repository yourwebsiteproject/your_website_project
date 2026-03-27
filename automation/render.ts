#!/usr/bin/env ts-node
// ============================================================
//  render.ts — render DailyVideo via Remotion CLI
//
//  Usage:
//    ts-node automation/render.ts <day_number>
//
//  Reads:  content/days/dayXXX.json
//  Copies: video recordings to video/remotion/public/
//  Output: video/output/dayXXX.mp4
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DAY = parseInt(process.argv[2] ?? '', 10);
if (!DAY) { console.error('Usage: ts-node render.ts <day_number>'); process.exit(1); }

const DAY_PAD = String(DAY).padStart(3, '0');
const ROOT    = path.join(__dirname, '..');
const DAYS    = path.join(ROOT, 'content/days');
const REC     = path.join(ROOT, 'video/recordings');
const PUBLIC  = path.join(ROOT, 'video/remotion/public');
const OUTPUT  = path.join(ROOT, 'video/output');

const dayFile = path.join(DAYS, `day${DAY_PAD}.json`);
if (!fs.existsSync(dayFile)) {
  console.error(`❌ Day file not found: ${dayFile}`);
  console.error(`   Run pick-winner.ts first, then fill in hookLine + nextFeatureHint.`);
  process.exit(1);
}

const props = JSON.parse(fs.readFileSync(dayFile, 'utf8'));

// Validate required fields
const required = ['featureName','hookLine','nextFeatureHint','buildTime'];
const missing = required.filter(k => !props[k]);
if (missing.length) {
  console.error(`❌ Missing fields in ${dayFile}: ${missing.join(', ')}`);
  process.exit(1);
}

// Copy video assets to Remotion public folder
fs.mkdirSync(PUBLIC, { recursive: true });
fs.mkdirSync(OUTPUT, { recursive: true });

const assets = [
  { src: path.join(REC, `day${DAY_PAD}_timelapse.mp4`), dest: path.join(PUBLIC, 'timelapse.mp4') },
  { src: path.join(REC, `day${DAY_PAD}_demo.mp4`),      dest: path.join(PUBLIC, 'demo.mp4') },
  { src: path.join(REC, props.yesterdayPath),            dest: path.join(PUBLIC, 'yesterday.mp4') },
];

for (const { src, dest } of assets) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`📁 Copied: ${path.basename(src)}`);
  } else {
    console.warn(`⚠️  Asset not found (skipping): ${src}`);
  }
}

// Build Remotion props JSON
const remotionProps = {
  day:             props.day,
  featureName:     props.featureName,
  buildTime:       props.buildTime,
  hookLine:        props.hookLine,
  voteCount:       props.voteCount ?? 0,
  nextFeatureHint: props.nextFeatureHint,
  websiteUrl:      props.websiteUrl ?? 'yourwebsite.com',
  timelapsePath:   'timelapse.mp4',
  demoPath:        'demo.mp4',
  yesterdayPath:   'yesterday.mp4',
};

const propsJson = JSON.stringify(remotionProps);
const outFile   = path.join(OUTPUT, `day${DAY_PAD}.mp4`);

console.log(`\n🎬 Rendering Day ${DAY} video...`);
console.log(`   Feature: ${props.featureName}`);

const cmd = [
  'npx remotion render DailyVideo',
  `--props='${propsJson}'`,
  `--output="${outFile}"`,
  '--log=verbose',
].join(' ');

execSync(cmd, {
  cwd: path.join(ROOT, 'video/remotion'),
  stdio: 'inherit',
});

console.log(`\n✅ Video rendered: ${outFile}`);
console.log(`   Run: ts-node automation/publish.ts ${DAY}`);
