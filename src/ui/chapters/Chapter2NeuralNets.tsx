import { useRef, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { ChapterRef } from '../components/ChapterRef';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { LossCurve } from '../viz/LossCurve';
import { DecisionBoundary } from '../viz/DecisionBoundary';
import { NetworkDiagram } from '../viz/NetworkDiagram';
import { NeuronDiagram } from '../viz/NeuronDiagram';
import { WeightsReadout } from '../viz/WeightsReadout';
import { useRafTrainer, type TrainerState } from '../useRafTrainer';
import { Perceptron, XOR_INPUTS } from '../../llm/perceptron';
import { XorNet } from '../../llm/xor-net';
import perceptronSource from '../../llm/perceptron.ts?raw';
import xorSource from '../../llm/xor-net.ts?raw';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function Controls({ t, stepN = 1 }: { t: TrainerState<unknown>; stepN?: number }) {
  return (
    <div className="lab-controls">
      <Button size="sm" onClick={t.start} disabled={t.running || t.done}>
        {t.epoch > 0 ? 'Resume ▶' : 'Train ▶'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => t.step(stepN)}
        disabled={t.running || t.done}
        title="Advance a little so you can read the weights change"
      >
        Step +{stepN}
      </Button>
      <Button size="sm" variant="outline" onClick={t.pause} disabled={!t.running}>
        Pause
      </Button>
      <Button size="sm" variant="outline" onClick={t.reset}>
        Reset
      </Button>
    </div>
  );
}

function BoundaryLegend() {
  return (
    <div className="text-[0.84rem] leading-relaxed text-muted-foreground">
      Every spot in the square is one input pair <b className="font-semibold text-foreground">(a, b)</b>. Its colour is the
      network's output there -{' '}
      <span style={{ color: '#a63a25', fontWeight: 700 }}>coral ≈ 1</span>,{' '}
      <span style={{ color: '#3e6ff0', fontWeight: 700 }}>blue ≈ 0</span>. The four
      big dots are the examples it's trying to get right.
    </div>
  );
}

// Order matters: this is the order the preset buttons appear in, and it's the
// order the story asks you to try them. AND and OR both work with a single
// straight line, so they come first; XOR is the one that fails, so it lands last
// as the punchline.
const PRESETS: Record<string, number[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  XOR: [0, 1, 1, 0],
};

/**
 * The editable "task": the four inputs are fixed (they're the only pairs of two
 * bits), but you choose the output you want for each - defining any logic gate.
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
      <div className="mb-1.5 font-mono text-[0.72rem] tracking-wide text-muted-foreground uppercase">
        The task - choose the output you want for each input
      </div>
      <div className="lab-controls" style={{ marginBottom: 8 }}>
        {Object.keys(PRESETS).map((name) => (
          <Button
            key={name}
            size="sm"
            variant={activePreset === name ? 'default' : 'outline'}
            onClick={() => onSet(PRESETS[name])}
          >
            {name}
          </Button>
        ))}
        <span className="dim">or click a “want” cell to flip it</span>
      </div>
      <Table className="font-mono text-[0.82rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">a</TableHead>
            <TableHead className="text-center">b</TableHead>
            <TableHead className="text-center">want</TableHead>
            <TableHead className="text-center">guess</TableHead>
            <TableHead className="text-center">ok?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {XOR_INPUTS.map((x, i) => {
            const p = predict(x);
            const ok = Math.round(p) === targets[i];
            return (
              <TableRow key={i}>
                <TableCell className="text-center">{x[0]}</TableCell>
                <TableCell className="text-center">{x[1]}</TableCell>
                <TableCell className="p-1 text-center">
                  <button
                    className={cn(
                      'min-w-[34px] rounded-md border px-2.5 py-0.5 font-mono text-sm',
                      targets[i]
                        ? 'border-primary bg-muted font-bold text-foreground'
                        : 'text-muted-foreground hover:border-ring',
                    )}
                    onClick={() => toggle(i)}
                    aria-label={`toggle expected output for input ${x[0]},${x[1]}`}
                  >
                    {targets[i]}
                  </button>
                </TableCell>
                <TableCell className="text-center">{p.toFixed(2)}</TableCell>
                <TableCell
                  className={cn(
                    'text-center font-bold',
                    ok ? 'text-emerald-600' : 'text-destructive',
                  )}
                >
                  {ok ? '✓' : '×'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Shared: hold an editable target vector and feed it to the trainer. */
function useLogicTargets(initial: number[]) {
  const [targets, setTargets] = useState(initial);
  const ref = useRef(targets);
  ref.current = targets;
  return { targets, setTargets, ref };
}

const fmtArr = (arr: number[]) => '[' + arr.map((v) => v.toFixed(1)).join(', ') + ']';

function PerceptronLab() {
  const { targets, setTargets, ref: targetsRef } = useLogicTargets(PRESETS.AND);
  // slow on purpose (few epochs per frame) so the weights move readably
  const t = useRafTrainer(
    () => new Perceptron(42),
    (m) => m.trainEpoch(0.5, XOR_INPUTS, targetsRef.current),
    2000,
    3,
  );
  const m = t.model;
  const setGoal = (next: number[]) => {
    setTargets(next);
    t.reset();
  };
  const learned = t.loss !== null && t.loss < 0.02;
  const settled = learned || t.done;
  return (
    <div className="lab">
      <Controls t={t} stepN={1} />
      <div className="lab-stats">
        <span>epoch <b>{t.epoch}</b></span>
        <span>error <b>{t.loss === null ? '-' : t.loss.toFixed(4)}</b></span>
        {learned && <span className="font-bold text-emerald-600">learned ✓</span>}
        {t.done && !learned && <span className="font-bold text-destructive">stuck ✗</span>}
      </div>
      <LogicTable targets={targets} onSet={setGoal} predict={(x) => m.predict(x)} />
      <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        Press <b className="font-semibold text-foreground">Step +1</b> to watch the two weights change one nudge at a time, or{' '}
        <b className="font-semibold text-foreground">Train</b> to run it. Try <b className="font-semibold text-foreground">AND</b>/<b className="font-semibold text-foreground">OR</b> (the line finds them) then{' '}
        <b className="font-semibold text-foreground">XOR</b> - no single line can split it.
      </div>

      {/* 2x2: weights + loss on top, then the two spatial views (network nodes +
          boundary square) below - both visible at once. */}
      <div className="my-1 grid grid-cols-1 items-center gap-x-4 gap-y-3 sm:grid-cols-2">
        <WeightsReadout
          title="weights (live)"
          final={settled}
          rows={[
            { label: 'w₁', value: m.w[0].toFixed(3) },
            { label: 'w₂', value: m.w[1].toFixed(3) },
            { label: 'bias', value: m.b.toFixed(3) },
          ]}
        />
        <LossCurve history={t.lossHistory} max={0.3} width={400} height={200} />
        <NetworkDiagram
          layers={[2, 1]}
          weights={[[[m.w[0]], [m.w[1]]]]}
          inputLabels={['a', 'b']}
          outputLabel="out"
          height={130}
        />
        <div className="flex justify-center">
          <DecisionBoundary predict={(x) => m.predict(x)} tick={t.tick} size={200} targets={targets} />
        </div>
      </div>
      <BoundaryLegend />
    </div>
  );
}

function XorLab() {
  const { targets, setTargets, ref: targetsRef } = useLogicTargets(PRESETS.XOR);
  const t = useRafTrainer(
    () => new XorNet(4, 7),
    (m) => m.trainEpoch(1, XOR_INPUTS, targetsRef.current),
    3000,
    4,
  );
  const m = t.model;
  const setGoal = (next: number[]) => {
    setTargets(next);
    t.reset();
  };
  const learned = t.loss !== null && t.loss < 0.02;
  return (
    <div className="lab">
      <Controls t={t} stepN={10} />
      <div className="lab-stats">
        <span>epoch <b>{t.epoch}</b></span>
        <span>error <b>{t.loss === null ? '-' : t.loss.toFixed(4)}</b></span>
        {learned && <span className="font-bold text-emerald-600">learned ✓</span>}
      </div>
      <LogicTable targets={targets} onSet={setGoal} predict={(x) => m.predict(x)} />
      <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        Same controls - <b className="font-semibold text-foreground">Step +10</b> or <b className="font-semibold text-foreground">Train</b>. Watch the hidden
        weights (the wires) shuffle as the boundary bends. This same network learns{' '}
        <em>any</em> gate, XOR included.
      </div>

      {/* 2x2: weights + loss on top, then the two spatial views (network nodes +
          boundary square) below - both visible at once. */}
      <div className="my-1 grid grid-cols-1 items-center gap-x-4 gap-y-3 sm:grid-cols-2">
        <WeightsReadout
          title="weights (live)"
          final={learned}
          rows={[
            { label: 'a→hid', value: fmtArr(m.w1[0]) },
            { label: 'b→hid', value: fmtArr(m.w1[1]) },
            { label: 'b1', value: fmtArr(m.b1) },
            { label: 'hid→out', value: fmtArr(m.w2) },
            { label: 'b2', value: m.b2.toFixed(2) },
          ]}
        />
        <LossCurve history={t.lossHistory} max={0.3} width={400} height={200} />
        <NetworkDiagram
          layers={[2, 4, 1]}
          weights={[m.w1, m.w2.map((w) => [w])]}
          inputLabels={['a', 'b']}
          outputLabel="out"
          height={190}
        />
        <div className="flex justify-center">
          <DecisionBoundary predict={(x) => m.predict(x)} tick={t.tick} size={200} targets={targets} />
        </div>
      </div>
      <BoundaryLegend />
    </div>
  );
}

export function Chapter2NeuralNets() {
  return (
    <ChapterFrame id="neural-networks">
      <Beat as="p" className="lead">
        <ChapterRef id="chatbots" /> ended at a wall: you can't hand-write a rule
        for every sentence.
        So here's the idea that eventually wins - <strong>stop writing rules. Show
        examples, and let the machine adjust itself until it gets them right.</strong>{' '}
        To see how, we need to meet the two things every neural network is built
        from: neurons, and weights.
      </Beat>

      <Beat as="h2">First: what is a neuron?</Beat>
      <Beat as="p">
        Forget brains. An artificial neuron is a tiny calculator: a few numbers go
        in, one number comes out. It does exactly three things - multiply each input
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
          (“sigmoid”) is just the squasher - give it any number and it hands back
          something between 0 and 1, like a confidence.
        </Callout>
      </Beat>

      <Beat>
        <CitationCard ids={['mcculloch-pitts-1943', 'perceptron-1958']} />
      </Beat>

      <Beat as="h2">What does it mean to “train”?</Beat>
      <Beat as="p">
        This is the part that usually stays fuzzy, so let's make it concrete. We
        never set the weights by hand - the network <em>finds</em> them, by
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
              One full pass over all the examples is one <strong>epoch</strong> - we
              run thousands.
            </div>
          </li>
        </ol>
      </Beat>

      <Beat as="p">
        A picture that helps: imagine the error as a hilly landscape and your current
        weights as a spot on it. Each epoch you take one small step downhill. The
        learning rate is your stride - too big and you leap clean over the valley,
        too small and you're there all day. That downhill walk has a name,{' '}
        <strong>gradient descent</strong>, and it trains every model in this course.
      </Beat>

      <Beat>
        <Callout emoji="🔑">
          <strong>That's the entire secret:</strong> start random, measure the error,
          nudge the weights to shrink it, repeat. Everything fancier in this course is
          the same loop - just with more weights and far more data. And you don't have
          to take it on faith - in the demos below you can press <b>Step</b> and watch
          the actual weight numbers change, one nudge at a time.
        </Callout>
      </Beat>

      <Beat as="h2">The problem that froze the field: XOR</Beat>
      <Beat as="p">
        Now the twist. In 1958 Frank Rosenblatt built a single neuron - the{' '}
        <strong>Perceptron</strong> - and headlines promised machines that would soon
        walk and talk. Then Minsky and Papert pointed out something crushing, and the
        easiest way to get it is to <em>feel</em> it. <strong>XOR</strong> is the
        simplest “tricky” pattern: output <strong>1</strong> only when the two inputs{' '}
        <em>differ</em>. A single neuron can only slice the space with one straight
        line - and no straight line separates XOR's two coral corners from its two
        blue ones.
      </Beat>

      <Beat as="p">
        The three “goals” you can hand the network are the classic two-input logic
        gates. Each one takes two yes/no inputs (<strong>0</strong> or{' '}
        <strong>1</strong>) and returns a single answer:
      </Beat>

      <Beat>
        <ul className="my-6 flex list-none flex-col gap-2.5 p-0">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex min-w-[52px] justify-center rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold text-secondary-foreground">
              AND
            </span>
            <span className="text-[0.97rem] leading-relaxed text-foreground/90">
              output <strong>1</strong> only when <em>both</em> inputs are 1.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex min-w-[52px] justify-center rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold text-secondary-foreground">
              OR
            </span>
            <span className="text-[0.97rem] leading-relaxed text-foreground/90">
              output <strong>1</strong> when <em>either</em> input is 1.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex min-w-[52px] justify-center rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold text-secondary-foreground">
              XOR
            </span>
            <span className="text-[0.97rem] leading-relaxed text-foreground/90">
              “exclusive or” - output <strong>1</strong> only when the two inputs{' '}
              <em>differ</em> (one is 1, the other 0).
            </span>
          </li>
        </ul>
      </Beat>

      <Beat as="p">
        In the lab below you're the teacher: pick a goal (or click a “want” cell to
        invent your own), press <strong>Train</strong>, and watch the single neuron
        hunt for weights that reproduce it. It starts on <strong>AND</strong> - press
        Train and it snaps into place, and <strong>OR</strong> works too. Then switch
        to <strong>XOR</strong>: same neuron, same loop, and the error refuses to fall.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · One perceptron. The diagram shows its two weights + bias (live, on the right); the square shows its output everywhere; the graph shows the error. Try AND/OR (it wins), then XOR (it can't).">
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
        final neuron <em>can</em> split it with a line - and the exact same training
        loop (now called <strong>backpropagation</strong> once it reaches across
        layers) still handles everything. Same machine you watched above; now try to
        teach it XOR yourself.
      </Beat>

      <Beat>
        <CitationCard ids={['perceptrons-1969', 'backprop-1986']} />
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · With a hidden layer the error dives and the square bends into the checkerboard XOR needs. Watch the weights readout settle into its final values. Same loop, more neurons.">
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

      <Beat as="h2">The real code - now you know every word in it</Beat>
      <Beat as="p">
        Here are both networks behind the demos, no libraries. Notice the task is
        spelled out right at the top - <code>XOR_INPUTS</code> and{' '}
        <code>XOR_TARGETS</code>, the four examples - and every step works on those
        actual numbers, not some abstract “input.” You now know each term:{' '}
        <code>w</code>/<code>w1</code>/<code>w2</code> are the weights,{' '}
        <code>trainEpoch</code> is one pass of that four-step loop, <code>error</code>{' '}
        is how wrong it was, and <code>lr</code> is the stride size.
      </Beat>

      <Beat as="p">
        First the single neuron - the one that stalls on XOR:
      </Beat>
      <Beat>
        <CodeViewer code={perceptronSource} filename="src/llm/perceptron.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        Now add a hidden layer, and the very same loop - reaching back through two
        layers instead of one - finally cracks it. Same story, one more row of neurons:
      </Beat>
      <Beat>
        <CodeViewer code={xorSource} filename="src/llm/xor-net.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        We can now learn patterns from examples. But this network only eats{' '}
        <em>numbers</em>, and language is made of words. So before a model can learn
        language, we have to turn text into numbers - carefully. That's next.
      </Beat>
    </ChapterFrame>
  );
}
