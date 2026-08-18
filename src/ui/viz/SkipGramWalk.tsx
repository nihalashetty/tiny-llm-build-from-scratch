import { useEffect, useMemo, useState } from 'react';
import { makeRng } from '../../llm/rng';
import { Button } from '@/components/ui/button';

/**
 * Skip-gram, one step at a time - the interactive version of "words that keep
 * showing up together end up in the same place".
 *
 * Slide the window across a five-line corpus. Each stop is one training step:
 * the centre word gets pulled toward the words beside it, and pushed away from
 * one word that wasn't there. The map underneath shows the *same* words as dots
 * actually moving, so you can watch two clusters form out of random noise.
 *
 * The whole trajectory is computed once, up front, so the slider can scrub
 * backwards and forwards without the maths having to run in reverse.
 */

const INK = '#16181d';
const MUTED = '#79808e';
const LINE = '#e7dcc9';
const CORAL = '#e0553a';
const CORAL_DEEP = '#a63a25';
const GREEN = '#10866a';
const GREEN_DEEP = '#12795b';
const MONO = "'Geist Mono', monospace";

/** A deliberately tiny corpus: two "royal" lines, two more, and one about a fox. */
const SENTENCES = [
  ['king', 'sits', 'on', 'throne'],
  ['queen', 'sits', 'on', 'throne'],
  ['king', 'wears', 'crown'],
  ['queen', 'wears', 'crown'],
  ['fox', 'runs', 'in', 'forest'],
];

const VOCAB = Array.from(new Set(SENTENCES.flat()));
const INDEX = new Map(VOCAB.map((w, i) => [w, i] as const));
const WINDOW = 2;
const PASSES = 3;
/** Purely cosmetic: keep two dots from landing on top of each other so labels stay readable. */
const MIN_SEP = 0.11;

type Pt = [number, number];

type Frame = {
  pass: number;
  /** which line of the corpus we're on, -1 before the first step */
  sentence: number;
  /** index of the centre word inside that line */
  centre: number;
  /** indexes of its neighbours inside that line */
  neighbours: number[];
  /** the random word we shove away this step */
  negative: string | null;
  pos: Pt[];
};

const clamp = (v: number) => Math.min(0.94, Math.max(0.06, v));

/** Run the whole demo once and record a snapshot after every single step. */
function buildFrames(): Frame[] {
  const rng = makeRng(23);
  const pos: Pt[] = VOCAB.map(() => [0.18 + rng() * 0.64, 0.18 + rng() * 0.64]);
  const snap = (): Pt[] => pos.map((p) => [p[0], p[1]] as Pt);

  const frames: Frame[] = [
    { pass: 0, sentence: -1, centre: -1, neighbours: [], negative: null, pos: snap() },
  ];

  for (let pass = 0; pass < PASSES; pass++) {
    // Nudges get gentler each pass - the same "settle down over time" idea as a
    // decaying learning rate in the real thing.
    const pull = 0.13 * (1 - pass / (PASSES + 1));
    const push = 0.16 * (1 - pass / (PASSES + 1));

    for (let s = 0; s < SENTENCES.length; s++) {
      const sent = SENTENCES[s];
      for (let c = 0; c < sent.length; c++) {
        const ci = INDEX.get(sent[c])!;

        const neighbours: number[] = [];
        for (let j = Math.max(0, c - WINDOW); j <= Math.min(sent.length - 1, c + WINDOW); j++) {
          if (j !== c) neighbours.push(j);
        }

        // 1. Pull: centre and each real neighbour take a half-step toward each other.
        for (const j of neighbours) {
          const ni = INDEX.get(sent[j])!;
          const dx = pos[ni][0] - pos[ci][0];
          const dy = pos[ni][1] - pos[ci][1];
          pos[ci][0] += dx * pull * 0.5;
          pos[ci][1] += dy * pull * 0.5;
          pos[ni][0] -= dx * pull * 0.5;
          pos[ni][1] -= dy * pull * 0.5;
        }

        // 2. Push: one word that isn't in this line gets shoved away. Only if it's
        //    close by - words already far apart have nothing left to argue about.
        const pool = VOCAB.filter((w) => !sent.includes(w));
        const negative = pool.length ? pool[Math.floor(rng() * pool.length)] : null;
        if (negative) {
          const gi = INDEX.get(negative)!;
          let dx = pos[gi][0] - pos[ci][0];
          let dy = pos[gi][1] - pos[ci][1];
          const d = Math.hypot(dx, dy) || 1e-6;
          const strength = Math.max(0, 1 - d / 0.55) * push;
          dx /= d;
          dy /= d;
          pos[ci][0] -= dx * strength;
          pos[ci][1] -= dy * strength;
          pos[gi][0] += dx * strength;
          pos[gi][1] += dy * strength;
        }

        // 3. Nudge apart any two dots that have ended up on the same pixel.
        for (let a = 0; a < pos.length; a++) {
          for (let b = a + 1; b < pos.length; b++) {
            let ex = pos[b][0] - pos[a][0];
            let ey = pos[b][1] - pos[a][1];
            const dd = Math.hypot(ex, ey) || 1e-6;
            if (dd >= MIN_SEP) continue;
            const f = (MIN_SEP - dd) / 2;
            ex /= dd;
            ey /= dd;
            pos[a][0] -= ex * f;
            pos[a][1] -= ey * f;
            pos[b][0] += ex * f;
            pos[b][1] += ey * f;
          }
        }

        for (const p of pos) {
          p[0] = clamp(p[0]);
          p[1] = clamp(p[1]);
        }

        frames.push({ pass, sentence: s, centre: c, neighbours, negative, pos: snap() });
      }
    }
  }

  return frames;
}

const W = 430;
const H = 250;
const px = (u: number) => 42 + u * (W - 84);
const py = (v: number) => H - 32 - v * (H - 62);

const quoted = (w: string) => `“${w}”`;

type Slot = { dx: number; dy: number; anchor: 'middle' | 'start' | 'end' };

/** Where a label may sit relative to its dot, in order of preference. */
const SLOTS: Slot[] = [
  { dx: 0, dy: -11, anchor: 'middle' },
  { dx: 0, dy: 17, anchor: 'middle' },
  { dx: 10, dy: 4, anchor: 'start' },
  { dx: -10, dy: 4, anchor: 'end' },
  { dx: 9, dy: -8, anchor: 'start' },
  { dx: -9, dy: -8, anchor: 'end' },
  { dx: 9, dy: 15, anchor: 'start' },
  { dx: -9, dy: 15, anchor: 'end' },
];

/**
 * Dots that drift close together would print their labels on top of each other.
 * So each frame we place the labels ourselves: the words in play go first (they
 * keep the spot above their dot), then the rest take the best free slot left.
 * Character widths are eyeballed from the rendered font - close enough to keep
 * two words from touching.
 */
function layoutLabels(pos: Pt[], active: Set<string>): Slot[] {
  const placed: { x1: number; x2: number; y1: number; y2: number }[] = [];
  const out: Slot[] = new Array(VOCAB.length);
  const order = VOCAB.map((_, k) => k).sort(
    (a, b) => (active.has(VOCAB[b]) ? 1 : 0) - (active.has(VOCAB[a]) ? 1 : 0),
  );

  for (const k of order) {
    const w = VOCAB[k];
    const cx = px(pos[k][0]);
    const cy = py(pos[k][1]);
    const wide = w.length * (active.has(w) ? 6.9 : 6) + 6;

    let chosen: Slot | null = null;
    for (const slot of SLOTS) {
      const x = cx + slot.dx;
      const x1 = slot.anchor === 'middle' ? x - wide / 2 : slot.anchor === 'start' ? x - 3 : x - wide + 3;
      const box = { x1, x2: x1 + wide, y1: cy + slot.dy - 12, y2: cy + slot.dy + 5 };
      if (placed.some((p) => box.x1 < p.x2 && p.x1 < box.x2 && box.y1 < p.y2 && p.y1 < box.y2)) continue;
      placed.push(box);
      chosen = slot;
      break;
    }
    out[k] = chosen ?? SLOTS[0];
  }

  return out;
}

export function SkipGramWalk() {
  const frames = useMemo(buildFrames, []);
  const last = frames.length - 1;

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setI((k) => {
        if (k >= last) {
          setPlaying(false);
          return k;
        }
        return k + 1;
      });
    }, 620);
    return () => window.clearInterval(id);
  }, [playing, last]);

  const f = frames[i];
  const started = f.sentence >= 0;
  const sent = started ? SENTENCES[f.sentence] : null;
  const centreWord = sent ? sent[f.centre] : null;
  const neighbourWords = sent ? f.neighbours.map((j) => sent[j]) : [];
  const activeSet = new Set<string>(centreWord ? [centreWord, ...neighbourWords] : []);
  const labels = useMemo(
    () => layoutLabels(f.pos, new Set([...activeSet, ...(f.negative ? [f.negative] : [])])),
    [f],
  );

  const roleOf = (w: string) => {
    if (w === centreWord) return 'centre';
    if (activeSet.has(w)) return 'neighbour';
    if (w === f.negative) return 'random';
    return 'idle';
  };

  const step = (d: number) => {
    setPlaying(false);
    setI((k) => Math.min(last, Math.max(0, k + d)));
  };

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <div style={{ lineHeight: 1.5, padding: '4px 6px 2px' }}>
        {/* Corpus + step description on the left, the moving map on the right, so
            the whole demo fits in one view and uses the full width. */}
        <div className="grid grid-cols-1 items-center gap-x-5 gap-y-3 sm:grid-cols-[minmax(0,300px)_1fr]">
          <div>
        {/* ---- the corpus, one line per sentence ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
          {SENTENCES.map((line, s) => {
            const live = s === f.sentence;
            return (
              <div key={s} style={{ display: 'flex', gap: 4, opacity: live || !started ? 1 : 0.32 }}>
                {line.map((w, j) => {
                  const isCentre = live && j === f.centre;
                  const isNb = live && f.neighbours.includes(j);
                  return (
                    <span
                      key={j}
                      style={{
                        fontFamily: MONO,
                        fontSize: 12.5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: `1.5px solid ${isCentre ? CORAL : isNb ? GREEN : LINE}`,
                        background: isCentre ? '#fdeeea' : isNb ? '#e4f3ec' : '#f6f7f9',
                        color: isCentre ? CORAL_DEEP : isNb ? GREEN_DEEP : MUTED,
                        fontWeight: isCentre || isNb ? 700 : 400,
                        transition: 'background 200ms, border-color 200ms, color 200ms',
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ---- one plain sentence describing this exact step ---- */}
        <div
          style={{
            marginTop: 10,
            minHeight: 46,
            fontFamily: MONO,
            fontSize: 11.5,
            lineHeight: 1.6,
            textAlign: 'center',
            color: MUTED,
          }}
        >
          {!started ? (
            <>
              Every word starts on a random spot. Press <strong style={{ color: INK }}>Play</strong> and
              read the corpus one word at a time.
            </>
          ) : (
            <>
              <div>
                <span style={{ color: GREEN_DEEP, fontWeight: 700 }}>{quoted(centreWord!)}</span> shows up
                next to{' '}
                <span style={{ color: GREEN_DEEP, fontWeight: 700 }}>
                  {neighbourWords.map(quoted).join(', ')}
                </span>{' '}
                → move them <span style={{ color: GREEN_DEEP, fontWeight: 700 }}>closer</span>.
              </div>
              {f.negative && (
                <div>
                  <span style={{ color: CORAL_DEEP, fontWeight: 700 }}>{quoted(f.negative)}</span> is not
                  in this line → push it{' '}
                  <span style={{ color: CORAL_DEEP, fontWeight: 700 }}>away</span>.
                </div>
              )}
            </>
          )}
        </div>
          </div>

          {/* ---- the same words as dots, actually moving ---- */}
          <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Word vectors moving closer or further apart as the window slides"
        >
          <rect x={14} y={10} width={W - 28} height={H - 24} rx={10} fill="#fbfaf7" stroke={LINE} />

          {/* lines from the centre word to whatever it's being compared against */}
          {started &&
            neighbourWords.map((w, k) => {
              const a = f.pos[INDEX.get(centreWord!)!];
              const b = f.pos[INDEX.get(w)!];
              return (
                <line
                  key={`nb-${k}`}
                  x1={px(a[0])}
                  y1={py(a[1])}
                  x2={px(b[0])}
                  y2={py(b[1])}
                  stroke={GREEN}
                  strokeWidth={1.5}
                  opacity={0.55}
                />
              );
            })}
          {started && f.negative && (
            <line
              x1={px(f.pos[INDEX.get(centreWord!)!][0])}
              y1={py(f.pos[INDEX.get(centreWord!)!][1])}
              x2={px(f.pos[INDEX.get(f.negative)!][0])}
              y2={py(f.pos[INDEX.get(f.negative)!][1])}
              stroke={CORAL_DEEP}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          )}

          {VOCAB.map((w, k) => {
            const role = roleOf(w);
            const color =
              role === 'centre' ? CORAL : role === 'neighbour' ? GREEN : role === 'random' ? CORAL_DEEP : '#c2b39a';
            const dim = role === 'idle' ? 0.42 : 1;
            const r = role === 'centre' ? 7 : role === 'idle' ? 4.5 : 5.5;
            return (
              <g
                key={w}
                style={{
                  transform: `translate(${px(f.pos[k][0])}px, ${py(f.pos[k][1])}px)`,
                  transition: 'transform 480ms cubic-bezier(.4,.05,.25,1)',
                }}
              >
                <circle r={r} fill={color} opacity={dim} />
                <text
                  x={labels[k].dx}
                  y={labels[k].dy}
                  textAnchor={labels[k].anchor}
                  fontFamily={MONO}
                  fontSize={role === 'idle' ? 10 : 11.5}
                  fontWeight={role === 'idle' ? 400 : 700}
                  fill={role === 'idle' ? MUTED : color}
                  opacity={dim}
                >
                  {w}
                </text>
              </g>
            );
          })}
        </svg>
        </div>

        {/* ---- controls ---- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Button size="sm" variant="outline" onClick={() => step(-1)} disabled={i === 0}>
            ◀
          </Button>
          <Button
            size="sm"
            onClick={() => (i >= last ? (setI(0), setPlaying(true)) : setPlaying((p) => !p))}
          >
            {playing ? 'Pause' : i >= last ? 'Replay ▶' : i === 0 ? 'Play ▶' : 'Resume ▶'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => step(1)} disabled={i >= last}>
            ▶
          </Button>
          <input
            type="range"
            min={0}
            max={last}
            value={i}
            onChange={(e) => {
              setPlaying(false);
              setI(Number(e.target.value));
            }}
            style={{ flex: 1, minWidth: 120, accentColor: CORAL }}
            aria-label="Slide the window across the corpus"
          />
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: MUTED, whiteSpace: 'nowrap' }}>
            step <b style={{ color: INK }}>{i}</b>/{last} · pass{' '}
            <b style={{ color: INK }}>{started ? f.pass + 1 : 0}</b>/{PASSES}
          </span>
        </div>
      </div>
    </span>
  );
}
