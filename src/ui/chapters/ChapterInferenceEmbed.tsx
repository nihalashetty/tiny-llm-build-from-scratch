import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { WarmupBar } from '../components/WarmupBar';
import { useInferenceModel } from '../useInferenceModel';
import { Input } from '@/components/ui/input';

/** Diverging colour: blue for negative, coral for positive, pale near zero. */
function cellColor(v: number, scale: number) {
  const x = Math.max(-1, Math.min(1, v / scale));
  if (x >= 0) {
    // pale → coral
    const t = x;
    return `rgb(${Math.round(247 - t * 7)},${Math.round(241 - t * 139)},${Math.round(230 - t * 168)})`;
  }
  const t = -x; // pale → blue
  return `rgb(${Math.round(247 - t * 185)},${Math.round(241 - t * 130)},${Math.round(230 - t * -10)})`;
}

function Strip({ vec, scale }: { vec: number[]; scale: number }) {
  return (
    <span className="inline-flex gap-px rounded border bg-card p-0.5">
      {vec.map((v, i) => (
        <span key={i} className="rounded-[1px] w-[7px] h-4" style={{ background: cellColor(v, scale) }} title={v.toFixed(3)} />
      ))}
    </span>
  );
}

function EmbedLab() {
  const { model, ready, progress } = useInferenceModel({ seed: 3 });
  const [text, setText] = useState('the queen wears a crown');

  const rows = useMemo(() => {
    const ids = model.encodeIds(text).slice(0, 8);
    return ids.map((id, t) => {
      const tokEmb = model.tokenEmbedding(id);
      const posEmb = model.positionEmbedding(t);
      const sum = tokEmb.map((e, d) => e + posEmb[d]);
      return { word: model.vocab[id], id, pos: t, tokEmb, posEmb, sum };
    });
    // re-run when the model warms up (tick) so colours settle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, model, ready]);

  const scale = 0.15;

  return (
    <div className="lab">
      <WarmupBar ready={ready} progress={progress} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-[0.78rem] text-muted-foreground">Prompt</label>
        <Input
          style={{ marginBottom: 0, maxWidth: 320 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="dim" style={{ fontSize: 12, margin: '2px 0 10px' }}>
        Each token becomes a vector of <b>{model.D}</b> numbers (real models use thousands).
        Blue = negative, coral = positive.
      </div>

      <div className="flex flex-col gap-1.5 overflow-x-auto">
        <div className="grid gap-2 pl-0.5 font-mono text-[0.62rem] text-muted-foreground" style={{ gridTemplateColumns: '120px auto 16px auto 16px auto' }}>
          <span style={{ gridColumn: 2 }}>token vector</span>
          <span>+ position</span>
          <span>= what flows in</span>
        </div>
        {rows.map((r) => (
          <div key={r.pos} className="flex items-center gap-2">
            <span className="w-[120px] flex-none text-right font-mono text-xs text-foreground">
              {r.word} <span className="text-[0.62rem] text-muted-foreground">#{r.id}</span>
            </span>
            <Strip vec={r.tokEmb} scale={scale} />
            <span className="font-mono text-muted-foreground text-[0.8rem]">+</span>
            <Strip vec={r.posEmb} scale={scale} />
            <span className="font-mono text-muted-foreground text-[0.8rem]">=</span>
            <Strip vec={r.sum} scale={scale} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Show that the SAME word gets a different final vector at different positions. */
function SameWordLab() {
  const { model, ready, progress } = useInferenceModel({ seed: 3 });
  const word = 'the';
  const id = model.stoi.get(word)!;
  const rows = useMemo(() => {
    return [0, 1, 2, 3].map((t) => {
      const tokEmb = model.tokenEmbedding(id);
      const posEmb = model.positionEmbedding(t);
      return { pos: t, sum: tokEmb.map((e, d) => e + posEmb[d]) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, ready, id]);

  return (
    <div className="lab">
      <WarmupBar ready={ready} progress={progress} />
      <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>
        The word <code>the</code> at four different positions, same token vector, but the
        positional stamp makes each final vector distinct:
      </div>
      <div className="flex flex-col gap-1.5 overflow-x-auto">
        {rows.map((r) => (
          <div key={r.pos} className="flex items-center gap-2">
            <span className="w-[120px] flex-none text-right font-mono text-xs text-foreground">
              “the” @ pos {r.pos}
            </span>
            <Strip vec={r.sum} scale={0.15} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChapterInferenceEmbed() {
  return (
    <ChapterFrame id="inference-embed">
      <Beat as="p" className="lead">
        Your message is now a row of integers like <code>[95, 70, 105, 1, 22]</code>. But
        an id is just a name tag, <code>queen</code> being id 70 tells the model nothing
        about queens. To actually <em>compute</em>, each id has to become something with
        shape and direction: a <strong>vector</strong>.
      </Beat>

      <Beat as="h2">A lookup table of learned meaning</Beat>
      <Beat as="p">
        The model carries a giant table, the <strong>embedding matrix</strong>, with one
        row per token in its vocabulary. Turning an id into a vector is nothing more than{' '}
        <em>reading that row.</em> Id 70 → grab row 70 → out comes a list of numbers. Those
        numbers were shaped during training (this is the arrows-in-space idea from Part 1),
        so related words sit in similar directions. At inference the table is{' '}
        <strong>frozen</strong>; we only ever look things up.
      </Beat>

      <Beat as="h2">But order matters, so we stamp the position</Beat>
      <Beat as="p">
        There’s a catch you met with the transformer: attention treats its input as an
        unordered bag, so “dog bites man” and “man bites dog” would look identical. The
        fix is small, add a second learned vector that depends only on the{' '}
        <strong>position</strong> in the sequence. Token vector <em>plus</em> position
        vector = the thing that actually flows into the network. That’s the whole of the{' '}
        <code>h = E[id] + P[t]</code> step.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Each token id looks up its learned vector, gets its position stamp added, and the sum is what enters the first layer. Every square is one of the model’s numbers.">
          <EmbedLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="📍">
          <strong>Same word, different slot, different vector.</strong> Because the
          position stamp is added in, one repeated word doesn’t arrive as the same input
          twice, which is exactly what lets the model care about word order.
        </Callout>
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · The identical token “the” at four positions. The learned word vector is the same each time; the positional stamp makes the sum different.">
          <SameWordLab />
        </Figure>
      </Beat>

      <Beat as="h2">Now the model finally has something to think with</Beat>
      <Beat as="p">
        That’s the quiet turning point of the whole pipeline. Up to here we were just
        shuffling labels, text to tokens to ids. Now every position in your prompt is a
        rich vector of real numbers, carrying both <em>what</em> the word is and{' '}
        <em>where</em> it sits. From here on it’s all arithmetic: matrix multiplies, dot
        products, and softmaxes.
      </Beat>

      <Beat>
        <Callout emoji="🧠" tone="neutral">
          <strong>Scale check.</strong> Our toy uses {24}-number vectors and a few dozen
          tokens. A frontier model uses vectors of several <em>thousand</em> numbers and a
          vocabulary in the hundreds of thousands, so its embedding table alone holds
          billions of values. Same lookup-and-add, vastly wider.
        </Callout>
      </Beat>

      <Beat as="p">
        A stack of vectors, one per token, is now sitting at the door of the network.
        Time to send them through it, one single sweep, no learning, just computation.
        That’s the forward pass.
      </Beat>
    </ChapterFrame>
  );
}
