import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drives an incremental training loop on the main thread, a few steps per
 * animation frame, so the UI stays responsive AND the reader literally watches
 * the model improve. The model is mutated in place; `tick` bumps every frame so
 * canvas/SVG visualizations know to redraw.
 */
export interface TrainerState<M> {
  model: M;
  epoch: number;
  loss: number | null;
  lossHistory: number[];
  running: boolean;
  done: boolean;
  tick: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** advance a fixed number of epochs once (for a "Step" button) */
  step: (n?: number) => void;
}

export function useRafTrainer<M>(
  makeModel: () => M,
  step: (m: M) => number,
  maxEpochs: number,
  epochsPerFrame = 8,
): TrainerState<M> {
  const [model, setModel] = useState<M>(makeModel);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);

  const rafId = useRef<number | null>(null);
  const runningRef = useRef(false);
  const epochRef = useRef(0);
  const modelRef = useRef(model);
  modelRef.current = model;

  const frame = useCallback(() => {
    if (!runningRef.current) return;
    const m = modelRef.current;
    let last = 0;
    for (let i = 0; i < epochsPerFrame && epochRef.current < maxEpochs; i++) {
      last = step(m);
      epochRef.current++;
    }
    setEpoch(epochRef.current);
    setLoss(last);
    setLossHistory((h) => [...h, last]);
    setTick((t) => t + 1);

    if (epochRef.current >= maxEpochs) {
      runningRef.current = false;
      setRunning(false);
      setDone(true);
      return;
    }
    rafId.current = requestAnimationFrame(frame);
  }, [step, maxEpochs, epochsPerFrame]);

  const start = useCallback(() => {
    if (runningRef.current || epochRef.current >= maxEpochs) return;
    runningRef.current = true;
    setRunning(true);
    rafId.current = requestAnimationFrame(frame);
  }, [frame, maxEpochs]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const m = makeModel();
    epochRef.current = 0;
    modelRef.current = m;
    setModel(m);
    setEpoch(0);
    setLoss(null);
    setLossHistory([]);
    setDone(false);
    setRunning(false);
    setTick((t) => t + 1);
  }, [makeModel]);

  const stepOnce = useCallback(
    (n = 1) => {
      if (runningRef.current) return; // ignore while auto-training
      const m = modelRef.current;
      let last = 0;
      for (let i = 0; i < n && epochRef.current < maxEpochs; i++) {
        last = step(m);
        epochRef.current++;
      }
      setEpoch(epochRef.current);
      setLoss(last);
      setLossHistory((h) => [...h, last]);
      setTick((t) => t + 1);
      if (epochRef.current >= maxEpochs) setDone(true);
    },
    [step, maxEpochs],
  );

  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  return {
    model,
    epoch,
    loss,
    lossHistory,
    running,
    done,
    tick,
    start,
    pause,
    reset,
    step: stepOnce,
  };
}
