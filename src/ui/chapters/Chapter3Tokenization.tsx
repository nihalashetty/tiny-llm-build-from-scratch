import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { BpeMerges, TokenizeBox } from '../viz/BpeMerges';
import bpeSource from '../../llm/bpe.ts?raw';

export function Chapter3Tokenization() {
  return (
    <ChapterFrame id="tokenization">
      <Beat as="p" className="lead">
        Our network from Chapter 2 only understands numbers. Language is made of
        text. So the very first job of any language model is boring but crucial:
        <strong> chop the text into pieces and give each piece a number.</strong>{' '}
        The pieces are called <strong>tokens</strong>, and how you choose them
        turns out to matter a lot.
      </Beat>

      <Beat as="h2">Letters? Words? Both are bad.</Beat>
      <Beat as="p">
        You could split text into <em>letters</em> — only ~26 of them, but then
        the model has to reassemble meaning from tiny scraps, one letter at a
        time. Or split into <em>whole words</em> — easy to read, but there are
        millions of them, you'll always meet a new one, and “walk”, “walks”,
        “walking” look totally unrelated. Neither works. We want something in
        between: <strong>subwords</strong>.
      </Beat>

      <Beat as="p">
        Claude Shannon had already measured, back in 1951, just how much
        redundancy English carries — the raw material that makes this
        compression possible. The actual method we use came from an unlikely
        place: a 1994 <em>file-compression</em> trick called Byte Pair Encoding,
        rediscovered for language in 2015.
      </Beat>

      <Beat>
        <CitationCard ids={['shannon-1951', 'bpe-1994', 'bpe-nmt-2015']} />
      </Beat>

      <Beat as="h2">Watch a vocabulary build itself</Beat>
      <Beat as="p">
        BPE is delightfully simple. Start with nothing but individual characters.
        Find the two tokens that sit next to each other most often, and glue them
        into one new token. Repeat. Frequent chunks like <code>th</code>,{' '}
        <code>ee</code>, then whole words like <code>queen</code> emerge on their
        own. Step through it on our Little Kingdom text:
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Each step glues the most frequent adjacent pair. Watch the showcase words collapse from characters toward whole words.">
          <BpeMerges />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🧩">
          Notice what happened: nobody wrote a dictionary. The vocabulary{' '}
          <em>grew out of the text itself</em> — common patterns became single
          tokens, and anything rare stays splittable into pieces the model has
          seen before. That's why a model can read a word it's never encountered.
        </Callout>
      </Beat>

      <Beat as="h2">Try it on your own words</Beat>
      <Beat as="p">
        Type anything below. Familiar words (ones that appeared in our tiny
        corpus) collapse to a single token; unfamiliar ones shatter into
        subword shards. This is exactly why models have <strong>context
        limits</strong> and <strong>per-token pricing</strong> — everything is
        counted in tokens, not words.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · A word you trained on = 1 token. A stranger = several. Roughly 3–4 letters per token for English.">
          <TokenizeBox />
        </Figure>
      </Beat>

      <Beat as="h2">The whole tokenizer</Beat>
      <Beat as="p">
        Here's the real code — the same functions the two widgets above call.{' '}
        <code>trainBpe</code> learns the merges; <code>tokenize</code> applies
        them. It's all counting and gluing.
      </Beat>

      <Beat>
        <CodeViewer code={bpeSource} filename="src/llm/bpe.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        Now every token has an ID — a plain integer. But <code>queen = 42</code>{' '}
        and <code>king = 17</code> are just labels; the numbers say nothing about
        meaning. As far as the model knows, “queen” is as related to “king” as it
        is to “broccoli”. Our next job is to fix that — to give these numbers{' '}
        <strong>meaning</strong>.
      </Beat>
    </ChapterFrame>
  );
}
