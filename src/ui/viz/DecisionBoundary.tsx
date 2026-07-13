import { useEffect, useRef } from 'react';
import { XOR_DATA } from '../../llm/perceptron';

/**
 * Paints a model's output across the input square [0,1]² as a heatmap (cool =
 * predicts 0, coral = predicts 1), with the four XOR examples on top. As the
 * network trains you can watch the flat wash bend into the checkerboard that
 * XOR requires — the thing a single straight line can never do.
 */
export function DecisionBoundary({
  predict,
  tick,
  size = 220,
}: {
  predict: (x: [number, number]) => number;
  tick: number;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const res = 48;
    const cell = size / res;
    for (let r = 0; r < res; r++) {
      for (let c = 0; c < res; c++) {
        const x0 = c / (res - 1);
        const x1 = 1 - r / (res - 1);
        const v = predict([x0, x1]);
        // interpolate cool-blue (0) → coral (1)
        const rr = Math.round(99 + v * (240 - 99));
        const gg = Math.round(158 + v * (102 - 158));
        const bb = Math.round(240 + v * (62 - 240));
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(c * cell, r * cell, cell + 1, cell + 1);
      }
    }

    // the four XOR points
    for (const { x, y } of XOR_DATA) {
      const px = x[0] * size;
      const py = (1 - x[1]) * size;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = y === 1 ? '#f0663e' : '#3e6ff0';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }, [predict, tick, size]);

  return (
    <span className="canvas-frame">
      <canvas ref={ref} width={size} height={size} style={{ borderRadius: 8, width: size, height: size }} />
    </span>
  );
}
