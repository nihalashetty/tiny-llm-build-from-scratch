/**
 * The world: a race track, and a car that can sense and move in it.
 *
 * There is NO learning in this file - it's just physics. The car has five
 * "whisker" sensors that measure how far the wall is in five directions, and it
 * can pick one of five steering actions each tick. WHICH action it picks is the
 * job of a brain (see neuroevolution.ts); here we only define what the sensors
 * feel and what each action does to the car.
 *
 * Everything - the walls, the sensors, and crashing - is built from one tiny
 * geometry primitive: "do these two line segments cross, and if so, where?"
 * Learn that one function and the rest of the file falls out of it.
 */

export interface Vec {
  x: number;
  y: number;
}
export interface Seg {
  a: Vec;
  b: Vec;
}

// The five directions the car "looks", as angles relative to where it's facing:
// hard left, half left, straight ahead, half right, hard right. Each sensor
// reports the distance to the nearest wall along that line - so five numbers
// describe everything the car knows about its surroundings.
export const SENSOR_ANGLES = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2];
export const NUM_SENSORS = SENSOR_ANGLES.length; // 5 inputs to the brain

// The five choices the car can make each tick. No reverse - it always rolls
// forward; it only decides how sharply to turn the wheel.
export const ACTIONS = ['hard left', 'ease left', 'straight', 'ease right', 'hard right'] as const;
export const NUM_ACTIONS = ACTIONS.length; // 5 outputs from the brain
// How much each action bends the heading, in radians per tick. Index matches
// ACTIONS. Agile enough (min turn radius ≈ speed/maxTurn ≈ 12px) to handle the
// sharp corners of the complex tracks.
const TURN_BY = [-0.2, -0.1, 0, 0.1, 0.2];

// How far a sensor can "see". Distances are reported as a fraction of this, so
// every sensor input lands in 0..1: ~0 means "wall right here", 1 means "all clear".
export const SENSOR_RANGE = 220;

const SPEED = 2.4; // constant forward pixels per tick - the brain only steers
const STALE_LIMIT = 90; // ticks allowed with no progress before we call it stuck
// A car that clears this many laps has "solved" the track - we retire it so a
// perfect driver ends its run instead of circling forever.
export const FINISH_LAPS = 3;

/**
 * THE geometry primitive. Given segment P→P2 and segment A→B, return how far
 * along P→P2 they cross (a number `t` in 0..1), or null if they don't. Standard
 * parametric line-intersection: solve for the point that lies on both lines,
 * then check it actually falls within both segments.
 */
function crossAt(p: Vec, p2: Vec, a: Vec, b: Vec): number | null {
  const r = { x: p2.x - p.x, y: p2.y - p.y };
  const s = { x: b.x - a.x, y: b.y - a.y };
  const denom = r.x * s.y - r.y * s.x;
  if (denom === 0) return null; // parallel - never cross
  const t = ((a.x - p.x) * s.y - (a.y - p.y) * s.x) / denom;
  const u = ((a.x - p.x) * r.y - (a.y - p.y) * r.x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null; // crossing is off the ends
  return t;
}

/** Distance from `origin`, looking along `angle`, to the nearest wall (capped at range). */
function rayDistance(origin: Vec, angle: number, walls: Seg[]): number {
  const far: Vec = {
    x: origin.x + Math.cos(angle) * SENSOR_RANGE,
    y: origin.y + Math.sin(angle) * SENSOR_RANGE,
  };
  let nearest = 1; // as a fraction of SENSOR_RANGE
  for (const w of walls) {
    const t = crossAt(origin, far, w.a, w.b);
    if (t !== null && t < nearest) nearest = t;
  }
  return nearest * SENSOR_RANGE;
}

export interface Track {
  walls: Seg[]; // the barriers the car must not touch (inner + outer edge)
  inner: Vec[]; // inner edge as a closed loop of points (for drawing the road)
  outer: Vec[]; // outer edge as a closed loop of points
  gates: Seg[]; // invisible checkpoints across the road; passing one = progress
  gateCenters: Vec[]; // the midpoint of each gate, used to score partial progress
  start: Vec;
  startHeading: number;
}

/**
 * The shape of one track. The car senses only relative wall distances, never its
 * absolute position, so a brain evolved on one shape can drive others it never
 * saw - the whole point of letting you pick which track to train on.
 *
 * The centre line is a wavy loop: an ellipse whose radius is bent by a SUM of
 * sine waves ("harmonics"). One gentle harmonic = a lazy oval; several sharp ones
 * = a genuinely twisty circuit with many different corners.
 */
export interface Harmonic {
  freq: number; // lobes around the loop (integer, so the loop closes cleanly)
  amp: number; // how deep this wave bends the radius
  phase: number; // where its corners fall
}
export interface TrackConfig {
  name: string;
  hard: boolean; // just for labelling in the UI
  rx: number; // base radii of the ellipse
  ry: number;
  rot: number; // rotate the whole shape, so tracks look distinct
  halfW: number; // road half-width (smaller = tighter, harder)
  harmonics: Harmonic[];
}

const h = (freq: number, amp: number, phase = 0): Harmonic => ({ freq, amp, phase });

/**
 * Five tracks: ONE easy warm-up oval and FOUR genuinely nasty ones. The point of
 * letting you choose the training track: train on the easy oval and the brain
 * never meets a real corner, so it crashes out on the hard tracks. Train on a
 * hard one and it learns to actually drive - and then handles all five.
 */
export const TRACKS: TrackConfig[] = [
  {
    name: 'Trainer Oval',
    hard: false,
    rx: 225,
    ry: 170,
    rot: 0,
    halfW: 34, // gentle, almost no corners - easy to survive without real skill
    harmonics: [h(2, 0.05)],
  },
  // The four hard tracks share the same corner "DNA" (harmonics 3/5/7 at equal
  // strengths) so they demand the same driving skill - but different phases,
  // rotations and aspect ratios make each look like its own circuit. Master one
  // and you've mastered them all; that's why any hard track generalizes.
  {
    name: 'The Serpent',
    hard: true,
    rx: 232,
    ry: 166,
    rot: 0.15,
    halfW: 27,
    harmonics: [h(3, 0.15, 0.0), h(5, 0.1, 0.7), h(7, 0.05, 0.0)],
  },
  {
    name: 'Hairpins',
    hard: true,
    rx: 236,
    ry: 160,
    rot: 0.0,
    halfW: 27,
    harmonics: [h(3, 0.15, 1.3), h(5, 0.1, 0.0), h(7, 0.05, 1.1)],
  },
  {
    name: 'The Tangle',
    hard: true,
    rx: 228,
    ry: 170,
    rot: 0.5,
    halfW: 27,
    harmonics: [h(3, 0.15, 2.4), h(5, 0.1, 1.5), h(7, 0.05, 2.0)],
  },
  {
    name: 'Mayhem',
    hard: true,
    rx: 236,
    ry: 158,
    rot: 0.9,
    halfW: 27,
    harmonics: [h(3, 0.15, 0.6), h(5, 0.1, 2.2), h(7, 0.05, 0.4)],
  },
];

export const TRAIN_TRACK = TRACKS[0];

// The drawing surface. Every track is auto-centred to fit inside this with a
// margin, so no track (however wobbly) ever runs off the edge.
export const CANVAS_W = 680;
export const CANVAS_H = 540;

export function buildTrack(cfg: TrackConfig = TRAIN_TRACK): Track {
  const { rx: RX, ry: RY, rot, halfW: HALF_W, harmonics } = cfg;
  const N = 72; // centre-line resolution (higher, so sharp corners stay smooth)
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  // 1. Trace the centre line around the origin (we'll recentre it below).
  const center: Vec[] = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    // Radius = 1 plus every harmonic's contribution. Summing waves is what turns
    // a plain oval into a circuit full of distinct, sharp corners.
    let r = 1;
    for (const w of harmonics) r += w.amp * Math.sin(w.freq * th + w.phase);
    const ex = Math.cos(th) * RX * r;
    const ey = Math.sin(th) * RY * r;
    center.push({ x: ex * cosR - ey * sinR, y: ex * sinR + ey * cosR });
  }

  // 2. Offset each point across the road to get the inner and outer edges.
  const inner: Vec[] = [];
  const outer: Vec[] = [];
  for (let i = 0; i < N; i++) {
    const prev = center[(i - 1 + N) % N];
    const next = center[(i + 1) % N];
    const tx = next.x - prev.x; // tangent direction along the road
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len; // normal = tangent rotated 90° (points across the road)
    const ny = tx / len;
    const c = center[i];
    inner.push({ x: c.x - nx * HALF_W, y: c.y - ny * HALF_W });
    outer.push({ x: c.x + nx * HALF_W, y: c.y + ny * HALF_W });
  }

  // 3. Recentre: shift the whole track so its bounding box sits in the middle of
  //    the canvas. This is what guarantees nothing gets clipped at the edges.
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of outer) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = CANVAS_W / 2 - (minX + maxX) / 2;
  const dy = CANVAS_H / 2 - (minY + maxY) / 2;
  for (const p of center) {
    p.x += dx;
    p.y += dy;
  }
  for (const p of inner) {
    p.x += dx;
    p.y += dy;
  }
  for (const p of outer) {
    p.x += dx;
    p.y += dy;
  }

  // 4. Barriers, checkpoint gates, and the start pose - all from the placed edges.
  const walls: Seg[] = [];
  for (let i = 0; i < N; i++) {
    walls.push({ a: inner[i], b: inner[(i + 1) % N] });
    walls.push({ a: outer[i], b: outer[(i + 1) % N] });
  }

  const gates: Seg[] = [];
  const gateCenters: Vec[] = [];
  const GATES = 12;
  for (let g = 0; g < GATES; g++) {
    const i = Math.round((g * N) / GATES) % N;
    gates.push({ a: inner[i], b: outer[i] });
    gateCenters.push(center[i]);
  }

  // Start on the centre line at point 0, aimed along the road toward gate 1.
  const start = { ...center[0] };
  const startHeading = Math.atan2(center[1].y - center[0].y, center[1].x - center[0].x);
  return { walls, inner, outer, gates, gateCenters, start, startHeading };
}

/**
 * One car driving the track. It holds its own position, its latest sensor
 * readings, and a fitness score - "how far around the loop did I get before I
 * crashed or got stuck?" That score is the ONLY feedback the learning algorithm
 * ever sees. There are no correct-answer labels here.
 */
export class Car {
  x: number;
  y: number;
  heading: number;
  alive = true;
  fitness = 0;
  sensors: number[] = new Array(NUM_SENSORS).fill(1);
  private nextGate: number;
  private passed = 0; // whole checkpoints (and laps) cleared
  private stale = 0; // ticks since the last checkpoint - kills loiterers

  /**
   * `jitter` nudges the starting spot sideways across the road and tilts the
   * heading. During training we start every car a little differently so a brain
   * can't just memorize one exact racing line - it's forced to learn a general
   * "read the whiskers and steer" reflex, which is what lets it drive tracks it
   * never saw. (Domain randomization.) Left off, the car starts dead-centre.
   */
  constructor(
    private track: Track,
    jitter?: { across: number; heading: number },
  ) {
    const perp = track.startHeading + Math.PI / 2;
    const across = jitter?.across ?? 0;
    this.x = track.start.x + Math.cos(perp) * across;
    this.y = track.start.y + Math.sin(perp) * across;
    this.heading = track.startHeading + (jitter?.heading ?? 0);
    this.nextGate = 1; // gate 0 sits at the start line, so aim for the next one
  }

  /** Read the five whiskers into `sensors` (normalized 0..1) and return them. */
  sense(): number[] {
    for (let i = 0; i < NUM_SENSORS; i++) {
      const d = rayDistance(this, this.heading + SENSOR_ANGLES[i], this.track.walls);
      this.sensors[i] = d / SENSOR_RANGE;
    }
    return this.sensors;
  }

  /**
   * Apply one steering action and roll forward one tick. Updates fitness, and
   * flips `alive` to false on a crash or a stall. Does nothing once dead.
   */
  step(action: number): void {
    if (!this.alive) return;
    this.heading += TURN_BY[action] ?? 0;
    const nx = this.x + Math.cos(this.heading) * SPEED;
    const ny = this.y + Math.sin(this.heading) * SPEED;
    const move: Vec = { x: nx, y: ny };

    // Crash = the step crossed a wall.
    for (const w of this.track.walls) {
      if (crossAt(this, move, w.a, w.b) !== null) {
        this.alive = false;
        return;
      }
    }

    // Did we clear the next checkpoint gate this step? If so, score it and aim
    // at the following one (wrapping around for extra laps).
    const gate = this.track.gates[this.nextGate];
    if (crossAt(this, move, gate.a, gate.b) !== null) {
      this.passed++;
      this.nextGate = (this.nextGate + 1) % this.track.gates.length;
      this.stale = 0;
      // Cleared enough laps? Retire as a finisher rather than looping forever.
      if (this.passed >= this.track.gates.length * FINISH_LAPS) {
        this.fitness = this.passed;
        this.alive = false;
        return;
      }
    } else if (++this.stale > STALE_LIMIT) {
      this.alive = false; // going nowhere - free up the slot
      return;
    }

    this.x = nx;
    this.y = ny;

    // Fitness = whole checkpoints cleared + partial credit for creeping toward
    // the next one. The partial term gives the very first random cars a gradient
    // to climb even before any of them clears a single gate.
    const from = this.track.gateCenters[(this.nextGate - 1 + this.track.gates.length) % this.track.gates.length];
    const to = this.track.gateCenters[this.nextGate];
    const span = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const left = Math.hypot(to.x - this.x, to.y - this.y);
    const frac = Math.max(0, Math.min(1, 1 - left / span));
    this.fitness = this.passed + frac;
  }
}
