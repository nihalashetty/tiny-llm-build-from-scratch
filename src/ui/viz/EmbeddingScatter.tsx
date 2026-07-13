interface Pt {
  word: string;
  x: number;
  y: number;
}

/**
 * 2D scatter of word vectors (already PCA-projected). Every word is a faint
 * dot; a curated set gets labels; the words in the current analogy get
 * highlighted, with arrows showing the "b − a" and "result − c" directions that
 * should be parallel when the analogy works.
 */
export function EmbeddingScatter({
  points,
  labelWords,
  highlight = [],
  arrows = [],
  size = 340,
}: {
  points: Pt[];
  labelWords: string[];
  highlight?: { word: string; color: string }[];
  arrows?: { from: string; to: string; color: string }[];
  size?: number;
}) {
  if (points.length === 0) return null;
  const pad = 26;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (size - 2 * pad);
  const sy = (y: number) => size - (pad + ((y - minY) / (maxY - minY || 1)) * (size - 2 * pad));

  const byWord = new Map(points.map((p) => [p.word, p]));
  const labelSet = new Set(labelWords);
  const hiMap = new Map(highlight.map((h) => [h.word, h.color]));

  return (
    <span className="canvas-frame">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Word vectors in 2D">
        <defs>
          <marker id="scatter-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8a7d6b" />
          </marker>
        </defs>

        {/* every word: a faint dot */}
        {points.map((p) => {
          const hi = hiMap.get(p.word);
          const labeled = labelSet.has(p.word) || hi;
          return (
            <g key={p.word}>
              <circle cx={sx(p.x)} cy={sy(p.y)} r={hi ? 5 : 3} fill={hi ?? (labeled ? '#8a7d6b' : '#d8c9b2')} />
              {labeled && (
                <text
                  x={sx(p.x) + 7}
                  y={sy(p.y) + 3.5}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize={hi ? 12 : 10.5}
                  fontWeight={hi ? 700 : 400}
                  fill={hi ?? '#4a423b'}
                >
                  {p.word}
                </text>
              )}
            </g>
          );
        })}

        {/* analogy arrows */}
        {arrows.map((a, i) => {
          const f = byWord.get(a.from);
          const t = byWord.get(a.to);
          if (!f || !t) return null;
          return (
            <line
              key={i}
              x1={sx(f.x)}
              y1={sy(f.y)}
              x2={sx(t.x)}
              y2={sy(t.y)}
              stroke={a.color}
              strokeWidth="2"
              strokeDasharray="4 3"
              markerEnd="url(#scatter-arrow)"
              opacity="0.85"
            />
          );
        })}
      </svg>
    </span>
  );
}
