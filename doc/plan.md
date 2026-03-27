# Plan: your_website_project — 100-Day Social Media Experiment

## Context
A 100-day challenge series where the most-requested feature is built and shipped to a real website each day. No face, no voice. Automated production pipeline. Posted daily to YouTube Shorts, TikTok, and Instagram Reels. Goal: compound virality through consistency, recognizable format, and community ownership of the roadmap.

---

## 1. Core Concept & Hook

**Premise:** "I'm building the most-requested feature every day for 100 days. You vote (by liking comments). I build. Day [X]/100."

**Virality levers:**
- Community has skin in the game (they liked a comment → they return to see the result)
- Daily streak creates FOMO — miss a day, miss the build
- Clear progress counter creates completion anxiety ("only 23 days left")
- The website itself is the product AND the content — shareable proof
- **Explosive hooks:** lead with a shocking outcome ("I broke the site on Day 47"), a before/after split screen, or an unexpected result ("nobody voted for this but I built it anyway")
- **Controversy bait:** tease a feature that divides opinion — "Dark mode vs light mode — FIGHT IN THE COMMENTS"
- **Cliffhanger endings:** "Tomorrow I'm adding [controversial feature]. You've been warned."
- **Underdog narrative:** "This feature got 2 votes. But it was insane to build."
- **Failure content:** when something breaks badly, keep it in — "I spent 6 hours on this and it's still broken"

---

## 2. Video Format (Repeating Template — Series Recognition)

Every video follows the **exact same structure** (~57 sec):

```
[0–3s]   EXPLOSIVE HOOK — shocking one-liner text overlay: "I built this in 47 mins" / "This one broke everything"
[3–12s]  YESTERDAY'S RESULT — 8-9s screen recording showing the shipped feature in action (enough to feel real)
[12–17s] VOTE REVEAL — animated bar chart: "Top comment got 847 likes: [Feature]"
[17–35s] SPEED BUILD — time-lapse coding (no face, no voice — keyboard + screen only)
[35–43s] LIVE DEMO — screen capture of the feature live on the real site
[43–52s] CLIFFHANGER CTA — "Day X+1: I'm adding [next thing]. Drop your feature request ⬇️ — most liked comment wins"
[52–57s] OUTRO — logo + website URL + "Follow for Day X+1"
```

**Consistency signals (series recognition):**
- Fixed color palette: `#0f0f0f` / `#00ff88` / `#ff3c78`
- Same background music loop (royalty-free, upbeat, ~120 BPM)
- Same font for all text overlays (Courier New)
- Same animated counter in top-right corner
- Same transition style between sections

---

## 3. Automation Pipeline

### A. Feature Request & Voting (Comment Likes = Votes)
- **No separate voting system.** The vote happens natively in comments on each platform.
- End card on every video: "Drop your feature request below — most liked comment in 24h wins"
- Each day: manually check which comment has the most likes → that's Day X+1's feature
- Script `pick-winner.ts` can use platform APIs to auto-fetch top comment by like count
  - YouTube: YouTube Data API v3 → `commentThreads.list` sorted by `likeCount`
  - TikTok: TikTok Research API (or manual — API access is restricted)
  - Instagram: Instagram Graph API → `media/{id}/comments`
- Winner comment is saved to `content/days/dayXX.json` → feeds into video render pipeline

### B. Screen Recording (Partially Automated)
- **OBS automated** via its built-in WebSocket server (`obs-websocket`):
  - Script: `automation/record.sh start` → starts OBS, begins recording
  - Script: `automation/record.sh stop dayXX` → stops OBS, saves as `recordings/dayXX_raw.mp4`
- **ffmpeg time-lapse** runs automatically afterward:
  - `automation/timelapse.sh dayXX` → `ffmpeg -i dayXX_raw.mp4 -vf "setpts=0.05*PTS" -an dayXX_timelapse.mp4`
- Full flow: `./automation/build.sh start 42` → code → `./automation/build.sh full 42`

### C. Video Assembly (Automated)
- **Tool:** [Remotion](https://www.remotion.dev/) (React-based programmatic video)
- Template: `video/remotion/src/DailyVideo.tsx` — accepts props: `{ day, featureName, hookLine, voteData, timelapsePath, demoPath }`
- Renders final 1080×1920 MP4 automatically
- Run: `ts-node automation/render.ts <day>`

### D. Publishing (Automated)
- **YouTube Shorts:** YouTube Data API v3 → resumable upload
- **TikTok:** TikTok Content Posting API v2
- **Instagram Reels:** Instagram Graph API via Facebook app
- Orchestrator: **GitHub Actions** cron at 9:00 AM UTC daily
- Single script: `automation/publish.ts` reads day JSON + uploads to all 3 platforms

### E. Caption Template (Auto-generated)
```
Day {X}/100 🔨 Building: {FeatureName}

You voted for this → I built it in {buildTime}

🌐 Try it live: {websiteURL}

Day {X+1} teaser: {nextFeatureHint}
Drop your feature request ⬇️ — most liked comment in 24h wins

#100DayChallenge #buildinpublic #webdev #coding #100days #shorts
```

---

## 4. Tech Stack

| Layer | Tool |
|---|---|
| Website | **1x `index.html` + 1x `style.css` + 1x `script.js`** — hosted on GitHub Pages or Netlify |
| Voting | Native comment likes on YouTube/TikTok/Instagram — no separate system |
| Video template | Remotion (React → MP4) |
| Screen recording | OBS + obs-websocket + ffmpeg (scripted) |
| Automation | **GitHub Actions** — all scheduling and orchestration |
| Publishing | YouTube Data API v3 + TikTok Content API + Instagram Graph API |
| Scheduling | **GitHub Actions cron** (free, reliable) |
| Assets | Canva for static overlays, exported as PNG layers |

---

## 5. Virality Mechanics

| Mechanic | Implementation |
|---|---|
| **Community ownership** | Comment likes drive the roadmap — viewers become invested |
| **Daily FOMO** | "You only have 24h to vote" on every video |
| **Progress counter** | Day X/100 creates completion pull |
| **Live product** | Real website they can actually use — shareable proof |
| **Duet/Stitch bait** | End card: "React if you've ever needed this feature" |
| **Cross-platform consistency** | Same video, same day, same format — algorithmic trust |
| **Pinned comment strategy** | Pin voting link in comments on every platform |
| **Milestone hooks** | Day 10, 25, 50, 75, 100 get "special" extended videos |

---

## 6. Day-by-Day Workflow (Repeatable Loop)

```
Morning:
  1. Run pick-winner.ts → auto-fetch top liked comment from yesterday's video
  2. Fill in hookLine + nextFeatureHint in content/days/dayXXX.json
  3. ./automation/build.sh start <day>  → OBS starts recording

Coding session (1–2 hours):
  4. Build the feature in website/

After coding:
  5. ./automation/build.sh full <day>  → stop OBS + generate timelapse
  6. Screen-record a 30s demo → save as video/recordings/dayXXX_demo.mp4
  7. ts-node automation/render.ts <day>  → Remotion renders final MP4

Evening (automated via GitHub Actions at 9 AM UTC):
  8. publish.ts → uploads to YouTube Shorts, TikTok, Instagram
  9. Day file marked publishedAt, committed back to repo
```

---

## 7. Project Structure

```
the_website_project/
├── doc/
│   └── plan.md               # This file
├── website/
│   ├── index.html            # The actual product (plain HTML)
│   ├── style.css
│   └── script.js
├── video/
│   ├── remotion/             # Remotion video template
│   │   └── src/DailyVideo.tsx
│   ├── assets/               # Music, fonts, logo overlays
│   ├── recordings/           # Raw OBS + timelapse files (gitignored)
│   └── output/               # Rendered final MP4s (gitignored)
├── automation/
│   ├── build.sh              # One-command session wrapper
│   ├── record.sh             # OBS start/stop via obs-websocket
│   ├── timelapse.sh          # ffmpeg 20x compression
│   ├── render.ts             # Remotion render trigger
│   ├── pick-winner.ts        # Fetch top YouTube comment by likes
│   └── publish.ts            # Upload to all 3 platforms
├── .github/
│   └── workflows/
│       └── daily-publish.yml # 9 AM UTC cron publish job
└── content/
    └── days/
        └── day000.json       # Per-day metadata (one file per day)
```

---

## 8. Pre-Launch Checklist (Before Day 1)

- [ ] Website live (`index.html` + `style.css` + `script.js`) on GitHub Pages or Netlify
- [ ] First 5–10 feature ideas seeded as pinned comments on Day 0 teaser video
- [ ] Remotion template renders correctly (`ts-node automation/render.ts 0`)
- [ ] OBS scene preset saved (1080×1920, same layout every time)
- [ ] YouTube channel created, Shorts enabled
- [ ] TikTok creator account + Content Posting API access approved
- [ ] Instagram Business account + Graph API token
- [ ] All GitHub Secrets set (YouTube, TikTok, Instagram credentials)
- [ ] GitHub Actions workflow tested via manual trigger
- [ ] Background music track licensed (Pixabay / Epidemic Sound)

---

## 9. Milestone Strategy

| Day | Special Content |
|---|---|
| **0 (Pre-launch)** | **BANGER opener** — hilariously absurd, meme-able feature (see §10) |
| 1 | "I'm starting a 100-day challenge" — introduce the concept |
| 10 | "10 features shipped — recap reel" |
| 25 | "Quarter way — most popular feature so far" |
| 50 | "HALFWAY — the website is unrecognizable" |
| 75 | "25 days left — final sprint" |
| 100 | "It's done. 100 features. Here's the full story." (longer format) |

---

## 10. Day 0 — The Banger Opener (Go Viral Before Day 1)

Day 0 is not about introducing the challenge. It's about **proving the concept is unhinged and funny.**

**Goal:** Make the internet share this before they even know what the series is.

### Feature ideas with meme + viral potential:
- **"The Useless Button"** — a giant button that does absolutely nothing, but has an elaborate loading animation that ends with "lol nope"
- **"Rick Roll redirect"** — every 10th page visit secretly redirects to a Rick Roll with a fake "your session expired" message
- **"Dramatic cursor"** — cursor leaves a trail of fire/glitter/screaming emojis as you move it
- **"Keyboard rage mode"** — type fast enough and the screen starts shaking violently
- **"AI that roasts you"** — an "AI assistant" that only responds with personal insults based on what you type
- **"The Konami code Easter egg"** — triggers full confetti + air horn sound + "YOU FOUND IT" banner
- **"Passive aggressive form validation"** — form fields that respond emotionally to wrong inputs ("Really? THAT'S your email?")

### Why this works for Day 0:
- No context needed — funny on its own
- Duet/Stitch/reaction bait — people will screenshot and repost
- Sets the tone: this series is not boring dev content
- Hooks the algorithm before the challenge "officially" starts
- Comments flood in with requests for Day 1 → engagement spike before launch
