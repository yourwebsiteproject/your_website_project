#!/usr/bin/env ts-node
// ============================================================
//  pick-winner.ts — fetch most-liked comment from YouTube
//  (Instagram and TikTok are manual — APIs are too restricted)
//
//  Usage:
//    ts-node automation/pick-winner.ts <day_number> <youtube_video_id>
//
//  Env vars required:
//    YOUTUBE_API_KEY
//
//  Output:
//    Writes winning feature to content/days/dayXXX.json
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const DAY = parseInt(process.argv[2] ?? '', 10);
const VIDEO_ID = process.argv[3] ?? '';

if (!DAY || !VIDEO_ID) {
  console.error('Usage: ts-node pick-winner.ts <day_number> <youtube_video_id>');
  process.exit(1);
}

const API_KEY = process.env.YOUTUBE_API_KEY ?? '';
if (!API_KEY) {
  console.error('❌ Set YOUTUBE_API_KEY env var');
  process.exit(1);
}

interface Comment {
  text: string;
  likeCount: number;
  author: string;
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function pickWinner() {
  const url =
    `https://www.googleapis.com/youtube/v3/commentThreads` +
    `?part=snippet&videoId=${VIDEO_ID}&maxResults=100` +
    `&order=relevance&key=${API_KEY}`;

  console.log(`🔍 Fetching comments for video ${VIDEO_ID}...`);
  const data = await fetchJson(url);

  if (!data.items?.length) {
    console.error('❌ No comments found.');
    process.exit(1);
  }

  const comments: Comment[] = data.items.map((item: any) => ({
    text:      item.snippet.topLevelComment.snippet.textDisplay,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
    author:    item.snippet.topLevelComment.snippet.authorDisplayName,
  }));

  comments.sort((a, b) => b.likeCount - a.likeCount);
  const winner = comments[0];

  console.log(`\n🏆 WINNER (${winner.likeCount} likes):`);
  console.log(`   "${winner.text}" — @${winner.author}`);
  console.log(`\nTop 5 comments:`);
  comments.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. [${c.likeCount} likes] "${c.text.slice(0, 80)}"`);
  });

  // Load existing day file or create new one
  const DAY_PAD = String(DAY).padStart(3, '0');
  const NEXT_PAD = String(DAY + 1).padStart(3, '0');
  const outPath = path.join(__dirname, `../content/days/day${NEXT_PAD}.json`);

  const dayData = {
    day: DAY + 1,
    featureName: winner.text.slice(0, 120).replace(/<[^>]*>/g, ''),
    voteCount: winner.likeCount,
    votedBy: winner.author,
    sourceVideo: VIDEO_ID,
    buildTime: '',
    hookLine: '',
    nextFeatureHint: '',
    websiteUrl: process.env.WEBSITE_URL ?? 'yourwebsite.com',
    timelapsePath: `day${NEXT_PAD}_timelapse.mp4`,
    demoPath: `day${NEXT_PAD}_demo.mp4`,
    yesterdayPath: `day${DAY_PAD}_demo.mp4`,
    publishedAt: null,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(dayData, null, 2));

  console.log(`\n✅ Saved to ${outPath}`);
  console.log(`   Edit hookLine and nextFeatureHint before rendering.`);
}

pickWinner().catch((err) => { console.error(err); process.exit(1); });
