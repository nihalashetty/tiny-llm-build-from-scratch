/**
 * A minimal loss-over-time line chart (SVG). No chart library - just maps the
 * history array to a polyline. Falling line = the model getting less wrong.
 */
export function LossCurve({
  history,
  width = 460,
  height = 150,
  max,
}: {
  history: number[];
  width?: number;
  height?: number;
  max?: number;
}) {
  const pad = { l: 40, r: 12, t: 12, b: 22 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const yMax = max ?? Math.max(0.05, ...history);
  const n = history.length;

  const pts = history.map((v, i) => {
    const x = pad.l + (n <= 1 ? 0 : (i / (n - 1)) * w);
    const y = pad.t + h - Math.min(1, v / yMax) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const yTicks = [0, yMax / 2, yMax];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Training loss over time">
      <rect x={pad.l} y={pad.t} width={w} height={h} fill="#fff" stroke="#e2e5ea" />
      {yTicks.map((t, i) => {
        const y = pad.t + h - (t / yMax) * h;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + w} y2={y} stroke="#f0f2f5" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontFamily="'Geist Mono', monospace" fontSize="9" fill="#79808e">
              {t.toFixed(2)}
            </text>
          </g>
        );
      })}
      {n > 1 && <polyline points={pts.join(' ')} fill="none" stroke="#e0553a" strokeWidth="2" />}
      <text x={pad.l} y={height - 6} fontFamily="'Geist Mono', monospace" fontSize="9" fill="#79808e">
        training time →
      </text>
    </svg>
  );
}
