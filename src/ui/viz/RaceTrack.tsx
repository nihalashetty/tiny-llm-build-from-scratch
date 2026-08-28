import { useEffect, useRef } from 'react';
import { CANVAS_W, CANVAS_H, SENSOR_ANGLES, SENSOR_RANGE, type Car, type Track, type Vec } from '../../llm/car-track';

/**
 * Draws a track and a set of cars on a canvas, redrawing every frame (keyed on
 * `tick`). Living cars are coral triangles; the `leader` is drawn in green with
 * its five sensor whiskers extended, so you can watch what that driver is
 * "feeling" as it steers. Used for both the training pack and the lone champion.
 */
const W = CANVAS_W;
const H = CANVAS_H;

function poly(ctx: CanvasRenderingContext2D, pts: Vec[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

export function RaceTrack({
  track,
  cars,
  leader,
  tick,
  size = W,
}: {
  track: Track;
  cars: Car[];
  leader: Car;
  tick: number;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Road surface = fill the outer loop, then punch out the infield.
    poly(ctx, track.outer);
    ctx.fillStyle = '#eef1f6';
    ctx.fill();
    poly(ctx, track.inner);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Walls.
    ctx.strokeStyle = '#c2c8d2';
    ctx.lineWidth = 2.5;
    poly(ctx, track.outer);
    ctx.stroke();
    poly(ctx, track.inner);
    ctx.stroke();

    // Start / finish line (gate 0).
    const g0 = track.gates[0];
    ctx.strokeStyle = '#10866a';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(g0.a.x, g0.a.y);
    ctx.lineTo(g0.b.x, g0.b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cars: a little triangle pointing along the heading.
    for (const car of cars) {
      const isLeader = car === leader && car.alive;
      ctx.globalAlpha = car.alive || isLeader ? 1 : 0.18; // crashed cars fade out
      const c = Math.cos(car.heading);
      const s = Math.sin(car.heading);
      const nose = { x: car.x + c * 9, y: car.y + s * 9 };
      const bl = { x: car.x - c * 6 - s * 4.5, y: car.y - s * 6 + c * 4.5 };
      const br = { x: car.x - c * 6 + s * 4.5, y: car.y - s * 6 - c * 4.5 };
      ctx.beginPath();
      ctx.moveTo(nose.x, nose.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.lineTo(br.x, br.y);
      ctx.closePath();
      ctx.fillStyle = isLeader ? '#10866a' : '#e0553a';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // The leader's five sensor whiskers, showing how far it sees each way.
    if (leader.alive) {
      ctx.lineWidth = 1.25;
      for (let i = 0; i < SENSOR_ANGLES.length; i++) {
        const ang = leader.heading + SENSOR_ANGLES[i];
        const dist = leader.sensors[i] * SENSOR_RANGE;
        const ex = leader.x + Math.cos(ang) * dist;
        const ey = leader.y + Math.sin(ang) * dist;
        ctx.strokeStyle = 'rgba(16,134,106,0.35)';
        ctx.beginPath();
        ctx.moveTo(leader.x, leader.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#10866a';
        ctx.fill();
      }
    }
  }, [track, cars, leader, tick]);

  return (
    <span className="canvas-frame" style={{ display: 'block' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ borderRadius: 8, width: '100%', maxWidth: size, height: 'auto' }}
      />
    </span>
  );
}
