import type { ReactNode } from 'react';

/**
 * Small, static SVG diagrams that teach the ideas behind embeddings before the
 * live demo: what a vector is, what a dimension is (1D → 2D → 3D), how many
 * dimensions real models use, and how cosine similarity measures "closeness."
 * All framework-free SVG, themed to match the rest of the site.
 */

const INK = '#16181d';
const MUTED = '#79808e';
const LINE = '#e7dcc9';
const CORAL = '#e0553a';
const CORAL_DEEP = '#a63a25';
const GREEN = '#10866a';
const BLUE = '#3e6ff0';
const MONO = "'Geist Mono', monospace";

/** A vector is a list of numbers = an arrow to a point. Similar words point similarly. */
export function VectorArrowDiagram() {
  const W = 360;
  const H = 240;
  const ox = 44;
  const oy = H - 40;
  const ax = W - 24;
  const ay = 24;
  const px = (u: number) => ox + u * (ax - ox);
  const py = (v: number) => oy - v * (oy - ay);

  const arrow = (u: number, v: number, color: string, label: string) => {
    const x = px(u);
    const y = py(v);
    return (
      <g>
        <line x1={ox} y1={oy} x2={x} y2={y} stroke={color} strokeWidth={2.5} markerEnd="url(#va-head)" />
        <circle cx={x} cy={y} r={3.5} fill={color} />
        <text x={x + 6} y={y - 4} fontFamily={MONO} fontSize={12} fontWeight={700} fill={color}>
          {label}
        </text>
      </g>
    );
  };

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="A word vector drawn as an arrow to a point">
        <defs>
          <marker id="va-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={MUTED} />
          </marker>
        </defs>
        <line x1={ox} y1={oy} x2={ax} y2={oy} stroke={LINE} strokeWidth={1.5} />
        <line x1={ox} y1={oy} x2={ox} y2={ay} stroke={LINE} strokeWidth={1.5} />
        <text x={ax} y={oy + 16} fontFamily={MONO} fontSize={10.5} fill={MUTED} textAnchor="end">
          dimension 1 →
        </text>
        <text
          x={ox - 6}
          y={ay + 2}
          fontFamily={MONO}
          fontSize={10.5}
          fill={MUTED}
          textAnchor="end"
          transform={`rotate(-90 ${ox - 6} ${ay + 2})`}
        >
          dimension 2 →
        </text>

        {arrow(0.78, 0.82, CORAL_DEEP, 'king [.78, .82]')}
        {arrow(0.66, 0.72, GREEN, 'queen [.66, .72]')}
        {arrow(0.2, 0.32, BLUE, 'rock [.20, .32]')}
      </svg>
    </span>
  );
}

/** 1D, 2D, 3D: each new dimension is one more number = one more axis to move along. */
export function DimensionLadder() {
  const panel = (title: string, sub: string, draw: ReactNode) => (
    <div style={{ flex: 1, minWidth: 150 }}>
      <svg viewBox="0 0 160 120" width="100%" role="img" aria-label={title} style={{ display: 'block' }}>
        {draw}
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.3, color: INK, fontWeight: 700, marginTop: 4 }}>
        {title}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.3, color: MUTED, marginTop: 2 }}>{sub}</div>
    </div>
  );

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {panel(
          '1 dimension',
          'a point on a line',
          <>
            <line x1={16} y1={70} x2={144} y2={70} stroke={LINE} strokeWidth={2} />
            <circle cx={104} cy={70} r={6} fill={CORAL} />
            <text x={104} y={92} fontFamily={MONO} fontSize={11} fill={MUTED} textAnchor="middle">
              [.7]
            </text>
          </>,
        )}
        {panel(
          '2 dimensions',
          'a point on a plane',
          <>
            <line x1={20} y1={100} x2={144} y2={100} stroke={LINE} strokeWidth={2} />
            <line x1={20} y1={100} x2={20} y2={16} stroke={LINE} strokeWidth={2} />
            <circle cx={100} cy={44} r={6} fill={CORAL} />
            <text x={100} y={36} fontFamily={MONO} fontSize={11} fill={MUTED} textAnchor="middle">
              [.7, .8]
            </text>
          </>,
        )}
        {panel(
          '3 dimensions',
          'a point in space',
          <>
            <line x1={26} y1={100} x2={140} y2={100} stroke={LINE} strokeWidth={2} />
            <line x1={26} y1={100} x2={26} y2={20} stroke={LINE} strokeWidth={2} />
            <line x1={26} y1={100} x2={74} y2={64} stroke={LINE} strokeWidth={2} />
            <circle cx={98} cy={52} r={6} fill={CORAL} />
            <text x={98} y={44} fontFamily={MONO} fontSize={11} fill={MUTED} textAnchor="middle">
              [.7,.8,.5]
            </text>
          </>,
        )}
      </div>
    </span>
  );
}

/** How many dimensions models actually use - log-scaled bars, real numbers labelled. */
export function DimensionScale() {
  const rows = [
    { label: 'our demo', v: 16, color: MUTED },
    { label: 'Word2Vec (2013)', v: 300, color: GREEN },
    { label: 'GPT-2', v: 768, color: BLUE },
    { label: 'GPT-3', v: 12288, color: CORAL_DEEP },
  ];
  const W = 380;
  const rowH = 34;
  const H = rows.length * rowH + 16;
  const barX = 132;
  const barMax = W - barX - 58;
  const maxLog = Math.log10(12288);

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Embedding dimensions used by different models">
        {rows.map((r, i) => {
          const y = 8 + i * rowH;
          const w = Math.max(6, (Math.log10(r.v) / maxLog) * barMax);
          return (
            <g key={r.label}>
              <text x={barX - 10} y={y + rowH / 2 + 1} fontFamily={MONO} fontSize={11.5} fill={INK} textAnchor="end">
                {r.label}
              </text>
              <rect x={barX} y={y + 6} width={w} height={rowH - 18} rx={4} fill={r.color} opacity={0.85} />
              <text x={barX + w + 8} y={y + rowH / 2 + 1} fontFamily={MONO} fontSize={12} fontWeight={700} fill={r.color}>
                {r.v.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </span>
  );
}

/** Cosine similarity = the angle between two arrows: 1 aligned, 0 perpendicular, −1 opposite. */
export function CosineDiagram() {
  const cells = [
    { title: 'same direction', deg: 8, cos: '+1.0', color: GREEN },
    { title: 'unrelated (90°)', deg: 90, cos: '0.0', color: BLUE },
    { title: 'opposite', deg: 172, cos: '−1.0', color: CORAL_DEEP },
  ];
  const cellW = 126;
  const W = cellW * cells.length;
  const H = 150;
  const len = 40;
  const refAng = -55 * (Math.PI / 180);

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cosine similarity as the angle between two vectors">
        <defs>
          <marker id="cos-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={MUTED} />
          </marker>
        </defs>
        {cells.map((c, i) => {
          const cx = i * cellW + cellW / 2;
          const cy = 62;
          const a2 = refAng + c.deg * (Math.PI / 180);
          const t1 = [cx + len * Math.cos(refAng), cy + len * Math.sin(refAng)];
          const t2 = [cx + len * Math.cos(a2), cy + len * Math.sin(a2)];
          return (
            <g key={c.title}>
              <line x1={cx} y1={cy} x2={t1[0]} y2={t1[1]} stroke={MUTED} strokeWidth={2.5} markerEnd="url(#cos-head)" />
              <line x1={cx} y1={cy} x2={t2[0]} y2={t2[1]} stroke={c.color} strokeWidth={2.5} markerEnd="url(#cos-head)" />
              <circle cx={cx} cy={cy} r={2.5} fill={INK} />
              <text x={cx} y={116} fontFamily={MONO} fontSize={12.5} fontWeight={700} fill={c.color} textAnchor="middle">
                cos = {c.cos}
              </text>
              <text x={cx} y={134} fontFamily={MONO} fontSize={10.5} fill={MUTED} textAnchor="middle">
                {c.title}
              </text>
            </g>
          );
        })}
      </svg>
    </span>
  );
}
