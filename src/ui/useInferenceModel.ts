import { useEffect, useRef, useState } from 'react';
import { TinyTransformer } from '../llm/transformer';
import { corpusText } from '../llm/corpus/little-kingdom';

/**
 * Part 2 is about *inference*, so the reader shouldn't have to press "Train".
 * This hook builds the TinyTransformer once and quietly warms it up in the
 * background the first time a chapter mounts. Once `ready` flips true, the
 * weights are - for the rest of the chapter - frozen, and every widget just
 * runs the finished model forward.
 *
 * Why a `setInterval` and not `requestAnimationFrame`? Two reasons:
 *   1. StrictMode-safety. React 18's dev mount→unmount→remount double-invoke
 *      makes an auto-started rAF loop easy to leave dangling; a plain interval
 *      keyed off the model's own `step` counter restarts cleanly on remount.
 *   2. Background tabs. rAF is *paused* when a tab isn't visible, so a warm-up
 *      that depends on it can stall; a timer keeps making progress.
 *
 * It's the honest picture: training happened once; now we only read the model.
 */
export function useInferenceModel(opts?: { seed?: number; steps?: number }) {
  const steps = opts?.steps ?? 800;
  const seed = opts?.seed ?? 3;

  // Build the model exactly once. The ref survives StrictMode's fake unmount, so
  // warm-up progress (model.step) is never thrown away and restarted.
  const modelRef = useRef<TinyTransformer | null>(null);
  if (modelRef.current === null) {
    modelRef.current = new TinyTransformer(corpusText, { dim: 24, context: 16, lr: 0.01, seed });
  }
  const model = modelRef.current;

  const [epoch, setEpoch] = useState(model.step);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (model.step >= steps) return; // already warm (e.g. a StrictMode remount)
    const perTick = 10;
    const id = window.setInterval(() => {
      for (let i = 0; i < perTick && model.step < steps; i++) model.trainStep();
      setEpoch(model.step);
      setTick((t) => t + 1);
      if (model.step >= steps) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [model, steps]);

  return {
    model,
    ready: epoch >= steps,
    progress: Math.min(1, epoch / steps),
    epoch,
    tick,
  };
}
