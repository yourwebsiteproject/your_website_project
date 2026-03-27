# Step-by-Step Guide — your_website_project

---

## PART 1: ONE-TIME SETUP (do this before Day 0)

### Step 1 — Install tools
```bash
brew install ffmpeg obs obs-cmd node
```
- Open OBS → Tools → WebSocket Server Settings → Enable, set password, port 4455
- Save your OBS WebSocket password somewhere safe

### Step 2 — Create the website repo on GitHub
1. Go to GitHub → New repository → name it `your_website_project` → Public
2. Clone it locally:
   ```bash
   git clone https://github.com/yourwebsiteproject/your_website_project.git
   ```
3. Copy all files from this project into it
4. Push:
   ```bash
   git add . && git commit -m "Init" && git push
   ```

### Step 3 — Deploy the website
**Option A — GitHub Pages (free, easiest):**
1. GitHub repo → Settings → Pages → Source: Deploy from branch → `main` → `/website`
2. Your site goes live at `https://YOURNAME.github.io/your_website_project`

**Option B — Netlify (more control):**
1. netlify.com → New site → Connect GitHub repo → Publish directory: `website`

### Step 4 — Set up social accounts
| Platform | Action |
|---|---|
| YouTube | Create channel → Studio → go to Shorts tab to confirm it's enabled |
| TikTok | Create account → apply for Content Posting API at developers.tiktok.com |
| Instagram | Convert to Professional/Business account → set up a Facebook App at developers.facebook.com |

### Step 5 — Get API credentials

**YouTube:**
1. console.cloud.google.com → New project → Enable "YouTube Data API v3"
2. Credentials → OAuth 2.0 Client ID → Desktop app
3. Use the OAuth Playground to get a refresh token with scope `youtube.upload`
4. Save: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`

**TikTok:**
1. developers.tiktok.com → Create app → Request "Content Posting API" access
2. Save: `TIKTOK_ACCESS_TOKEN`

**Instagram:**
1. developers.facebook.com → New App → Add Instagram Graph API
2. Get a long-lived access token for your Instagram Business account
3. Save: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`

### Step 6 — Add GitHub Secrets
GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these:
```
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN
TIKTOK_ACCESS_TOKEN
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_ACCOUNT_ID
WEBSITE_URL          ← your live site URL
```

### Step 7 — Install Remotion dependencies
```bash
cd video/remotion
npm install
```
Test render (will use placeholder videos):
```bash
cd video/remotion
npx remotion render DailyVideo --props='{"day":0,"featureName":"Test","hookLine":"Test","voteCount":0,"nextFeatureHint":"TBD","buildTime":"1h","websiteUrl":"test.com","timelapsePath":"timelapse.mp4","demoPath":"demo.mp4","yesterdayPath":"yesterday.mp4"}'
```

### Step 8 — Install automation dependencies
```bash
cd automation
npm install
```

### Step 9 — OBS scene setup
1. Open OBS → Scenes → New scene: `daily_build`
2. Add source: Screen Capture (your code editor window)
3. Output → Settings → Recording → Resolution: **1920×1080** (we crop to vertical in Remotion)
4. Start/stop will be handled by `record.sh`

### Step 10 — Set up background music
1. Download a royalty-free track (~120 BPM, upbeat, loopable) from Pixabay or Epidemic Sound
2. Save as `video/assets/background.mp3`
3. (Optional) Add it to the Remotion template in `video/remotion/src/DailyVideo.tsx` using `<Audio src={staticFile('background.mp3')} />`

---

## PART 2: DAY 0 LAUNCH (do this once)

### Goal: post the banger opener with NO context. Just funny.

1. **Build the feature** — the website already has the Day 0 feature built (passive-aggressive form + rage mode + cursor trail + Konami code). Open `website/index.html` in a browser and confirm it works.

2. **Record the build session** (fake it for Day 0 if needed — just screen-record yourself tweaking the code):
   ```bash
   ./automation/build.sh start 0
   # ... do stuff on screen ...
   ./automation/build.sh stop
   # or: ./automation/build.sh full 0
   ```

3. **Record the demo** — screen-record yourself demoing the live site for ~30 seconds. Save as:
   ```
   video/recordings/day000_demo.mp4
   ```

4. **Fill in the day file** — edit `content/days/day000.json`:
   ```json
   {
     "hookLine": "I made a form that will personally insult you.",
     "buildTime": "2 hours",
     "nextFeatureHint": "Drop your Day 1 request below 👇"
   }
   ```

5. **Render the video:**
   ```bash
   ts-node automation/render.ts 0
   ```
   Output: `video/output/day000.mp4`

6. **Upload manually for Day 0** (APIs may not be ready yet):
   - Open YouTube Studio → Upload → select `day000.mp4` → mark as Short
   - Copy the caption from `automation/publish.ts` → paste into description
   - End the caption with: "Drop your Day 1 feature request below ⬇️ — most liked comment in 24h wins"
   - Same for TikTok and Instagram

7. **Seed the comments** — post 5–10 feature request suggestions yourself as comments, so new viewers have something to like. Examples:
   - "Dark mode toggle"
   - "Confetti button that does nothing"
   - "Live visitor counter"
   - "Typewriter text effect"
   - "Cookie consent banner that argues with you"

---

## PART 3: DAILY ROUTINE (repeat every day)

**Total time commitment: ~2–3 hours per day**

---

### Morning (~15 min)

**① Pick the winning feature**
```bash
ts-node automation/pick-winner.ts <YESTERDAY_DAY> <YOUTUBE_VIDEO_ID>
```
This auto-fetches the most-liked comment from yesterday's YouTube video and creates `content/days/dayXXX.json`.

If YouTube API isn't ready yet — check comments manually and write the feature name into the JSON file yourself.

**② Fill in the day file**
Open `content/days/dayXXX.json` and fill in the 2 missing fields:
```json
"hookLine": "This one broke the site for 10 minutes.",
"nextFeatureHint": "Tomorrow: something nobody asked for but everyone needs."
```

---

### Build session (~1–2 hours)

**③ Start recording**
```bash
./automation/build.sh start <DAY_NUMBER>
```

**④ Build the feature**
Edit `website/index.html`, `website/style.css`, `website/script.js`. Add the feature. Keep it real — bugs and frustration are content.

**⑤ Push the feature live**
```bash
git add website/ && git commit -m "Day XX: <feature name>" && git push
```
GitHub Pages / Netlify auto-deploys.

---

### After coding (~30 min)

**⑥ Stop recording + generate timelapse**
```bash
./automation/build.sh full <DAY_NUMBER>
```
This stops OBS and runs ffmpeg automatically.

**⑦ Record the demo**
Screen-record yourself using the new feature on the live website for ~30 seconds.
Save as: `video/recordings/dayXXX_demo.mp4`

Also use yesterday's demo as `yesterdayPath` — already set in the JSON.

**⑧ Render the video**
```bash
ts-node automation/render.ts <DAY_NUMBER>
```
Takes ~5–10 min. Output: `video/output/dayXXX.mp4`

**⑨ Trigger publish** (or let GitHub Actions do it at 9 AM)

Manual:
```bash
ts-node automation/publish.ts <DAY_NUMBER>
```

Or just push the rendered video to the repo and let the cron job fire at 9 AM UTC.

---

### After posting (~5 min)

**⑩ Pin a comment** on each platform:
```
🔗 Try the feature: [your website URL]
👇 Drop your Day X+1 request below — most liked in 24h wins
```

**⑪ Engage for 15 min** — reply to a few comments, like requests, stir controversy if needed. The algorithm rewards early engagement velocity.

---

## Quick Reference — Commands

| Task | Command |
|---|---|
| Start recording | `./automation/build.sh start <day>` |
| Stop + timelapse | `./automation/build.sh full <day>` |
| Pick comment winner | `ts-node automation/pick-winner.ts <day> <youtube_id>` |
| Render video | `ts-node automation/render.ts <day>` |
| Publish manually | `ts-node automation/publish.ts <day>` |
| Deploy website | `git push` (auto-deploys) |

## Quick Reference — File locations

| File | Purpose |
|---|---|
| `website/index.html` | The product — add features here |
| `content/days/dayXXX.json` | Fill in daily before rendering |
| `video/recordings/dayXXX_demo.mp4` | Record this manually each day |
| `video/output/dayXXX.mp4` | Final rendered video for upload |
