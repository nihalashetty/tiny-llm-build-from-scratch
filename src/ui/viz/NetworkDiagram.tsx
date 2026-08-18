/**
 * A live diagram of the actual network: circles are neurons, lines are weights.
 * A line is coral when its weight is positive, blue when negative, and thicker
 * the stronger it is. As the network trains, the wires visibly shift - that IS
 * "learning": the numbers on these connections being nudged.
 */
export function NetworkDiagram({
  layers,
  weights,
  inputLabels,
  outputLabel = 'ŷ',
  height = 190,
}: {
  /** node count per layer, e.g. [2, 4, 1] */
  layers: number[];
  /** weights[l][from][to] connects a node in layer l to one in layer l+1 */
  weights: number[][][];
  inputLabels?: string[];
  outputLabel?: string;
  height?: number;
}) {
  const W = 440;
  const H = height;
  const padX = 46;
  const colX = (l: number) => padX + (l * (W - 2 * padX)) / (layers.length - 1);
  const nodeY = (count: number, i: number) => {
    const gap = H / (count + 1);
    return gap * (i + 1);
  };

  let maxAbs = 1e-6;
  for (const layer of weights)
    for (const row of layer) for (const w of row) maxAbs = Math.max(maxAbs, Math.abs(w));

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="The network's neurons and weights">
        {/* edges */}
        {weights.map((layer, l) =>
          layer.map((row, from) =>
            row.map((w, to) => {
              const x1 = colX(l);
              const y1 = nodeY(layers[l], from);
              const x2 = colX(l + 1);
              const y2 = nodeY(layers[l + 1], to);
              const mag = Math.abs(w) / maxAbs;
              return (
                <line
                  key={`${l}-${from}-${to}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={w >= 0 ? '#e0553a' : '#3e6ff0'}
                  strokeWidth={0.5 + mag * 3.5}
                  opacity={0.2 + mag * 0.65}
                />
              );
            }),
          ),
        )}

        {/* nodes */}
        {layers.map((count, l) =>
          Array.from({ length: count }, (_, i) => {
            const isInput = l === 0;
            const isOutput = l === layers.length - 1;
            const label = isInput ? inputLabels?.[i] : isOutput ? outputLabel : '';
            return (
              <g key={`n-${l}-${i}`}>
                <circle
                  cx={colX(l)}
                  cy={nodeY(count, i)}
                  r={15}
                  fill={isInput ? '#d7e5ff' : isOutput ? '#c9ecdb' : '#ffe6b0'}
                  stroke={isInput ? '#3e6ff0' : isOutput ? '#10866a' : '#e0a53c'}
                  strokeWidth="1.5"
                />
                {label && (
                  <text
                    x={colX(l)}
                    y={nodeY(count, i) + 4}
                    textAnchor="middle"
                    fontFamily="'Geist Mono', monospace"
                    fontSize="12"
                    fill="#16181d"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          }),
        )}

        {/* layer captions */}
        <text x={colX(0)} y={H - 4} textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="9.5" fill="#79808e">
          inputs
        </text>
        {layers.length === 3 && (
          <text x={colX(1)} y={H - 4} textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="9.5" fill="#79808e">
            hidden layer
          </text>
        )}
        <text x={colX(layers.length - 1)} y={H - 4} textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="9.5" fill="#79808e">
          output
        </text>
      </svg>
    </span>
  );
}
