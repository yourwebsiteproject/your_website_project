#!/usr/bin/env ts-node
// ============================================================
//  publish.ts — upload rendered video to all 3 platforms
//
//  Usage:
//    ts-node automation/publish.ts <day_number>
//
//  Env vars required:
//    YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
//    TIKTOK_ACCESS_TOKEN
//    INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID
//    WEBSITE_URL
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { execSync } from 'child_process';

const DAY = parseInt(process.argv[2] ?? '', 10);
if (!DAY) { console.error('Usage: ts-node publish.ts <day_number>'); process.exit(1); }

const DAY_PAD  = String(DAY).padStart(3, '0');
const ROOT     = path.join(__dirname, '..');
const VIDEO    = path.join(ROOT, `video/output/day${DAY_PAD}.mp4`);
const DAY_FILE = path.join(ROOT, `content/days/day${DAY_PAD}.json`);

if (!fs.existsSync(VIDEO))    { console.error(`❌ Video not found: ${VIDEO}`); process.exit(1); }
if (!fs.existsSync(DAY_FILE)) { console.error(`❌ Day file not found: ${DAY_FILE}`); process.exit(1); }

const props = JSON.parse(fs.readFileSync(DAY_FILE, 'utf8'));
const WEBSITE_URL = process.env.WEBSITE_URL ?? props.websiteUrl ?? 'yourwebsite.com';

// ---- Caption template ----
function buildCaption(nextHint: string): string {
  return [
    `Day ${DAY}/100 🔨 Building: ${props.featureName}`,
    ``,
    `You voted for this → I built it in ${props.buildTime}`,
    ``,
    `🌐 Try it live: ${WEBSITE_URL}`,
    ``,
    `Day ${DAY + 1} teaser: ${nextHint}`,
    `Drop your feature request ⬇️ — most liked comment in 24h wins`,
    ``,
    `#100DayChallenge #buildinpublic #webdev #coding #100days #shorts`,
  ].join('\n');
}

const caption = buildCaption(props.nextFeatureHint ?? '???');
const title   = `Day ${DAY}/100 — ${props.featureName} #shorts`;

// ============================================================
//  YouTube Shorts upload
// ============================================================
async function uploadYouTube(): Promise<string | null> {
  const clientId     = process.env.YOUTUBE_CLIENT_ID ?? '';
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET ?? '';
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN ?? '';

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('⚠️  YouTube env vars missing — skipping YouTube upload');
    return null;
  }

  // 1. Get access token
  const tokenData = await postJson('https://oauth2.googleapis.com/token', {
    client_id:     clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type:    'refresh_token',
  });
  const accessToken: string = tokenData.access_token;

  // 2. Initiate resumable upload
  const fileSize = fs.statSync(VIDEO).size;
  const initRes = await postJsonRaw(
    `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
    {
      snippet: { title, description: caption, tags: ['100days','webdev','buildinpublic','shorts'], categoryId: '28' },
      status:  { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    },
    { Authorization: `Bearer ${accessToken}`, 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(fileSize) }
  );

  const uploadUrl: string = initRes.headers?.location ?? '';
  if (!uploadUrl) { console.error('❌ YouTube: No upload URL received'); return null; }

  // 3. Upload file
  console.log('📤 Uploading to YouTube...');
  const result = await uploadFile(uploadUrl, VIDEO, 'video/mp4');
  const videoId: string = result?.id ?? '';
  console.log(`✅ YouTube: https://www.youtube.com/shorts/${videoId}`);
  return videoId;
}

// ============================================================
//  TikTok upload (Content Posting API v2)
// ============================================================
async function uploadTikTok(): Promise<void> {
  const token = process.env.TIKTOK_ACCESS_TOKEN ?? '';
  if (!token) { console.warn('⚠️  TIKTOK_ACCESS_TOKEN missing — skipping TikTok'); return; }

  const fileSize = fs.statSync(VIDEO).size;

  // 1. Init upload
  const init = await postJson(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      post_info: { title: caption.slice(0, 2200), privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
      source_info: { source: 'FILE_UPLOAD', video_size: fileSize, chunk_size: fileSize, total_chunk_count: 1 },
    },
    { Authorization: `Bearer ${token}` }
  );

  const publishId: string   = init.data?.publish_id ?? '';
  const uploadUrl: string   = init.data?.upload_url ?? '';
  if (!uploadUrl) { console.error('❌ TikTok: No upload URL'); return; }

  // 2. Upload
  console.log('📤 Uploading to TikTok...');
  await uploadFile(uploadUrl, VIDEO, 'video/mp4', { 'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}` });
  console.log(`✅ TikTok: publish_id=${publishId} (processing — check TikTok Studio)`);
}

// ============================================================
//  Instagram Reels upload (Graph API)
// ============================================================
async function uploadInstagram(): Promise<void> {
  const token     = process.env.INSTAGRAM_ACCESS_TOKEN ?? '';
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID ?? '';
  if (!token || !accountId) { console.warn('⚠️  Instagram env vars missing — skipping Instagram'); return; }

  // Instagram requires a public video URL — upload to a temp host or use Cloudinary
  const videoUrl = process.env.INSTAGRAM_VIDEO_URL ?? '';
  if (!videoUrl) {
    console.warn('⚠️  INSTAGRAM_VIDEO_URL not set. Upload video/output/day${DAY_PAD}.mp4 to a CDN and set this var.');
    return;
  }

  console.log('📤 Creating Instagram Reel container...');
  const container = await postJson(
    `https://graph.facebook.com/v19.0/${accountId}/media`,
    { video_url: videoUrl, media_type: 'REELS', caption: caption.slice(0, 2200), share_to_feed: true },
    { Authorization: `Bearer ${token}` }
  );

  const creationId: string = container.id ?? '';
  if (!creationId) { console.error('❌ Instagram: No creation ID'); return; }

  // Poll until ready
  console.log('⏳ Waiting for Instagram to process...');
  await sleep(20000);

  // Publish
  const publish = await postJson(
    `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
    { creation_id: creationId },
    { Authorization: `Bearer ${token}` }
  );

  console.log(`✅ Instagram Reel published: media_id=${publish.id}`);
}

// ============================================================
//  Main
// ============================================================
async function main() {
  console.log(`\n🚀 Publishing Day ${DAY}/100 — "${props.featureName}"`);
  console.log(`   Video: ${VIDEO}\n`);

  await uploadYouTube();
  await uploadTikTok();
  await uploadInstagram();

  // Mark published in day file
  props.publishedAt = new Date().toISOString();
  fs.writeFileSync(DAY_FILE, JSON.stringify(props, null, 2));

  console.log(`\n🎉 Done! Day ${DAY} published to all platforms.`);
}

main().catch((err) => { console.error(err); process.exit(1); });

// ============================================================
//  HTTP helpers
// ============================================================
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function postJson(url: string, body: object, headers: Record<string,string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u    = new URL(url);
    const opts = {
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    };
    const req = (u.protocol === 'https:' ? https : http).request(opts, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

function postJsonRaw(url: string, body: object, headers: Record<string,string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u    = new URL(url);
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

function uploadFile(url: string, filePath: string, mimeType: string, extraHeaders: Record<string,string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: 443,
      path: u.pathname + u.search, method: 'PUT',
      headers: { 'Content-Type': mimeType, 'Content-Length': fileSize, ...extraHeaders },
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    fs.createReadStream(filePath).pipe(req);
  });
}
