import { useEffect, useReducer, useRef, useState } from 'react';
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

/**
 * A self-running picture of the XOR network. It quietly trains on its own and
 * loops (relearning from scratch), so you can watch the weights — the wires —
 * shift colour and thickness. This is just "what learning looks like"; the
 * hands-on demos come later.
 */
function LiveXorNetwork() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const boxRef = useRef<HTMLDivElement>(null);
  const netRef = useRef<XorNet | null>(null);
  if (!netRef.current) netRef.current = new XorNet(4, 20);
  const info = useRef({ epoch: 0, loss: 1 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let timer: number | null = null;
    const tick = () => {
      const net = netRef.current!;
      let loss = 1;
      for (let i = 0; i < 12; i++) loss = net.trainEpoch(1);
      info.current = { epoch: net.epoch, loss };
      // once it's basically solved, start over so the wires keep re-learning
      if (net.epoch > 1200 || loss < 0.006) {
        netRef.current = new XorNet(4, Math.floor(Math.random() * 1e6));
        info.current = { epoch: 0, loss: 1 };
      }
      force();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && timer === null) timer = window.setInterval(tick, 110);
        else if (!e.isIntersecting && timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== null) clearInterval(timer);
    };
  }, []);

  const net = netRef.current;
  return (
    <div ref={boxRef}>
      <NetworkDiagram
        layers={[2, 4, 1]}
        weights={[net.w1, net.w2.map((w) => [w])]}
        inputLabels={['a', 'b']}
        outputLabel="out"
        height={210}
      />
      <div
        className="dim"
        style={{ fontSize: 12.5, marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
      >
        auto-training on XOR · epoch {info.current.epoch} · error {info.current.loss.toFixed(3)}{' '}
        · relearns on a loop
      </div>
    </div>
  );
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
      <div className="lab-two" style={{ gridTemplateColumns: 'minmax(0, 216px) 1fr', alignItems: 'center' }}>
        <DecisionBoundary predict={(x) => m.predict(x)} tick={t.tick} size={200} />
        <LossCurve history={t.lossHistory} max={0.3} width={400} height={230} />
      </div>
      <BoundaryLegend />
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
      <div className="lab-two" style={{ gridTemplateColumns: 'minmax(0, 216px) 1fr', alignItems: 'center' }}>
        <DecisionBoundary predict={(x) => m.predict(x)} tick={t.tick} size={200} />
        <LossCurve history={t.lossHistory} max={0.3} width={400} height={230} />
      </div>
      <BoundaryLegend />
    </div>
  );
}

export function Chapter2NeuralNets() {
  return (
    <ChapterFrame id="neural-networks">
      <Beat as="p" className="lead">
        Chapter 1 ended at a wall: you can't hand-write a rule for every sentence.
        So here's the idea that eventually wins — <strong>stop writing rules. Show
        examples, and let the machine adjust itself until it gets them right.</strong>{' '}
        To see how, we need to meet the two things every neural network is built
        from: neurons, and weights.
      </Beat>

      <Beat as="h2">First: what is a neuron?</Beat>
      <Beat as="p">
        Forget brains. An artificial neuron is a tiny calculator: a few numbers go
        in, one number comes out. It does exactly three things — multiply each input
        by a <strong>weight</strong>, add them all up (plus a <strong>bias</strong>),
        then “squash” the total into a value between 0 and 1.
      </Beat>
      <Beat as="p">
        A <strong>weight</strong> is simply a number saying <em>how much an input
        matters</em>. A big positive weight means “this input strongly votes yes”; a
        negative weight votes “no”; a weight near zero means “ignore it.” The{' '}
        <strong>bias</strong> is a constant nudge that makes the neuron easier or
        harder to fire. Here's the crucial bit:{' '}
        <strong>these weights are the only thing that changes when a network learns.</strong>{' '}
        Everything a model “knows” is stored in numbers exactly like these.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · One neuron: each input is scaled by its weight, summed with a bias, then squashed into a 0–1 answer.">
          <NeuronDiagram />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🧮">
          <strong>The whole neuron in one line:</strong>{' '}
          <code>output = σ(x₁·w₁ + x₂·w₂ + bias)</code>. That <code>σ</code>{' '}
          (“sigmoid”) is just the squasher — give it any number and it hands back
          something between 0 and 1, like a confidence.
        </Callout>
      </Beat>

      <Beat>
        <CitationCard ids={['mcculloch-pitts-1943', 'perceptron-1958']} />
      </Beat>

      <Beat as="h2">What does it mean to “train”?</Beat>
      <Beat as="p">
        This is the part that usually stays fuzzy, so let's make it concrete. We
        never set the weights by hand — the network <em>finds</em> them, by
        repeating one simple loop until its answers stop being wrong:
      </Beat>

      <Beat>
        <ol className="point-list">
          <li>
            <span className="point-num">1</span>
            <div>
              <strong>Start random.</strong> Every weight begins as a small random
              number, so the first guesses are basically coin-flips.
            </div>
          </li>
          <li>
            <span className="point-num">2</span>
            <div>
              <strong>Measure how wrong it is.</strong> Compare the guess to the
              right answer; the gap, squared, is the <strong>error</strong> (or
              “loss”). Squaring means big mistakes hurt far more than small ones.
            </div>
          </li>
          <li>
            <span className="point-num">3</span>
            <div>
              <strong>Assign blame.</strong> Figure out which way to nudge each
              weight to make that error smaller. This is{' '}
              <strong>backpropagation</strong>: the error is passed backward through
              the network so every weight learns how much it contributed.
            </div>
          </li>
          <li>
            <span className="point-num">4</span>
            <div>
              <strong>Nudge, and repeat.</strong> Move each weight a tiny step in the
              helpful direction. The step size is the <strong>learning rate</strong>.
              One full pass over all the examples is one <strong>epoch</strong> — we
              run thousands.
            </div>
          </li>
        </ol>
      </Beat>

      <Beat as="p">
        A picture that helps: imagine the error as a hilly landscape and your current
        weights as a spot on it. Each epoch you take one small step downhill. The
        learning rate is your stride — too big and you leap clean over the valley,
        too small and you're there all day. That downhill walk has a name,{' '}
        <strong>gradient descent</strong>, and it trains every model in this course.
      </Beat>

      <Beat as="p">
        Don't take it on faith — watch it. Below is a real network training itself on
        XOR. The wires are its weights (coral = positive, blue = negative, thicker =
        stronger). See them shuffle as the error falls, then reset and relearn:
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · A network training itself on XOR, on a loop. Every flicker of the wires is step 4 above — weights being nudged.">
          <LiveXorNetwork />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🔑">
          <strong>That's the entire secret:</strong> start random, measure the error,
          nudge the weights to shrink it, repeat. Everything fancier in this course is
          the same loop — just with more weights and far more data.
        </Callout>
      </Beat>

      <Beat as="h2">The problem that froze the field: XOR</Beat>
      <Beat as="p">
        Now the twist. In 1958 Frank Rosenblatt built a single neuron — the{' '}
        <strong>Perceptron</strong> — and headlines promised machines that would soon
        walk and talk. Then Minsky and Papert pointed out something crushing, and the
        easiest way to get it is to <em>feel</em> it. <strong>XOR</strong> is the
        simplest “tricky” pattern: output <strong>1</strong> only when the two inputs{' '}
        <em>differ</em>. A single neuron can only slice the space with one straight
        line — and no straight line separates XOR's two coral corners from its two
        blue ones. Pick a goal below, press Train, and watch the error stall.
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · One perceptron. The square shows its output for every input; the four dots are the examples. Try AND or OR (it wins), then XOR (it can't).">
          <PerceptronLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="❄️" tone="neutral">
          <strong>The AI winter:</strong> that one limitation, amplified by a famous
          book, helped freeze neural-network research for the better part of two
          decades. The fix turned out to be almost embarrassingly simple.
        </Callout>
      </Beat>

      <Beat as="h2">The fix: a hidden layer</Beat>
      <Beat as="p">
        Put a middle (“hidden”) layer of neurons between input and output. That
        hidden layer first <em>reshapes</em> the problem into a new space where the
        final neuron <em>can</em> split it with a line — and the exact same training
        loop (now called <strong>backpropagation</strong> once it reaches across
        layers) still handles everything. Same machine you watched above; now try to
        teach it XOR yourself.
      </Beat>

      <Beat>
        <CitationCard ids={['perceptrons-1969', 'backprop-1986']} />
      </Beat>

      <Beat>
        <Figure caption="Fig 4 · With a hidden layer the error dives and the square bends into the checkerboard XOR needs. Same loop, more neurons.">
          <XorLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="✅">
          <strong>The whole point:</strong> nobody told the network <em>how</em> to
          solve XOR. We gave it four examples and a way to measure “wrong,” and it
          found the weights by itself. Scale that up and you get every model here.
        </Callout>
      </Beat>

      <Beat as="h2">The real code — now you know every word in it</Beat>
      <Beat as="p">
        Here's the actual network behind the demos, no libraries. You now know each
        term: <code>w1</code>/<code>w2</code> are the weights, <code>trainEpoch</code>{' '}
        is one pass of that four-step loop, <code>error</code> is how wrong it was,
        and <code>lr</code> is the stride size. Read the comments — the story and the
        code finally line up.
      </Beat>

      <Beat>
        <CodeViewer code={xorSource} filename="src/llm/xor-net.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        We can now learn patterns from examples. But this network only eats{' '}
        <em>numbers</em>, and language is made of words. So before a model can learn
        language, we have to turn text into numbers — carefully. That's next.
      </Beat>
    </ChapterFrame>
  );
}
