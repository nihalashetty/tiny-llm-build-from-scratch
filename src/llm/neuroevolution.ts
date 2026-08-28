/**
 * Teaching a car to drive with NO teacher.
 *
 * Every other network in this course learned by backpropagation: we knew the
 * right answer for each example and nudged the weights toward it. But nobody can
 * say what the "right" steering is at every instant on a track - so backprop has
 * nothing to push against.
 *
 * So we borrow a different idea, straight from biology: EVOLUTION. Instead of one
 * network we breed a whole POPULATION of them, each with random weights. We let
 * them all drive, keep the ones that got furthest, and build the next generation
 * from copies of those survivors - with small random "mutations" to their weights.
 * Repeat, and driving skill accumulates across generations. No gradients, no
 * labels, no calculus. Just: the ones that do best get to have offspring.
 *
 *   fitness   - a single score: how far around the track a car got.
 *   selection - keep the highest-scoring cars, discard the rest.
 *   crossover - a child mixes weights from two surviving parents.
 *   mutation  - jitter a few of the child's weights, so new behaviour can appear.
 */

import { makeRng, gaussian, uniform, type Rng } from './rng';
import { Car, buildTrack, TRAIN_TRACK, NUM_SENSORS, NUM_ACTIONS, type Track, type TrackConfig } from './car-track';

// Two hidden layers between the five sensors and the five steering choices.
// The two middle layers let the car learn combinations like "wall close on the
// right AND clear ahead → ease left" that a single layer can't express.
const HIDDEN = [7, 5];
export const LAYERS = [NUM_SENSORS, ...HIDDEN, NUM_ACTIONS]; // [5, 7, 5, 5]

const tanh = Math.tanh; // squashes any number into -1..1; the neuron's "activation"

/**
 * A car's brain: a plain feed-forward network. The genes that evolution tweaks
 * ARE its weights and biases - nothing else. It never trains itself; it just
 * turns five sensor readings into a choice of steering.
 */
export class CarBrain {
  readonly layers = LAYERS;
  // weights[l][from][to]: the wire from node `from` in layer l to node `to` in
  // layer l+1. biases[l][to]: the bias added at node `to` of layer l+1.
  weights: number[][][] = [];
  biases: number[][] = [];

  constructor(rng: Rng) {
    for (let l = 0; l < LAYERS.length - 1; l++) {
      const from = LAYERS[l];
      const to = LAYERS[l + 1];
      this.weights.push(Array.from({ length: from }, () => Array.from({ length: to }, () => gaussian(rng))));
      this.biases.push(Array.from({ length: to }, () => gaussian(rng)));
    }
  }

  /** Run the five sensor values forward through the layers to five output scores. */
  forward(inputs: number[]): number[] {
    let a = inputs;
    for (let l = 0; l < this.weights.length; l++) {
      const next = new Array<number>(this.layers[l + 1]).fill(0);
      for (let to = 0; to < next.length; to++) {
        let sum = this.biases[l][to];
        for (let from = 0; from < a.length; from++) sum += a[from] * this.weights[l][from][to];
        // Squash hidden layers; leave the final scores raw (we only compare them).
        next[to] = l < this.weights.length - 1 ? tanh(sum) : sum;
      }
      a = next;
    }
    return a;
  }

  /** Pick the steering action with the highest score - the car's decision. */
  act(inputs: number[]): number {
    const out = this.forward(inputs);
    let best = 0;
    for (let i = 1; i < out.length; i++) if (out[i] > out[best]) best = i;
    return best;
  }

  /** A weight-for-weight duplicate (used to carry an elite into the next generation). */
  clone(): CarBrain {
    const c = Object.create(CarBrain.prototype) as CarBrain;
    (c as { layers: number[] }).layers = this.layers;
    c.weights = this.weights.map((layer) => layer.map((row) => row.slice()));
    c.biases = this.biases.map((row) => row.slice());
    return c;
  }

  /**
   * CROSSOVER - breed two parents into a child. For every single weight we flip
   * a coin and take mum's or dad's. The child is a fresh recombination of two
   * driving styles that both worked.
   */
  static crossover(mum: CarBrain, dad: CarBrain, rng: Rng): CarBrain {
    const child = mum.clone();
    for (let l = 0; l < child.weights.length; l++) {
      for (let from = 0; from < child.weights[l].length; from++)
        for (let to = 0; to < child.weights[l][from].length; to++)
          if (rng() < 0.5) child.weights[l][from][to] = dad.weights[l][from][to];
      for (let to = 0; to < child.biases[l].length; to++)
        if (rng() < 0.5) child.biases[l][to] = dad.biases[l][to];
    }
    return child;
  }

  /**
   * MUTATION - with probability `rate`, nudge each weight by a small random
   * amount. This is where genuinely new behaviour comes from: without it the
   * population could only ever shuffle the weights it started with.
   */
  mutate(rng: Rng, rate: number, strength: number): void {
    const jitter = (v: number) => (rng() < rate ? v + gaussian(rng) * strength : v);
    for (let l = 0; l < this.weights.length; l++) {
      for (let from = 0; from < this.weights[l].length; from++)
        for (let to = 0; to < this.weights[l][from].length; to++)
          this.weights[l][from][to] = jitter(this.weights[l][from][to]);
      for (let to = 0; to < this.biases[l].length; to++)
        this.biases[l][to] = jitter(this.biases[l][to]);
    }
  }
}

export interface PopulationOptions {
  size?: number; // how many cars per generation
  elites?: number; // top cars copied unchanged into the next generation
  mutationRate?: number; // chance each weight is jittered
  mutationStrength?: number; // size of a jitter
  seed?: number;
  trackConfig?: TrackConfig; // which track to evolve on (defaults to the training track)
  jitterStarts?: boolean; // randomize each car's start (domain randomization); default on
}

/**
 * The whole colony of cars, and the machinery that turns one generation into a
 * better next one. A generation plays out over many ticks (call `step` each
 * animation frame until `allDone`); then `evolve` breeds the survivors.
 */
export class Population {
  readonly track: Track;
  brains: CarBrain[];
  cars: Car[];
  generation = 1;
  bestFitness = 0; // best score seen in the generation just finished
  history: number[] = []; // best fitness per generation - the curve that should climb
  champion: CarBrain; // best brain so far, for display

  private size: number;
  private elites: number;
  private mutationRate: number;
  private mutationStrength: number;
  private rng: Rng;
  private jitterStarts: boolean;
  private jitterAcross: number; // how far sideways a start can be nudged

  constructor(opts: PopulationOptions = {}) {
    this.size = opts.size ?? 40;
    this.elites = opts.elites ?? 4;
    this.mutationRate = opts.mutationRate ?? 0.15;
    this.mutationStrength = opts.mutationStrength ?? 0.5;
    this.rng = makeRng(opts.seed ?? 7);
    const cfg = opts.trackConfig ?? TRAIN_TRACK;
    this.track = buildTrack(cfg);
    this.jitterStarts = opts.jitterStarts ?? true;
    this.jitterAcross = cfg.halfW * 0.55;
    this.brains = Array.from({ length: this.size }, () => new CarBrain(this.rng));
    this.cars = this.brains.map(() => this.spawn());
    this.champion = this.brains[0];
  }

  /**
   * A fresh car at the start line. When domain randomization is on, each one is
   * nudged sideways and turned a little, so brains must cope with varied starts
   * instead of memorizing a single racing line - which is what makes the winner
   * a general driver rather than a one-track specialist.
   */
  private spawn(): Car {
    if (!this.jitterStarts) return new Car(this.track);
    return new Car(this.track, {
      across: uniform(this.rng, -this.jitterAcross, this.jitterAcross),
      heading: uniform(this.rng, -0.4, 0.4),
    });
  }

  /** How many cars are still driving. When this hits 0 the generation is over. */
  get aliveCount(): number {
    return this.cars.reduce((n, c) => n + (c.alive ? 1 : 0), 0);
  }
  get allDone(): boolean {
    return this.aliveCount === 0;
  }

  /** Advance every still-alive car by one tick: sense → decide → move. */
  step(): void {
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (!car.alive) continue;
      car.step(this.brains[i].act(car.sense()));
    }
  }

  /** The car currently in the lead this generation, for the sensor overlay. */
  leader(): Car {
    let best = this.cars[0];
    for (const c of this.cars) if (c.fitness > best.fitness) best = c;
    return best;
  }

  /**
   * Build the next generation from the current one. This is the entire "learning"
   * step - it runs once per generation, between simulation runs:
   *   1. rank the cars by fitness,
   *   2. copy the very best (the elites) over untouched,
   *   3. fill the rest with children of two well-ranked parents, then mutate.
   */
  evolve(): void {
    // 1. RANK - pair each brain with its car's score and sort best-first.
    const ranked = this.brains
      .map((brain, i) => ({ brain, fitness: this.cars[i].fitness }))
      .sort((a, b) => b.fitness - a.fitness);

    this.bestFitness = ranked[0].fitness;
    this.history.push(this.bestFitness);
    this.champion = ranked[0].brain;

    // Parents come from the top half - the drivers worth learning from.
    const survivors = ranked.slice(0, Math.max(2, Math.floor(this.size / 2))).map((r) => r.brain);
    const pick = () => survivors[Math.floor(this.rng() * survivors.length)];

    const next: CarBrain[] = [];
    // 2. ELITES - the best few carry over exactly, so we never lose our best driver.
    for (let i = 0; i < this.elites && i < ranked.length; i++) next.push(ranked[i].brain.clone());
    // 3. CHILDREN - breed and mutate until the population is full again.
    while (next.length < this.size) {
      const child = CarBrain.crossover(pick(), pick(), this.rng);
      child.mutate(this.rng, this.mutationRate, this.mutationStrength);
      next.push(child);
    }

    this.brains = next;
    this.cars = next.map(() => this.spawn());
    this.generation++;
  }
}
