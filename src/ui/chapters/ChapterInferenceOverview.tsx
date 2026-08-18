import { useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { cn } from '@/lib/utils';

/**
 * The eight stops on the journey a single message takes through the model at
 * inference time. Each maps to a chapter later in Part 2, so the overview reads
 * like a table of contents you can click.
 */
interface Stage {
  key: string;
  glyph: string;
  title: string;
  color: string;
  short: string;
  detail: string;
  chapter: string; // navTitle of the chapter that covers it
}

const STAGES: Stage[] = [
  {
    key: 'msg',
    glyph: '✍️',
    title: 'Your message',
    color: '#e0553a',
    short: 'the words you type',
    detail:
      'It starts as plain text on your screen: “Explain gravity like I’m five.” The model can’t read letters, so nothing can happen until we turn this into numbers.',
    chapter: 'The journey of a message',
  },
  // Note the order: the chat wrapper is assembled around your text FIRST, and the
  // whole script is what gets tokenized. (We teach tokens first, because you
  // already built that machine in Part 1 - but this is the real running order.)
  {
    key: 'chat',
    glyph: '🧾',
    title: 'Chat wrapper',
    color: '#3e6ff0',
    short: 'roles + special tokens',
    detail:
      'You typed one line, but the model is fed a little script: a system role, your user turn, and an empty assistant turn it’s expected to finish, all marked with special tokens it learned to obey. This wrapping happens before anything is tokenized.',
    chapter: 'The chat template',
  },
  {
    key: 'tok',
    glyph: '✂️',
    title: 'Tokens',
    color: '#10866a',
    short: 'text → pieces → ids',
    detail:
      'The exact same tokenizer built during training chops that whole script into known pieces and swaps each for an integer id. “gravity” might be one token; a rare word splits into several.',
    chapter: 'Message → tokens',
  },
  {
    key: 'vec',
    glyph: '📐',
    title: 'Vectors',
    color: '#e0553a',
    short: 'ids → learned arrows',
    detail:
      'Every id looks up a learned vector, its meaning, and gets stamped with its position in the sequence. Now the model finally has numbers it can compute with.',
    chapter: 'Tokens → vectors',
  },
  {
    key: 'fwd',
    glyph: '🔀',
    title: 'Forward pass',
    color: '#10866a',
    short: 'attention, layer by layer',
    detail:
      'No learning happens now, the weights are frozen. The vectors flow forward through the stacked layers, where every token reads every earlier token and mixes in what it needs.',
    chapter: 'The forward pass',
  },
  {
    key: 'logits',
    glyph: '📊',
    title: 'Scores',
    color: '#3e6ff0',
    short: 'one number per word',
    detail:
      'The final layer produces a score (a “logit”) for every single word in the vocabulary. Softmax turns those raw scores into probabilities, a bet on what the next word should be.',
    chapter: 'Logits & probabilities',
  },
  {
    key: 'pick',
    glyph: '🎲',
    title: 'Pick a word',
    color: '#e0553a',
    short: 'sample one token',
    detail:
      'From that probability distribution we choose exactly one token, steered by temperature and top-p. Then the surprising part: we glue it onto the end and loop all the way back to the forward pass.',
    chapter: 'Sampling & the loop',
  },
  {
    key: 'reply',
    glyph: '💬',
    title: 'Reply',
    color: '#10866a',
    short: 'stream it back',
    detail:
      'Each new token is turned back into text and streamed to your screen the instant it’s chosen, which is why answers appear word by word. The loop stops at a special “end” token or a length limit.',
    chapter: 'The full run',
  },
];

function PipelineMap() {
  const [sel, setSel] = useState<string>('msg');
  const active = STAGES.find((s) => s.key === sel)!;

  return (
    <div className="lab">
      <div className="mb-4 flex flex-wrap items-stretch gap-1.5">
        {STAGES.map((s, i) => (
          <div key={s.key} style={{ display: 'contents' }}>
            <button
              className={cn(
                'flex flex-1 basis-[92px] min-w-[92px] cursor-pointer flex-col items-center gap-1 rounded-xl border bg-card px-2 py-2.5 text-center transition-colors hover:border-ring',
                sel === s.key && 'border-primary bg-muted',
              )}
              style={
                {
                  '--pipe-c': s.color,
                } as React.CSSProperties
              }
              onClick={() => setSel(s.key)}
              aria-pressed={sel === s.key}
            >
              <span className="text-xl leading-none">{s.glyph}</span>
              <span className="font-bold text-[0.78rem]">{s.title}</span>
              <span className="font-mono text-[0.6rem] leading-tight text-muted-foreground">{s.short}</span>
            </button>
            {i < STAGES.length - 1 && (
              <span className="self-center text-base text-muted-foreground/60" aria-hidden="true">
                {/* the loop lives between "Pick a word" and "Reply" */}
                {s.key === 'pick' ? '↺' : '→'}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mb-3.5 rounded-xl border bg-card px-3.5 py-3" style={{ borderColor: active.color }}>
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2 text-[0.95rem] font-semibold" style={{ color: active.color }}>
          <span>{active.glyph}</span>
          <b>{active.title}</b>
          <span className="font-mono text-[0.7rem] text-muted-foreground">→ “{active.chapter}”</span>
        </div>
        <p className="m-0 text-[0.9rem] leading-relaxed text-foreground/90">{active.detail}</p>
      </div>

      <div className="rounded-lg border bg-card px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        Click any stop on the journey. The loop symbol <b>↺</b> is the whole trick:
        after picking one word, the model feeds it back and runs the pass again, so a
        long answer is really the same tiny step repeated, once per word.
      </div>
    </div>
  );
}

export function ChapterInferenceOverview() {
  return (
    <ChapterFrame id="inference-overview">
      <Beat as="p" className="lead">
        You type <em>“Explain gravity like I’m five,”</em> and hit send. For a heartbeat,
        nothing. Then words start appearing, one, then the next, then the next, until a
        whole friendly explanation has assembled itself on your screen. What happened in
        that gap? That question is the whole of Part 2.
      </Beat>

      <Beat as="h2">Training built the brain. Now we just use it.</Beat>
      <Beat as="p">
        Everything in Part 1 was about <strong>training</strong>: a slow, expensive,
        one-time process that read mountains of text and nudged millions of weights until
        the model got good at predicting the next word. That’s done. The weights are now{' '}
        <strong>frozen</strong>.
      </Beat>
      <Beat as="p">
        What happens every time you send a message is a completely different mode, called{' '}
        <strong>inference</strong>. Nothing is learned. No weight changes. We simply run
        the finished machine <em>forward</em>, and out comes a reply. Training happens
        once, in a data centre, over weeks. Inference happens billions of times a day, in
        under a second, and it’s what you actually talk to.
      </Beat>

      <Beat>
        <Callout emoji="🧊">
          <strong>The key mental shift:</strong> training <em>writes</em> the brain, once.
          Inference <em>reads</em> it, unchanged, over and over. Every reply Claude or GPT
          ever gives you uses the exact same frozen numbers, the only thing that differs
          is the text you feed in.
        </Callout>
      </Beat>

      <Beat as="h2">The whole journey, on one map</Beat>
      <Beat as="p">
        Before we zoom into each piece, here’s the entire trip your message takes. Eight
        stops, most of which you already met in Part 1, now wearing their “answering”
        hats. Click each to see what it does; the rest of Part 2 is just these stops, slowed
        right down.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · One message, eight stops. The ↺ between “Pick a word” and “Reply” is the loop that writes the whole answer, one token at a time.">
          <PipelineMap />
        </Figure>
      </Beat>

      <Beat as="h2">The one weird trick behind every answer</Beat>
      <Beat as="p">
        Here’s the thing that surprises almost everyone. That elaborate machine (tokenize,
        embed, layers of attention, thousands of scores) does all of that work just to
        produce <strong>one</strong> word. Not the sentence. Not the paragraph. A single
        next token.
      </Beat>
      <Beat as="p">
        To write a whole answer, it does the entire thing again. And again. Each time, the
        word it just wrote becomes part of the input for the next round. Predict one word,
        stick it on the end, feed the longer text back in, predict the next. That loop, run hundreds of times, is what you watch when a reply “types” itself out.
      </Beat>

      <Beat>
        <Callout emoji="🔁">
          <strong>It never sees the finished answer in advance.</strong> The model doesn’t
          plan the reply and then write it down. It genuinely writes the way you’d improvise
          out loud, committing to one word at a time, each choice shaped by everything said
          so far. The coherence is an emergent side-effect of a very, very good
          next-word guesser.
        </Callout>
      </Beat>

      <Beat as="p">
        That’s the map. Now let’s take the first step and watch your sentence get torn into
        the little numbered pieces the model actually reads.
      </Beat>
    </ChapterFrame>
  );
}
