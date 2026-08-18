import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Illustrated, mostly-static SVG diagrams for the transformer chapter, built to
 * teach one idea each with the running example "The cat sat on the mat":
 *   PipelineDiagram  - the whole data flow, end to end
 *   QKVDiagram       - every word splits into a Query, Key, and Value
 *   AttentionArcs    - interactive: pick a word, watch it look back and blend
 *   FeedForwardDiagram - each word "thinks" on its own (expand → ReLU → compress)
 *   StackedBlocks    - many blocks turn syntax into meaning into reasoning
 * Weights in AttentionArcs are a hand-drawn schematic; the real, learned weights
 * are in the live heatmap in the chapter.
 */

const INK = '#16181d';
const MUTED = '#8a7d6b';
const FAINT = '#b6a68f';
const LINE = '#e7dcc9';
const AMBER = '#d69a3c';
const MONO = "'Geist Mono', monospace";

const WORDS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
const WCOL = ['#4f7cc4', '#8a5cc4', '#3f9e6f', '#b5754a', '#4a8a97', '#9a8f3c'];
const Q_COL = '#d9534f';
const K_COL = '#3e6ff0';
const V_COL = '#10866a';

/* ---------- 1. Pipeline overview ---------- */
export function PipelineDiagram() {
  const W = 720;
  const H = 150;
  const box = (x: number, w: number, title: string, sub: string, fill = '#fff') => (
    <g>
      <rect x={x} y={40} width={w} height={62} rx={10} fill={fill} stroke={LINE} strokeWidth={1.5} />
      <text x={x + w / 2} y={66} textAnchor="middle" fontFamily={MONO} fontSize={12.5} fontWeight={700} fill={INK}>
        {title}
      </text>
      <text x={x + w / 2} y={84} textAnchor="middle" fontFamily={MONO} fontSize={10} fill={MUTED}>
        {sub}
      </text>
    </g>
  );
  const arrow = (x: number) => (
    <line x1={x} y1={71} x2={x + 18} y2={71} stroke={FAINT} strokeWidth={2} markerEnd="url(#pl-a)" />
  );
  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Transformer data flow, end to end">
        <defs>
          <marker id="pl-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={FAINT} />
          </marker>
        </defs>
        {box(8, 96, 'tokens', 'the·queen·…')}
        {arrow(104)}
        {box(122, 104, '+ position', 'stamp order')}
        {arrow(226)}
        {box(244, 200, 'block × N', 'attention → feed-forward', '#faf4ea')}
        {arrow(444)}
        {box(462, 104, 'readout', 'score vocab')}
        {arrow(566)}
        {box(584, 128, 'next token', 'pick & repeat', '#fef0e9')}
        <text x={344} y={128} textAnchor="middle" fontFamily={MONO} fontSize={10} fill={MUTED}>
          the stack of blocks is where all the understanding happens
        </text>
      </svg>
    </span>
  );
}

/* ---------- 2. Q / K / V per word ---------- */
export function QKVDiagram() {
  const W = 720;
  const H = 210;
  const wx = (i: number) => 64 + i * 118;
  const wy = 44;
  const dotY = 104;
  const dxs = [-20, 0, 20];
  const dcol = [Q_COL, K_COL, V_COL];
  const dlab = ['Q', 'K', 'V'];
  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Each word becomes a Query, Key and Value">
        {WORDS.map((w, i) => (
          <g key={i}>
            <text x={wx(i)} y={wy - 22} textAnchor="middle" fontFamily={MONO} fontSize={12.5} fill={INK}>
              {w}
            </text>
            <circle cx={wx(i)} cy={wy} r={15} fill={WCOL[i]} />
            {dxs.map((dx, k) => (
              <g key={k}>
                <line x1={wx(i)} y1={wy + 15} x2={wx(i) + dx} y2={dotY - 6} stroke={LINE} strokeWidth={1.2} />
                <circle cx={wx(i) + dx} cy={dotY} r={6} fill={dcol[k]} />
                <text x={wx(i) + dx} y={dotY + 20} textAnchor="middle" fontFamily={MONO} fontSize={10.5} fontWeight={700} fill={dcol[k]}>
                  {dlab[k]}
                </text>
              </g>
            ))}
          </g>
        ))}
        <text x={40} y={162} fontFamily={MONO} fontSize={12.5} fill={INK}>
          <tspan fill={Q_COL} fontWeight={700}>Query</tspan> - what am I looking for?
        </text>
        <text x={40} y={182} fontFamily={MONO} fontSize={12.5} fill={INK}>
          <tspan fill={K_COL} fontWeight={700}>Key</tspan> - what do I offer to others?
        </text>
        <text x={40} y={202} fontFamily={MONO} fontSize={12.5} fill={INK}>
          <tspan fill={V_COL} fontWeight={700}>Value</tspan> - what I'll hand over if I'm picked
        </text>
      </svg>
    </span>
  );
}

/* ---------- 3. Interactive attention ---------- */
// hand-drawn, plausible weights (lower-triangular): raw[i][j], j <= i
const RAW: number[][] = [
  [1],
  [0.6, 0.5],
  [0.15, 0.9, 0.3],
  [0.1, 0.5, 0.7, 0.25],
  [0.05, 0.1, 0.2, 0.6, 0.3],
  [0.05, 0.15, 0.4, 0.25, 0.55, 0.2],
];
function weightsFor(i: number): number[] {
  const row = RAW[i];
  const sum = row.reduce((a, b) => a + b, 0);
  return row.map((v) => v / sum);
}

export function AttentionArcs() {
  const [sel, setSel] = useState(2); // default "sat"
  const W = 760;
  const H = 300;
  const wx = (i: number) => 76 + i * 122;
  const wy = 92;
  const kY = 142; // key/value dot row
  const blendY = 252;
  const w = weightsFor(sel);

  // arch the attention lines above the words, capped so long ones stay in frame
  const arcPath = (x1: number, x2: number, y: number) => {
    const mx = (x1 + x2) / 2;
    const cy = y - Math.min(72, 18 + Math.abs(x2 - x1) * 0.1);
    return `M ${x1} ${y} Q ${mx} ${cy} ${x2} ${y}`;
  };

  const ranked = w
    .map((weight, j) => ({ j, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 font-mono text-xs text-muted-foreground">current word:</span>
        {WORDS.map((word, i) => (
          <button
            key={i}
            className={cn(
              'rounded-md border px-2.5 py-1 font-mono text-[0.82rem] leading-tight',
              i === sel
                ? 'border-primary bg-primary font-bold text-primary-foreground'
                : 'bg-card hover:border-ring',
            )}
            onClick={() => setSel(i)}
          >
            {word}
          </button>
        ))}
      </div>
      <span className="canvas-frame" style={{ display: 'block' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="One word attends to earlier words and blends their values">
          {/* attention arcs from selected word back to each earlier word */}
          {w.map((weight, j) =>
            j < sel ? (
              <path
                key={`arc-${j}`}
                d={arcPath(wx(j), wx(sel), wy - 18)}
                fill="none"
                stroke={AMBER}
                strokeWidth={1 + weight * 7}
                opacity={0.25 + weight * 0.7}
              />
            ) : null,
          )}

          {/* words */}
          {WORDS.map((word, i) => {
            const future = i > sel;
            return (
              <g key={i} opacity={future ? 0.3 : 1} style={{ cursor: 'pointer' }} onClick={() => setSel(i)}>
                <text x={wx(i)} y={wy - 24} textAnchor="middle" fontFamily={MONO} fontSize={12.5} fill={INK}>
                  {word}
                </text>
                <circle cx={wx(i)} cy={wy} r={16} fill={WCOL[i]} stroke={i === sel ? '#fff' : 'none'} strokeWidth={3} />
                {/* connectors + Q K V dots */}
                {[-20, 0, 20].map((dx, k) => (
                  <line key={`c-${k}`} x1={wx(i)} y1={wy + 16} x2={wx(i) + dx} y2={kY - 6} stroke={LINE} strokeWidth={1} />
                ))}
                <circle cx={wx(i) - 20} cy={kY} r={5.5} fill={Q_COL} stroke={i === sel ? INK : 'none'} strokeWidth={2} />
                <circle cx={wx(i)} cy={kY} r={5.5} fill={K_COL} />
                <circle cx={wx(i) + 20} cy={kY} r={5.5} fill={V_COL} />
              </g>
            );
          })}

          {/* value pull-down into the blend node */}
          {w.map((weight, j) =>
            j <= sel ? (
              <line
                key={`v-${j}`}
                x1={wx(j) + 20}
                y1={kY + 6}
                x2={wx(sel)}
                y2={blendY - 12}
                stroke={V_COL}
                strokeWidth={0.6 + weight * 4}
                opacity={0.25 + weight * 0.6}
              />
            ) : null,
          )}
          <circle cx={wx(sel)} cy={blendY} r={13} fill={WCOL[sel]} stroke="#fff" strokeWidth={2.5} />
          <text x={wx(sel)} y={blendY + 34} textAnchor="middle" fontFamily={MONO} fontSize={11.5} fill={INK}>
            new “{WORDS[sel]}” = blend of the values it attended to
          </text>

          {/* weight readout */}
          <text x={24} y={168} fontFamily={MONO} fontSize={11} fill={MUTED}>
            “{WORDS[sel]}” looks back at:
          </text>
          {ranked.map((r, idx) => (
            <text key={idx} x={24} y={188 + idx * 18} fontFamily={MONO} fontSize={12} fill={INK}>
              <tspan fill={WCOL[r.j]} fontWeight={700}>
                {WORDS[r.j]}
              </tspan>{' '}
              {Math.round(r.weight * 100)}%
            </text>
          ))}
        </svg>
      </span>
      <div className="my-3 font-mono text-xs leading-relaxed text-muted-foreground">
        Click any word to make it the “current” one. It can only look at itself and the words{' '}
        <em>before</em> it - the greyed-out words to its right are the future, hidden by the causal mask.
        (Weights here are a schematic; the live heatmap below shows a real model's learned weights.)
      </div>
    </div>
  );
}

/* ---------- 4. Feed-forward ---------- */
export function FeedForwardDiagram() {
  const W = 420;
  const H = 210;
  const colX = [70, 210, 350];
  const counts = [4, 8, 4];
  const colY = (n: number, i: number) => 30 + (i + 0.5) * ((H - 60) / n);
  const cols = counts.map((n, c) => Array.from({ length: n }, (_, i) => ({ x: colX[c], y: colY(n, i) })));
  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="A feed-forward network expands then compresses each word vector">
        {/* connections in → hidden → out */}
        {cols[0].map((a, ai) =>
          cols[1].map((b, bi) => (
            <line key={`ih-${ai}-${bi}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={LINE} strokeWidth={0.8} opacity={0.7} />
          )),
        )}
        {cols[1].map((a, ai) =>
          cols[2].map((b, bi) => (
            <line key={`ho-${ai}-${bi}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={LINE} strokeWidth={0.8} opacity={0.7} />
          )),
        )}
        {cols[0].map((p, i) => (
          <circle key={`i-${i}`} cx={p.x} cy={p.y} r={6} fill={WCOL[2]} />
        ))}
        {cols[1].map((p, i) => (
          <circle key={`h-${i}`} cx={p.x} cy={p.y} r={6} fill={AMBER} />
        ))}
        {cols[2].map((p, i) => (
          <circle key={`o-${i}`} cx={p.x} cy={p.y} r={6} fill={WCOL[2]} />
        ))}
        <text x={colX[0]} y={H - 10} textAnchor="middle" fontFamily={MONO} fontSize={10.5} fill={MUTED}>
          the word
        </text>
        <text x={colX[1]} y={H - 10} textAnchor="middle" fontFamily={MONO} fontSize={10.5} fill={AMBER}>
          bigger + ReLU
        </text>
        <text x={colX[2]} y={H - 10} textAnchor="middle" fontFamily={MONO} fontSize={10.5} fill={MUTED}>
          back to size
        </text>
      </svg>
    </span>
  );
}

/* ---------- 5. Stacked blocks ---------- */
export function StackedBlocks() {
  const rows: { label: string; color: string; qs: string[] }[] = [
    { label: 'syntax', color: '#4f7cc4', qs: ['word order?', 'part of speech?', 'punctuation?', 'local context?'] },
    { label: 'meaning', color: '#3f9e6f', qs: ['word sense?', "who is 'the'?", 'named entities?', 'relationships?'] },
    { label: 'reasoning', color: '#a63a25', qs: ['sentiment?', 'intent?', 'what comes next?', '…'] },
  ];
  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span
              className="min-w-[74px] text-right font-mono text-xs leading-tight font-bold"
              style={{ color: row.color }}
            >
              {row.label}
            </span>
            <div className="flex flex-1 flex-wrap gap-2">
              {row.qs.map((q, i) => (
                <div
                  key={i}
                  className="flex min-w-[96px] flex-1 flex-col gap-2 rounded-lg border bg-card px-2.5 py-2"
                >
                  <span className="font-mono text-[0.68rem] leading-tight text-foreground/90">{q}</span>
                  <span className="h-1 w-3/5 rounded-sm opacity-65" style={{ background: row.color }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 font-mono text-xs leading-normal text-muted-foreground">
        early blocks sort out grammar; middle blocks resolve meaning; later blocks reason. Real models stack
        dozens - GPT-3 has 96 of these.
      </div>
    </span>
  );
}
