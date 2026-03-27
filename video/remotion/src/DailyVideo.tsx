import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================================
//  DailyVideo — your_website_project
//  Format: 1080 x 1920 (vertical), ~57 seconds @ 30fps
//  Sections (frames @ 30fps):
//    0–90    Hook card
//    90–360  Yesterday's result (screen recording)
//    360–510 Vote reveal (animated bar chart)
//    510–1050 Speed build (time-lapse)
//    1050–1290 Live demo
//    1290–1560 Cliffhanger CTA
//    1560–1710 Outro
// ============================================================

export interface DayProps {
  day: number;
  featureName: string;
  buildTime: string;      // e.g. "47 min"
  hookLine: string;       // explosive opener e.g. "This one broke everything"
  voteCount: number;      // likes on winning comment
  nextFeatureHint: string; // teaser for next day
  websiteUrl: string;
  timelapsePath: string;  // path relative to remotion public/
  demoPath: string;       // path relative to remotion public/
  yesterdayPath: string;  // path relative to remotion public/
}

/* ---- Brand tokens ---- */
const COLORS = {
  bg:     '#0f0f0f',
  green:  '#00ff88',
  pink:   '#ff3c78',
  text:   '#f0f0f0',
  muted:  '#888888',
  surface:'#1a1a1a',
};
const FONT = '"Courier New", Courier, monospace';

/* ---- Helpers ---- */
function fade(frame: number, start: number, end: number) {
  return interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
function slideUp(frame: number, start: number, config: { fps: number; }) {
  const progress = spring({ frame: frame - start, fps: config.fps, config: { stiffness: 120, damping: 14 } });
  return interpolate(progress, [0, 1], [60, 0]);
}

/* ============================================================
   Section: Hook Card (frames 0–90)
   ============================================================ */
function HookCard({ day, hookLine, frame, fps }: { day: number; hookLine: string; frame: number; fps: number }) {
  const opacity = fade(frame, 0, 90);
  const y = slideUp(frame, 0, { fps });
  return (
    <AbsoluteFill style={{ opacity, background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      {/* Day counter */}
      <div style={{ background: COLORS.green, color: '#000', fontFamily: FONT, fontWeight: 'bold', fontSize: 28, padding: '8px 24px', borderRadius: 999, letterSpacing: '0.1em' }}>
        DAY {day} / 100
      </div>
      {/* Hook line */}
      <div style={{ transform: `translateY(${y}px)`, textAlign: 'center', padding: '0 48px' }}>
        <p style={{ fontFamily: FONT, fontSize: 52, fontWeight: 'bold', color: COLORS.text, lineHeight: 1.2, textShadow: `0 0 40px ${COLORS.pink}88` }}>
          {hookLine}
        </p>
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Section: Yesterday's Result (frames 90–360)
   ============================================================ */
function YesterdayResult({ yesterdayPath, frame }: { yesterdayPath: string; frame: number }) {
  const opacity = fade(frame, 90, 360);
  return (
    <AbsoluteFill style={{ opacity, background: '#000' }}>
      <OffthreadVideo src={staticFile(yesterdayPath)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        textAlign: 'center', background: 'rgba(0,0,0,0.6)',
        padding: '12px 24px', fontFamily: FONT, color: COLORS.muted, fontSize: 22,
      }}>
        ← Yesterday's build
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Section: Vote Reveal (frames 360–510)
   ============================================================ */
function VoteReveal({ featureName, voteCount, frame, fps }: { featureName: string; voteCount: number; frame: number; fps: number }) {
  const opacity = fade(frame, 360, 510);
  const barProgress = spring({ frame: frame - 390, fps, config: { stiffness: 80, damping: 12 } });
  const barWidth = interpolate(barProgress, [0, 1], [0, 85], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity, background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', gap: 32 }}>
      <p style={{ fontFamily: FONT, fontSize: 26, color: COLORS.muted, letterSpacing: '0.1em' }}>YOU VOTED FOR</p>
      <p style={{ fontFamily: FONT, fontSize: 48, fontWeight: 'bold', color: COLORS.green, textAlign: 'center', lineHeight: 1.2 }}>
        {featureName}
      </p>
      {/* Bar chart */}
      <div style={{ width: '100%', background: COLORS.surface, borderRadius: 8, overflow: 'hidden', height: 24 }}>
        <div style={{
          width: `${barWidth}%`, height: '100%',
          background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.pink})`,
          borderRadius: 8, transition: 'width 0.3s',
        }} />
      </div>
      <p style={{ fontFamily: FONT, fontSize: 22, color: COLORS.pink }}>
        🔥 {voteCount.toLocaleString()} likes on that comment
      </p>
    </AbsoluteFill>
  );
}

/* ============================================================
   Section: Speed Build (frames 510–1050)
   ============================================================ */
function SpeedBuild({ timelapsePath, featureName, frame }: { timelapsePath: string; featureName: string; frame: number }) {
  const opacity = fade(frame, 510, 1050);
  return (
    <AbsoluteFill style={{ opacity, background: '#000' }}>
      <OffthreadVideo src={staticFile(timelapsePath)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Overlay: feature label */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ background: 'rgba(0,0,0,0.75)', padding: '8px 20px', borderRadius: 8, borderLeft: `3px solid ${COLORS.green}` }}>
          <p style={{ fontFamily: FONT, fontSize: 20, color: COLORS.text }}>Building: <strong style={{ color: COLORS.green }}>{featureName}</strong></p>
        </div>
      </div>
      {/* SPEED BUILD label */}
      <div style={{ position: 'absolute', bottom: 40, right: 40 }}>
        <p style={{ fontFamily: FONT, fontSize: 16, color: COLORS.muted, letterSpacing: '0.15em' }}>⚡ SPEED BUILD</p>
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Section: Live Demo (frames 1050–1290)
   ============================================================ */
function LiveDemo({ demoPath, websiteUrl, frame }: { demoPath: string; websiteUrl: string; frame: number }) {
  const opacity = fade(frame, 1050, 1290);
  return (
    <AbsoluteFill style={{ opacity, background: '#000' }}>
      <OffthreadVideo src={staticFile(demoPath)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'rgba(0,0,0,0.7)', padding: '16px',
      }}>
        <div style={{ background: COLORS.pink, color: '#fff', fontFamily: FONT, fontWeight: 'bold', fontSize: 18, padding: '4px 16px', borderRadius: 999 }}>
          🔴 LIVE
        </div>
        <p style={{ fontFamily: FONT, fontSize: 22, color: COLORS.green }}>{websiteUrl}</p>
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Section: Cliffhanger CTA (frames 1290–1560)
   ============================================================ */
function CliffhangerCTA({ day, nextFeatureHint, frame, fps }: { day: number; nextFeatureHint: string; frame: number; fps: number }) {
  const opacity = fade(frame, 1290, 1560);
  const y = slideUp(frame, 1290, { fps });
  return (
    <AbsoluteFill style={{ opacity, background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', gap: 32 }}>
      <div style={{ transform: `translateY(${y}px)`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <p style={{ fontFamily: FONT, fontSize: 28, color: COLORS.muted, letterSpacing: '0.08em' }}>
          DAY {day + 1} / 100
        </p>
        <p style={{ fontFamily: FONT, fontSize: 48, fontWeight: 'bold', color: COLORS.pink, lineHeight: 1.2 }}>
          {nextFeatureHint}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 24, color: COLORS.text, lineHeight: 1.5 }}>
          Drop your feature request ⬇️{'\n'}Most liked comment wins.
        </p>
      </div>
      <div style={{
        border: `2px solid ${COLORS.green}`,
        borderRadius: 8,
        padding: '12px 24px',
        fontFamily: FONT,
        fontSize: 18,
        color: COLORS.green,
        letterSpacing: '0.05em',
      }}>
        24 HOURS TO VOTE
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Section: Outro (frames 1560–1710)
   ============================================================ */
function Outro({ websiteUrl, day, frame, fps }: { websiteUrl: string; day: number; frame: number; fps: number }) {
  const opacity = fade(frame, 1560, 1710);
  const scale = spring({ frame: frame - 1560, fps, config: { stiffness: 100, damping: 16 } });
  return (
    <AbsoluteFill style={{ opacity, background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {/* Logo placeholder */}
        <div style={{ width: 96, height: 96, background: COLORS.green, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: FONT, fontSize: 36, fontWeight: 'bold', color: '#000' }}>YW</span>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 32, fontWeight: 'bold', color: COLORS.text }}>your_website_project</p>
        <p style={{ fontFamily: FONT, fontSize: 20, color: COLORS.green }}>{websiteUrl}</p>
        <p style={{ fontFamily: FONT, fontSize: 18, color: COLORS.muted }}>Follow for Day {day + 1}</p>
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Main composition
   ============================================================ */
export function DailyVideo(props: DayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {frame < 90   && <HookCard      day={props.day}         hookLine={props.hookLine}              frame={frame} fps={fps} />}
      {frame >= 90  && frame < 360  && <YesterdayResult yesterdayPath={props.yesterdayPath}          frame={frame} />}
      {frame >= 360 && frame < 510  && <VoteReveal      featureName={props.featureName}  voteCount={props.voteCount} frame={frame} fps={fps} />}
      {frame >= 510 && frame < 1050 && <SpeedBuild      timelapsePath={props.timelapsePath} featureName={props.featureName} frame={frame} />}
      {frame >= 1050 && frame < 1290 && <LiveDemo       demoPath={props.demoPath}        websiteUrl={props.websiteUrl}    frame={frame} />}
      {frame >= 1290 && frame < 1560 && <CliffhangerCTA day={props.day}                 nextFeatureHint={props.nextFeatureHint} frame={frame} fps={fps} />}
      {frame >= 1560 && <Outro websiteUrl={props.websiteUrl} day={props.day} frame={frame} fps={fps} />}

      {/* Persistent day badge (always on screen) */}
      <div style={{
        position: 'absolute', top: 32, right: 32,
        background: COLORS.green, color: '#000',
        fontFamily: FONT, fontWeight: 'bold', fontSize: 20,
        padding: '6px 16px', borderRadius: 999,
        boxShadow: `0 0 20px ${COLORS.green}66`,
      }}>
        DAY {props.day} / 100
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================
   Remotion compositions entry point
   ============================================================ */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="DailyVideo"
        component={DailyVideo}
        durationInFrames={1710}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          day: 1,
          featureName: 'Passive-Aggressive Form',
          buildTime: '47 min',
          hookLine: 'This form will roast you.',
          voteCount: 847,
          nextFeatureHint: "Tomorrow I'm adding something cursed.",
          websiteUrl: 'yourwebsite.com',
          timelapsePath: 'timelapse.mp4',
          demoPath: 'demo.mp4',
          yesterdayPath: 'yesterday.mp4',
        }}
      />
    </>
  );
}
