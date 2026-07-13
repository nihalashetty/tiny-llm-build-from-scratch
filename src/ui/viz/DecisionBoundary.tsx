import { useEffect, useRef } from 'react';
import { INPUTS } from '../../llm/perceptron';

/**
 * Paints a model's output across the input square [0,1]² as a heatmap (cool =
 * predicts 0, coral = predicts 1), with the four training examples on top,
 * coloured by the output you asked for. For a single perceptron we also draw its
 * decision LINE — the one straight cut it's allowed — so you can see, with your
 * own eyes, why it can't separate XOR's diagonal corners.
 */
export function DecisionBoundary({
  predict,
  tick,
  size = 220,
  targets = [0, 1, 1, 0],
  line,
}: {
  predict: (x: [number, number]) => number;
  tick: number;
  size?: number;
  /** desired output for each of the 4 INPUTS, for colouring the dots */
  targets?: number[];
  /** [w0, w1, b] of a single perceptron — draws its 0.5 decision line */
  line?: [number, number, number];
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
        const rr = Math.round(99 + v * (240 - 99));
        const gg = Math.round(158 + v * (102 - 158));
        const bb = Math.round(240 + v * (62 - 240));
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(c * cell, r * cell, cell + 1, cell + 1);
      }
    }

    // the single perceptron's decision line (where output crosses 0.5)
    if (line) {
      const [w0, w1, b] = line;
      const toPx = (x0: number, x1: number): [number, number] => [x0 * size, (1 - x1) * size];
      let p0: [number, number];
      let p1: [number, number];
      if (Math.abs(w1) > 1e-6) {
        p0 = toPx(0, -b / w1);
        p1 = toPx(1, -(w0 + b) / w1);
      } else {
        const x0v = -b / (w0 || 1e-6);
        p0 = toPx(x0v, 0);
        p1 = toPx(x0v, 1);
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      ctx.strokeStyle = '#26211d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    }

    // the four training examples, coloured by the output we want
    INPUTS.forEach((x, i) => {
      const px = x[0] * size;
      const py = (1 - x[1]) * size;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = targets[i] === 1 ? '#f0663e' : '#3e6ff0';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    });
  }, [predict, tick, size, targets, line]);

  return (
    <span className="canvas-frame">
      <canvas ref={ref} width={size} height={size} style={{ borderRadius: 8, width: size, height: size }} />
    </span>
  );
}
