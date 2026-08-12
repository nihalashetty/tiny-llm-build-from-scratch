/**
 * Two loss curves on one chart: the loss on text the model TRAINS on (coral) and
 * the loss on held-out text it never sees (blue). When they fan apart - training
 * loss diving while the held-out loss climbs - that gap is overfitting, drawn
 * live. An optional dashed baseline marks "random guessing" (loss = ln V), so a
 * held-out curve rising above it visibly means "worse than a coin toss".
 */
export function DualLossCurve({
  train,
  val,
  width = 460,
  height = 190,
  max,
  baseline,
}: {
  train: number[];
  val: number[];
  width?: number;
  height?: number;
  max?: number;
  baseline?: number;
}) {
  const pad = { l: 40, r: 12, t: 14, b: 24 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const yMax = max ?? Math.max(0.5, ...train, ...val, baseline ?? 0);
  const n = Math.max(train.length, val.length);

  const toPts = (hist: number[]) =>
    hist
      .map((v, i) => {
        const x = pad.l + (n <= 1 ? 0 : (i / (n - 1)) * w);
        const y = pad.t + h - Math.min(1, v / yMax) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const yTicks = [0, yMax / 2, yMax];
  const baseY = baseline !== undefined ? pad.t + h - Math.min(1, baseline / yMax) * h : null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Training vs held-out loss over time">
      <rect x={pad.l} y={pad.t} width={w} height={h} fill="#fff" stroke="#e2e5ea" />
      {yTicks.map((t, i) => {
        const y = pad.t + h - (t / yMax) * h;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + w} y2={y} stroke="#f0f2f5" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#79808e">
              {t.toFixed(1)}
            </text>
          </g>
        );
      })}

      {baseY !== null && (
        <g>
          <line x1={pad.l} y1={baseY} x2={pad.l + w} y2={baseY} stroke="#b7a98f" strokeWidth="1.2" strokeDasharray="4 3" />
          <text x={pad.l + w - 4} y={baseY - 4} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#9c8d76">
            random guess
          </text>
        </g>
      )}

      {val.length > 1 && <polyline points={toPts(val)} fill="none" stroke="#3e6ff0" strokeWidth="2" />}
      {train.length > 1 && <polyline points={toPts(train)} fill="none" stroke="#e0553a" strokeWidth="2" />}

      <text x={pad.l} y={height - 7} fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#79808e">
        training time →
      </text>

      {/* legend */}
      <g fontFamily="'JetBrains Mono', monospace" fontSize="10">
        <line x1={pad.l + 8} y1={pad.t + 6} x2={pad.l + 26} y2={pad.t + 6} stroke="#e0553a" strokeWidth="2" />
        <text x={pad.l + 30} y={pad.t + 9} fill="#7c7266">training</text>
        <line x1={pad.l + 92} y1={pad.t + 6} x2={pad.l + 110} y2={pad.t + 6} stroke="#3e6ff0" strokeWidth="2" />
        <text x={pad.l + 114} y={pad.t + 9} fill="#7c7266">held-out</text>
      </g>
    </svg>
  );
}
