/**
 * Best-fitness-per-generation as a rising line (SVG). The mirror image of the
 * LossCurve: there we watched error fall, here we watch driving skill climb
 * toward the "solved" line. No chart library - just a polyline over the history.
 */
export function FitnessCurve({
  history,
  max,
  target,
  width = 460,
  height = 170,
}: {
  /** best fitness of each completed generation */
  history: number[];
  /** top of the y-axis */
  max: number;
  /** the "solved" score, drawn as a dashed goal line */
  target?: number;
  width?: number;
  height?: number;
}) {
  const pad = { l: 34, r: 12, t: 12, b: 24 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const n = history.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * w);
  const y = (v: number) => pad.t + h - Math.min(1, v / max) * h;

  const pts = history.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const yTicks = [0, max / 2, max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Best fitness per generation">
      <rect x={pad.l} y={pad.t} width={w} height={h} fill="#fff" stroke="#e2e5ea" />
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y(t)} x2={pad.l + w} y2={y(t)} stroke="#f0f2f5" />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontFamily="'Geist Mono', monospace" fontSize="9" fill="#79808e">
            {t.toFixed(0)}
          </text>
        </g>
      ))}
      {target !== undefined && (
        <>
          <line x1={pad.l} y1={y(target)} x2={pad.l + w} y2={y(target)} stroke="#10866a" strokeWidth="1" strokeDasharray="4 3" opacity={0.7} />
          <text x={pad.l + w} y={y(target) - 4} textAnchor="end" fontFamily="'Geist Mono', monospace" fontSize="9" fill="#10866a">
            solved
          </text>
        </>
      )}
      {n > 1 && <polyline points={pts.join(' ')} fill="none" stroke="#10866a" strokeWidth="2" />}
      {n >= 1 && <circle cx={x(n - 1)} cy={y(history[n - 1])} r="3" fill="#10866a" />}
      <text x={pad.l} y={height - 6} fontFamily="'Geist Mono', monospace" fontSize="9" fill="#79808e">
        training time →
      </text>
    </svg>
  );
}
