import { useRef, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { LossCurve } from '../viz/LossCurve';
import { DecisionBoundary } from '../viz/DecisionBoundary';
import { NetworkDiagram } from '../viz/NetworkDiagram';
import { NeuronDiagram } from '../viz/NeuronDiagram';
import { useRafTrainer, type TrainerState } from '../useRafTrainer';
import { Perceptron } from '../../llm/perceptron';
import { XorNet, INPUTS } from '../../llm/xor-net';
import xorSource from '../../llm/xor-net.ts?raw';

function Controls({ t }: { t: TrainerState<unknown> }) {
  return (
    <div className="lab-controls">
      <button className="btn btn-run" onClick={t.start} disabled={t.running || t.done}>
        {t.epoch > 0 ? 'Resume ▶' : 'Train ▶'}
      </button>
      <button className="btn btn-light" onClick={t.pause} disabled={!t.running}>
        Pause
      </button>
      <button className="btn btn-light" onClick={t.reset}>
        Reset
      </button>
    </div>
  );
}

function BoundaryLegend() {
  return (
    <div className="dim" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
      Every spot in the square is one input pair <b>(a, b)</b>. Its colour is the
      network's output there —{' '}
      <span style={{ color: '#c24a28', fontWeight: 700 }}>coral ≈ 1</span>,{' '}
      <span style={{ color: '#3e6ff0', fontWeight: 700 }}>blue ≈ 0</span>. The four
      big dots are the examples it's trying to get right.
    </div>
  );
}

const PRESETS: Record<string, number[]> = {
  XOR: [0, 1, 1, 0],
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
};

/**
 * The editable "task": the four inputs are fixed (they're the only pairs of two
 * bits), but you choose the output you want for each — defining any logic gate.
 * Click a preset or flip a cell, then Train and watch the network chase it.
 */
function LogicTable({
  targets,
  onSet,
  predict,
}: {
  targets: number[];
  onSet: (next: number[]) => void;
  predict: (x: [number, number]) => number;
}) {
  const toggle = (i: number) => {
    const next = [...targets];
    next[i] = next[i] ? 0 : 1;
    onSet(next);
  };
  const activePreset = Object.keys(PRESETS).find((k) => PRESETS[k].join('') === targets.join(''));
  return (
    <div>
      <div className="task-label">The task — choose the output you want for each input</div>
      <div className="lab-controls" style={{ marginBottom: 8 }}>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            className={`btn ${activePreset === name ? 'btn-run' : 'btn-light'}`}
            onClick={() => onSet(PRESETS[name])}
          >
            {name}
          </button>
        ))}
        <span className="dim">or click a “want” cell to flip it</span>
      </div>
      <table className="truth">
        <thead>
          <tr>
            <th>a</th>
            <th>b</th>
            <th>want</th>
            <th>guess</th>
            <th>ok?</th>
          </tr>
        </thead>
        <tbody>
          {INPUTS.map((x, i) => {
            const p = predict(x);
            const ok = Math.round(p) === targets[i];
            return (
              <tr key={i}>
                <td>{x[0]}</td>
                <td>{x[1]}</td>
                <td className="editable">
                  <button
                    className={`want-toggle${targets[i] ? ' one' : ''}`}
                    onClick={() => toggle(i)}
                    aria-label={`toggle expected output for input ${x[0]},${x[1]}`}
                  >
                    {targets[i]}
                  </button>
                </td>
                <td>{p.toFixed(2)}</td>
                <td className={ok ? 'ok' : 'no'}>{ok ? '✓' : '×'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Shared: hold an editable target vector and feed it to the trainer. */
function useLogicTargets(initial: number[]) {
  const [targets, setTargets] = useState(initial);
  const ref = useRef(targets);
  ref.current = targets;
  const data = () => INPUTS.map((x, i) => ({ x, y: ref.current[i] }));
  return { targets, setTargets, data };
}

function PerceptronLab() {
  const { targets, setTargets, data } = useLogicTargets(PRESETS.XOR);
  const t = useRafTrainer(() => new Perceptron(42), (m) => m.trainEpoch(0.5, data()), 2000, 20);
  const m = t.model;
  const setGoal = (next: number[]) => {
    setTargets(next);
    t.reset();
  };
  const learned = t.loss !== null && t.loss < 0.02;
  return (
    <div className="lab">
      <Controls t={t} />
      <div className="lab-stats">
        <span>epoch <b>{t.epoch}</b></span>
        <span>error <b>{t.loss === null ? '—' : t.loss.toFixed(4)}</b></span>
        {learned && <span style={{ color: 'var(--green)', fontWeight: 700 }}>learned ✓</span>}
      </div>
      <LogicTable targets={targets} onSet={setGoal} predict={(x) => m.predict(x)} />
      <div className="lab-hint">
        Try the <b>AND</b> or <b>OR</b> preset — a single perceptron learns those
        easily (error → 0). Only <b>XOR</b> leaves it stuck near 0.25.
      </div>
      <NetworkDiagram
        layers={[2, 1]}
        weights={[[[m.w[0]], [m.w[1]]]]}
        inputLabels={['a', 'b']}
        outputLabel="out"
        height={140}
      />
      <div className="boundary-row">
        <DecisionBoundary predict={(x) => m.predict(x)} tick={t.tick} />
        <BoundaryLegend />
      </div>
      <LossCurve history={t.lossHistory} max={0.3} height={170} />
    </div>
  );
}

function XorLab() {
  const { targets, setTargets, data } = useLogicTargets(PRESETS.XOR);
  const t = useRafTrainer(() => new XorNet(4, 7), (m) => m.trainEpoch(1, data()), 3000, 12);
  const m = t.model;
  const setGoal = (next: number[]) => {
    setTargets(next);
    t.reset();
  };
  const learned = t.loss !== null && t.loss < 0.02;
  return (
    <div className="lab">
      <Controls t={t} />
      <div className="lab-stats">
        <span>epoch <b>{t.epoch}</b></span>
        <span>error <b>{t.loss === null ? '—' : t.loss.toFixed(4)}</b></span>
        {learned && <span style={{ color: 'var(--green)', fontWeight: 700 }}>learned ✓</span>}
      </div>
      <LogicTable targets={targets} onSet={setGoal} predict={(x) => m.predict(x)} />
      <div className="lab-hint">
        Change the goal above (or flip a “want” cell) and press <b>Train</b> — the
        hidden layer lets this same network learn <em>any</em> of these gates,
        XOR included.
      </div>
      <NetworkDiagram
        layers={[2, 4, 1]}
        weights={[m.w1, m.w2.map((w) => [w])]}
        inputLabels={['a', 'b']}
        outputLabel="out"
        height={190}
      />
      <div className="boundary-row">
        <DecisionBoundary predict={(x) => m.predict(x)} tick={t.tick} />
        <BoundaryLegend />
      </div>
      <LossCurve history={t.lossHistory} max={0.3} height={170} />
    </div>
  );
}

export function Chapter2NeuralNets() {
  return (
    <ChapterFrame id="neural-networks">
      <Beat as="p" className="lead">
        Chapter 1 ended at a wall: you can't hand-write a rule for every sentence.
        So here's a wildly different idea, and it's the one that eventually wins —
        <strong> stop writing rules. Show examples, and let the machine adjust
        itself until it gets them right.</strong>
      </Beat>

      <Beat as="h2">A neuron is just a weighted vote</Beat>
      <Beat as="p">
        Forget brains for a second. An artificial neuron takes a few numbers,
        multiplies each by a <strong>weight</strong> (how much it trusts that
        input), adds them up, and squashes the total into a 0-to-1 “how strongly
        do I fire?”. <strong>Training</strong> is nothing more than nudging those
        weights, over and over, in whatever direction makes the answer a little
        less wrong.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · One neuron. Inputs get multiplied by weights, added up (with a bias), and squashed into a 0–1 answer. Training just tweaks the weights.">
          <NeuronDiagram />
        </Figure>
      </Beat>

      <Beat>
        <CitationCard ids={['mcculloch-pitts-1943', 'perceptron-1958']} />
      </Beat>

      <Beat as="p">
        In 1958 Frank Rosenblatt wired up exactly this — the{' '}
        <strong>Perceptron</strong> — and the press lost its mind, predicting
        machines that would walk and talk. Then, in 1969, Minsky and Papert
        pointed out something devastating.
      </Beat>

      <Beat as="h2">The problem that froze the field: XOR</Beat>
      <Beat as="p">
        XOR is the simplest “tricky” pattern: output <strong>1</strong> only when
        the two inputs <em>differ</em>. Try to train a single perceptron on it
        below. It can only carve the space with one straight line — and no single
        line separates the two coral corners from the two blue ones. Watch the
        error get stuck.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · One perceptron, one straight line. The wires above are its two weights; the square is what it computes. XOR can't be split by a line — error flatlines near 0.25.">
          <PerceptronLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="❄️" tone="neutral">
          <strong>The AI winter:</strong> that one limitation, blown up in a
          famous book, helped freeze neural-network research for the better part
          of two decades. The fix turned out to be almost embarrassingly simple.
        </Callout>
      </Beat>

      <Beat as="h2">The fix: a hidden layer + backpropagation</Beat>
      <Beat as="p">
        Add a middle (“hidden”) layer of neurons between input and output. Now
        the network can first <em>reshape</em> the problem into something a final
        neuron <em>can</em> split with a line. The trick that makes it learnable
        is <strong>backpropagation</strong> (1986): after each guess, send the
        error backward through the network and let every weight take the blame it
        deserves.
      </Beat>

      <Beat>
        <CitationCard ids={['perceptrons-1969', 'backprop-1986']} />
      </Beat>

      <Beat as="p">
        Same XOR, same coral-vs-blue corners — but now with a 2→4→1 network. Hit{' '}
        <strong>Train</strong> and watch the flat wash bend into the
        checkerboard XOR needs. The error dives; the truth table turns all ✓.
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · Now with a hidden layer (4 middle neurons). Watch the wires shift colour as it trains — that's the boundary learning to bend into the checkerboard XOR needs.">
          <XorLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🔑">
          <strong>The whole point:</strong> nobody told the network <em>how</em>{' '}
          to solve XOR. We only showed it four examples and a way to measure
          “wrong”. Everything else it figured out by adjusting numbers. Scale
          this idea up and you get every model in this course.
        </Callout>
      </Beat>

      <Beat as="h2">The real code (it fits on one screen)</Beat>
      <Beat as="p">
        Here's the actual network powering the demo above — the forward pass and
        the backprop, no libraries. Read <code>trainEpoch</code>: that's the
        chain rule, written out by hand.
      </Beat>

      <Beat>
        <CodeViewer code={xorSource} filename="src/llm/xor-net.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        We can now learn patterns from examples. But there's a catch that's easy
        to miss: this network only eats <em>numbers</em>. Language is made of
        words. So before a model can learn language, we need to turn text into
        numbers — carefully. That's next.
      </Beat>
    </ChapterFrame>
  );
}
