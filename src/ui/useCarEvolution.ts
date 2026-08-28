import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Population, type CarBrain, type PopulationOptions } from '../llm/neuroevolution';
import { Car, buildTrack, FINISH_LAPS, type TrackConfig } from '../llm/car-track';

/**
 * Drives the neuroevolution demo on the main thread. Unlike useRafTrainer (which
 * runs N training epochs per frame), a generation here plays out over MANY ticks:
 * every frame we advance the living cars a few ticks; once they've all crashed or
 * finished, we breed the next generation and start again. `tick` bumps every
 * frame so the canvas redraws; the model (`pop`) is mutated in place.
 */
export interface EvolutionState {
  pop: Population;
  generation: number;
  /** best score in the generation currently on screen (live) */
  bestLive: number;
  aliveCount: number;
  /** best fitness of each completed generation */
  history: number[];
  /** best-so-far sampled every frame - a smooth climbing curve to plot */
  curve: number[];
  running: boolean;
  solved: boolean;
  tick: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useCarEvolution(
  opts: PopulationOptions = {},
  ticksPerFrame = 3,
  maxGenerations = 60,
): EvolutionState {
  // Rebuild from scratch whenever the seed, size, or TRAINING TRACK changes.
  const make = useCallback(() => new Population(opts), [opts.seed, opts.size, opts.trackConfig]);
  const [pop, setPop] = useState<Population>(make);
  // Score that counts as "solved" (all laps). Read from the live model - don't
  // build a throwaway Population each render just to read the gate count.
  const finishFitness = pop.track.gates.length * FINISH_LAPS;
  const [generation, setGeneration] = useState(1);
  const [history, setHistory] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const [tick, setTick] = useState(0);

  const rafId = useRef<number | null>(null);
  const runningRef = useRef(false);
  const popRef = useRef(pop);
  popRef.current = pop;
  // Best fitness reached by ANY car at ANY point, sampled every frame. This is
  // what the graph plots: a smooth line that climbs the whole time, instead of
  // one dot per generation (which looked empty when a track solves in a few gens).
  const bestEverRef = useRef(0);
  const curveRef = useRef<number[]>([]);

  const sampleCurve = () => {
    const p = popRef.current;
    bestEverRef.current = Math.max(bestEverRef.current, p.cars.length ? p.leader().fitness : 0);
    const c = curveRef.current;
    c.push(bestEverRef.current);
    // Keep it light: once it gets long, drop every other point (coarser, same shape).
    if (c.length > 500) curveRef.current = c.filter((_, i) => i % 2 === 0);
  };

  const frame = useCallback(() => {
    if (!runningRef.current) return;
    const p = popRef.current;

    for (let i = 0; i < ticksPerFrame; i++) {
      if (p.allDone) {
        // Generation over: record its winner, then breed the next one.
        p.evolve();
        setHistory([...p.history]);
        setGeneration(p.generation);
        if (p.bestFitness >= finishFitness || p.generation > maxGenerations) {
          setSolved(p.bestFitness >= finishFitness);
          sampleCurve();
          runningRef.current = false;
          setRunning(false);
          setTick((t) => t + 1);
          return;
        }
        break; // let the fresh generation render before stepping it
      }
      p.step();
    }

    sampleCurve();
    setTick((t) => t + 1); // force a re-render so the canvas + stats refresh
    rafId.current = requestAnimationFrame(frame);
  }, [ticksPerFrame, finishFitness, maxGenerations]);

  const start = useCallback(() => {
    if (runningRef.current || solved) return;
    runningRef.current = true;
    setRunning(true);
    rafId.current = requestAnimationFrame(frame);
  }, [frame, solved]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const p = make();
    popRef.current = p;
    setPop(p);
    setGeneration(1);
    setHistory([]);
    bestEverRef.current = 0;
    curveRef.current = [];
    setRunning(false);
    setSolved(false);
    setTick((t) => t + 1);
  }, [make]);

  // When the training track changes (make identity changes), rebuild fresh.
  // Skip the very first run - useState(make) already built the initial one.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    reset();
  }, [reset]);

  // StrictMode-safe: clear the running flag on unmount so the loop can restart.
  useEffect(
    () => () => {
      runningRef.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  // Read live from the model (tick forces a re-render each frame), so these are
  // never stale - including before the first frame, when all cars are still alive.
  return {
    pop,
    generation,
    bestLive: pop.cars.length ? pop.leader().fitness : 0,
    aliveCount: pop.aliveCount,
    history,
    curve: curveRef.current,
    running,
    solved,
    tick,
    start,
    pause,
    reset,
  };
}

/**
 * Runs a SINGLE trained brain around a chosen track, on a loop (it respawns
 * whenever it crashes or finishes its laps). No evolution happens here - it's
 * pure showing-off, used to watch a champion drive tracks it never trained on.
 */
export interface TestDriveState {
  track: ReturnType<typeof buildTrack>;
  car: Car;
  laps: number;
  /** furthest checkpoints reached on this track across attempts (shows failure) */
  best: number;
  tick: number;
}

export function useTestDrive(
  brain: CarBrain | null,
  cfg: TrackConfig,
  enabled: boolean,
  ticksPerFrame = 3,
): TestDriveState {
  const track = useMemo(() => buildTrack(cfg), [cfg]);
  const [tick, setTick] = useState(0);
  const carRef = useRef<Car>(new Car(track));
  const lapsRef = useRef(0);
  const bestRef = useRef(0);
  const rafId = useRef<number | null>(null);
  const runningRef = useRef(false);
  const brainRef = useRef(brain);
  brainRef.current = brain;

  // Fresh car whenever the track changes; forget past progress.
  useEffect(() => {
    carRef.current = new Car(track);
    lapsRef.current = 0;
    bestRef.current = 0;
    setTick((t) => t + 1);
  }, [track]);

  const frame = useCallback(() => {
    if (!runningRef.current) return;
    const b = brainRef.current;
    for (let i = 0; i < ticksPerFrame; i++) {
      const car = carRef.current;
      bestRef.current = Math.max(bestRef.current, car.fitness);
      if (!car.alive) {
        // Crashed or completed its laps - send a fresh copy out to keep driving.
        lapsRef.current = Math.max(lapsRef.current, Math.floor(car.fitness / track.gates.length));
        carRef.current = new Car(track);
        continue;
      }
      car.step(b ? b.act(car.sense()) : 2);
    }
    const live = Math.floor(carRef.current.fitness / track.gates.length);
    if (live > lapsRef.current) lapsRef.current = live;
    setTick((t) => t + 1);
    rafId.current = requestAnimationFrame(frame);
  }, [track, ticksPerFrame]);

  useEffect(() => {
    if (enabled && brainRef.current) {
      runningRef.current = true;
      rafId.current = requestAnimationFrame(frame);
    }
    return () => {
      runningRef.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled, frame]);

  return { track, car: carRef.current, laps: lapsRef.current, best: bestRef.current, tick };
}
