import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { ChapterRef } from '../components/ChapterRef';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { RaceTrack } from '../viz/RaceTrack';
import { FitnessCurve } from '../viz/FitnessCurve';
import { NetworkDiagram } from '../viz/NetworkDiagram';
import { useCarEvolution, useTestDrive } from '../useCarEvolution';
import { CarBrain, LAYERS } from '../../llm/neuroevolution';
import { FINISH_LAPS, TRACKS } from '../../llm/car-track';
import { makeRng } from '../../llm/rng';
import neuroSource from '../../llm/neuroevolution.ts?raw';
import trackSource from '../../llm/car-track.ts?raw';
import { Button } from '@/components/ui/button';

const SENSOR_LABELS = ['⟵', '↖', '↑', '↗', '⟶'];

/** A still diagram of the brain's shape, so the reader sees the wiring up front. */
function BrainShape() {
  const brain = useMemo(() => new CarBrain(makeRng(3)), []);
  return (
    <NetworkDiagram
      layers={LAYERS}
      weights={brain.weights}
      inputLabels={SENSOR_LABELS}
      outputLabel=""
      height={230}
    />
  );
}

function TrackPicker({
  selected,
  onSelect,
  disabled = false,
}: {
  selected: number;
  onSelect: (i: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {TRACKS.map((t, i) => (
        <Button
          key={t.name}
          size="sm"
          variant={selected === i ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onSelect(i)}
          className="w-full justify-start"
          title={t.hard ? 'A hard, twisty track' : 'The easy warm-up track'}
        >
          {t.name}
          {t.hard ? '' : ' · easy'}
        </Button>
      ))}
    </div>
  );
}

function CarLab() {
  const [trainIdx, setTrainIdx] = useState(0); // which track we TRAIN on
  const [testIdx, setTestIdx] = useState<number | null>(null); // which track we SHOW OFF on
  const ev = useCarEvolution({ seed: 5, size: 40, trackConfig: TRACKS[trainIdx] }, 3, 60);
  const testing = testIdx !== null;
  const td = useTestDrive(ev.pop.champion, TRACKS[testIdx ?? trainIdx], testing);

  const p = ev.pop;
  const finish = p.track.gates.length * FINISH_LAPS;
  const bestOverall = ev.curve.length ? ev.curve[ev.curve.length - 1] : 0; // running best-so-far
  const trainedHere = testIdx === trainIdx;

  const chooseTrain = (i: number) => {
    setTestIdx(null);
    setTrainIdx(i); // hook rebuilds the population on the new track
  };
  const chooseTest = (i: number) => {
    ev.pause();
    setTestIdx(i);
  };

  const label = 'font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase';

  return (
    <div className="lab">
      {/* Canvas on the LEFT, controls on the RIGHT - so training and the
          test-drive picker are visible together, no scrolling. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 lg:flex-1">
          {testing ? (
            <RaceTrack track={td.track} cars={[td.car]} leader={td.car} tick={td.tick} />
          ) : (
            <RaceTrack track={p.track} cars={p.cars} leader={p.leader()} tick={ev.tick} />
          )}
          {!testing ? (
            <div className="lab-stats mt-2">
              <span>training on <b>{TRACKS[trainIdx].name}</b></span>
              <span>gen <b>{ev.generation}</b></span>
              <span>alive <b>{ev.aliveCount}</b>/{p.cars.length}</span>
              <span>best <b>{bestOverall.toFixed(1)}</b>/{finish}</span>
              {ev.solved && <span className="font-bold text-emerald-600">solved ✓</span>}
            </div>
          ) : (
            <div className="lab-stats mt-2">
              <span>champion on <b>{TRACKS[testIdx!].name}</b></span>
              {trainedHere ? (
                <span className="text-muted-foreground">(its training track)</span>
              ) : (
                <span className="font-semibold text-emerald-600">never trained here</span>
              )}
              <span>laps <b>{td.laps}</b></span>
              <span>furthest <b>{td.best.toFixed(1)}</b>/{finish}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:w-[224px]">
          {/* SECTION 1 · TRAIN - neutral card */}
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[0.7rem] font-bold text-background">
                1
              </span>
              <span className={label}>Train on</span>
            </div>
            <TrackPicker selected={trainIdx} onSelect={chooseTrain} />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Button size="sm" onClick={ev.start} disabled={ev.running || ev.solved}>
                {ev.generation > 1 || ev.history.length ? 'Resume ▶' : 'Train ▶'}
              </Button>
              <Button size="sm" variant="outline" onClick={ev.pause} disabled={!ev.running}>
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={ev.reset}>
                Reset
              </Button>
            </div>
          </div>

          {/* SECTION 2 · TEST - green accent, dashed + dimmed while locked */}
          <div
            className={`rounded-xl border p-3 transition-opacity ${
              ev.solved ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-dashed opacity-70'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[0.7rem] font-bold ${
                  ev.solved ? 'bg-emerald-600 text-white' : 'bg-muted-foreground/30 text-background'
                }`}
              >
                2
              </span>
              <span
                className={`font-mono text-[0.7rem] tracking-wide uppercase ${
                  ev.solved ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                }`}
              >
                Test on {ev.solved ? '' : '🔒'}
              </span>
            </div>
            <TrackPicker selected={testIdx ?? -1} onSelect={chooseTest} disabled={!ev.solved} />
            {testing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTestIdx(null)}
                className="mt-2 w-full justify-start text-emerald-700 dark:text-emerald-400"
              >
                ← back to training
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border bg-muted/40 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        {!ev.solved && !testing ? (
          <>
            Press <b className="font-semibold text-foreground">Train</b>. Generation 1 is pure chaos - every car is a random
            brain, so they veer into the walls at once (crashed cars fade out). The{' '}
            <b className="font-semibold text-foreground">green</b> car is the leader, with its whiskers drawn. Each time the
            pack dies off, the best drivers breed the next generation - until one solves{' '}
            <b className="font-semibold text-foreground">{TRACKS[trainIdx].name}</b>. Then step 2 (right) unlocks.
          </>
        ) : testing && trainedHere ? (
          <>
            This is the track it trained on - of course it drives it. Now, from{' '}
            <b className="font-semibold text-foreground">Test on</b> (right), pick a{' '}
            <b className="font-semibold text-foreground">hard</b> track it has never seen.
          </>
        ) : testing && !TRACKS[trainIdx].hard ? (
          <>
            It only ever practised on the <b className="font-semibold text-foreground">easy</b> oval, where a lazy wobble
            survives - it never met a real corner. So here it{' '}
            <b className="font-semibold text-foreground">crashes almost immediately</b> (watch “furthest” barely move). Go{' '}
            <b className="font-semibold text-foreground">back to training</b>, pick a hard track instead, then test again.
          </>
        ) : testing ? (
          <>
            Same frozen brain, a track it has <b className="font-semibold text-foreground">never seen</b> - and it drives it.
            Training on a hard, twisty circuit forced it to learn to actually corner, and that skill transfers to any track.
          </>
        ) : (
          <>
            It solved <b className="font-semibold text-foreground">{TRACKS[trainIdx].name}</b>. Now use{' '}
            <b className="font-semibold text-foreground">Test on</b> (right) to drop this trained brain onto tracks it never
            saw.
          </>
        )}
      </div>

      <div className="my-1 mt-3 grid grid-cols-1 items-center gap-x-4 gap-y-3 sm:grid-cols-2">
        {testing ? (
          <div className="text-[0.84rem] leading-relaxed text-muted-foreground">
            The wiring on the right is <b className="font-semibold text-foreground">frozen</b> - the exact weights evolution
            found on <b className="font-semibold text-foreground">{TRACKS[trainIdx].name}</b>. Nothing is being learned now;
            the champion just runs that same little network here.
          </div>
        ) : (
          <FitnessCurve history={ev.curve} max={finish} target={finish} width={440} height={200} />
        )}
        <NetworkDiagram
          layers={LAYERS}
          weights={p.champion.weights}
          inputLabels={SENSOR_LABELS}
          outputLabel=""
          height={200}
        />
      </div>
      <div className="text-[0.84rem] leading-relaxed text-muted-foreground">
        {testing
          ? 'The champion brain’s wiring - '
          : 'Left: the best result so far, climbing over training time toward the dashed “solved” line. Right: the champion brain’s live wiring - '}
        <span style={{ color: '#e0553a', fontWeight: 700 }}>coral</span> wires are positive weights,{' '}
        <span style={{ color: '#3e6ff0', fontWeight: 700 }}>blue</span> negative, thicker = stronger. These wires are the
        “genes” evolution tuned.
      </div>
    </div>
  );
}

export function ChapterNeuroevolutionCar() {
  return (
    <ChapterFrame id="neuroevolution-car">
      <Beat as="p" className="lead">
        Every network so far learned the same way: we knew the right answer for each
        example and used <ChapterRef id="neural-networks" />’s backpropagation to nudge
        the weights toward it. But what if <em>nobody knows</em> the right answer? Put a
        car on a track and ask it to drive: at any instant there’s no label saying
        “the correct move here is <em>ease left</em>.” Backprop has nothing to push
        against. So here’s a completely different way to find good weights - one that
        needs no teacher at all.
      </Beat>

      <Beat>
        <Callout emoji="🧬">
          <strong>Before we start - is this reinforcement learning?</strong> Not quite. What
          you’re about to build is <em>neuroevolution</em>, RL’s close cousin. Both learn from a
          single <em>score</em> instead of labelled answers. The difference: true RL (Q-learning,
          policy gradients) works out which <em>individual moves</em> earned the score and nudges
          one network with gradients; evolution never asks which move mattered - it just keeps the
          whole brains that scored well and breeds them. Simpler, gradient-free, and a perfect way
          into the “learn from a reward” world.
        </Callout>
      </Beat>

      <Beat as="h2">A car that can only sense and steer</Beat>
      <Beat as="p">
        Our car is deliberately simple. It always rolls forward at a fixed speed - no
        brakes, no reverse. All it can do is choose <strong>how to turn the wheel</strong>,
        picking one of five actions each moment: <em>hard left, ease left, straight,
        ease right, hard right</em>. And all it can perceive is five{' '}
        <strong>“whisker” sensors</strong> fanning out ahead of it, each reporting how far
        away the wall is in that direction. Five numbers in, one of five choices out.
      </Beat>

      <Beat>
        <Callout emoji="🏎️">
          <strong>The brain is exactly the kind of network you already know</strong>: five
          inputs (the sensors) → two hidden layers → five outputs (the steering choices).
          The car picks whichever output scores highest. Two hidden layers let it learn
          combinations like “wall close on the right <em>and</em> clear ahead → ease left”
          that a single layer couldn’t express.
        </Callout>
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The car’s brain: 5 sensors → 7 → 5 → 5 steering choices. Same feed-forward network as the XOR demo, just wider. The only question is how to find good weights for it.">
          <BrainShape />
        </Figure>
      </Beat>

      <Beat as="h2">Why backprop is stuck here</Beat>
      <Beat as="p">
        Backpropagation needs an <em>error</em>: the gap between what the network said and
        what it should have said. On XOR we had four rows of “input → correct output.” But
        a car halfway around a bend has no correct output written down anywhere. We only
        find out whether a <em>whole run of choices</em> was any good after the fact - did
        the car get far, or did it crash? There’s no per-moment answer key to differentiate,
        so there’s no gradient to descend.
      </Beat>

      <Beat as="h2">The idea: don’t teach one, breed many</Beat>
      <Beat as="p">
        Nature solved “no teacher” long ago, through evolution - and we can borrow the exact
        recipe. Instead of training a single network, we create a whole{' '}
        <strong>population</strong> of them, each with different random weights. We let them
        all drive, then keep the ones that did best and build the next generation from them.
        Skill accumulates across generations. The loop has four moving parts:
      </Beat>

      <Beat>
        <ol className="point-list">
          <li>
            <span className="point-num">1</span>
            <div>
              <strong>Fitness.</strong> Each car gets one score - how far around the track it
              travelled before crashing (measured by checkpoints passed). That single number
              is the <em>only</em> feedback the algorithm ever gets. No labels, no gradient.
            </div>
          </li>
          <li>
            <span className="point-num">2</span>
            <div>
              <strong>Selection.</strong> Rank the cars by fitness and keep the top slice.
              The clumsy majority that crashed early are simply discarded - they don’t get to
              reproduce.
            </div>
          </li>
          <li>
            <span className="point-num">3</span>
            <div>
              <strong>Crossover.</strong> Make each new car by mixing the weights of two
              survivors - for every weight, flip a coin for which parent it comes from. A
              child is a fresh blend of two styles that both worked.
            </div>
          </li>
          <li>
            <span className="point-num">4</span>
            <div>
              <strong>Mutation.</strong> Jitter a few of the child’s weights at random. This
              is where genuinely new behaviour comes from - without it, the population could
              only ever reshuffle the weights it started with.
            </div>
          </li>
        </ol>
      </Beat>

      <Beat as="p">
        Notice what’s missing: no chain rule, no learning rate, no calculus of any kind. The
        weights improve purely because <em>the ones that drive better make more copies of
        themselves.</em> This family of methods is called <strong>neuroevolution</strong>,
        and the underlying trick - the <strong>genetic algorithm</strong> - predates
        backpropagation.
      </Beat>

      <Beat>
        <CitationCard ids={['holland-1975', 'sims-1994', 'neat-2002']} />
      </Beat>

      <Beat as="h2">Watch it learn from nothing</Beat>
      <Beat as="p">
        Here’s the whole thing, live - and <strong>you pick the track it trains on</strong>.
        Forty cars start with random brains and no idea what a wall is. Press{' '}
        <strong>Train</strong>: generation 1 is a demolition derby, but keep watching the
        fitness curve - it climbs, the pack gets further each round, and within a handful of
        generations a descendant of those first hopeless cars is driving the full loop. Then,
        in <strong>Test on</strong>, drop that trained brain onto tracks it has never seen.
      </Beat>
      <Beat as="h2">Which track you train on matters</Beat>
      <Beat as="p">
        Now the real experiment. Train on the easy <strong>Trainer Oval</strong> first - it solves
        in seconds. Then send that brain to a hard track and watch it{' '}
        <strong>crash almost immediately</strong>. The wide, gentle oval never showed it a real
        corner, so it only ever learned a lazy wobble. That’s <strong>overfitting</strong>, the
        trap from <ChapterRef id="evaluation" />: brilliant on what you trained on, useless on
        anything new.
      </Beat>
      <Beat as="p">
        Then <strong>Reset</strong>, train on any of the twisty tracks instead, and test again -
        the same brain handles <em>all five</em>. A hard, varied circuit forces it to learn to
        actually corner, and because the car only ever senses five relative wall distances
        (never <em>where</em> it is), it can’t memorize a map - it’s pushed toward a general
        reflex: <em>“given what my whiskers feel right now, steer this way.”</em> Train on the
        hard stuff and the easy stuff comes for free.
      </Beat>


      <Beat>
        <Figure caption="Fig 2 · Neuroevolution in real time - then a generalization test. Pick a training track, evolve until it’s solved, then watch the same frozen brain attempt all five circuits.">
          <CarLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="✅">
          <strong>The whole point:</strong> we never showed the car a single “correct” turn.
          We only scored how far each one got and let the best ones reproduce - and out of
          that fell a competent driver. Selection plus variation is enough to find good
          weights, even when backprop can’t.
        </Callout>
      </Beat>
      <Beat>
        <Callout emoji="🧭">
          <strong>Generalization, the good twin of overfitting:</strong> a model that learns
          the underlying <em>skill</em> rather than the specific examples keeps working on new
          inputs. Two things bought it here - <strong>varied, hard training data</strong> (the
          twisty track), and <strong>inputs that don’t leak the answer</strong> (sensors, not
          coordinates). We even nudge each car’s start a little every generation so it can’t
          memorize one racing line - a trick called <em>domain randomization</em>.
        </Callout>
      </Beat>

      <Beat as="h2">The real code - the brain and the breeding</Beat>
      <Beat as="p">
        Here’s the network plus the genetic algorithm behind the demo, no libraries. The
        <code>CarBrain</code> is an ordinary feed-forward net - a <code>forward</code> pass
        and an <code>act</code> that picks the highest-scoring steering choice - with{' '}
        <code>clone</code>, <code>crossover</code> and <code>mutate</code> added so it can be
        bred. <code>Population.evolve</code> is the four-step loop above, spelled out.
      </Beat>
      <Beat>
        <CodeViewer code={neuroSource} filename="src/llm/neuroevolution.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        And the world it drives in - the track, the whisker sensors, and the fitness score -
        all built from one tiny “do these two line segments cross?” helper:
      </Beat>
      <Beat>
        <CodeViewer code={trackSource} filename="src/llm/car-track.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        Two ways to find weights, then: <strong>backpropagation</strong>, when you can measure
        the error of every answer, and <strong>evolution</strong>, when all you can measure is
        how well a whole run turned out. Reinforcement learning - how models learn to play
        games, and part of how <ChapterRef id="assistant" /> turns a base model into an
        assistant - lives in the same “no answer key, only a score” world you just watched a
        car conquer.
      </Beat>
    </ChapterFrame>
  );
}
