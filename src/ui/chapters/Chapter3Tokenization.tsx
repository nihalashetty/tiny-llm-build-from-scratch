import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { BpeMerges, TokenizeBox } from '../viz/BpeMerges';
import { CorpusView } from '../viz/CorpusView';
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

      <Beat as="h2">First, meet our corpus</Beat>
      <Beat as="p">
        BPE finds patterns by <em>counting</em>, so before we count anything you
        should see exactly what we're counting <em>in</em>. Here's the whole thing —
        a tiny hand-written world called <strong>Little Kingdom</strong>, kept small
        and repetitive on purpose so a model can learn it right here in your browser.
        Read a few lines and one word jumps out: <code>the</code> is everywhere.
        That repetition is the raw material BPE feeds on.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Our entire training corpus — the actual text every demo in this chapter reads from. Each “th” is highlighted; there are 95, which is why t+h is the first pair BPE glues.">
          <CorpusView />
        </Figure>
      </Beat>

      <Beat as="h2">Watch a vocabulary build itself</Beat>
      <Beat as="p">
        BPE is delightfully simple. Start with nothing but individual characters.
        Find the two tokens that sit next to each other most often, and glue them
        into one new token. Repeat. Frequent chunks like <code>th</code>,{' '}
        <code>ee</code>, then whole words like <code>queen</code> emerge on their
        own. Step through it on our Little Kingdom text:
      </Beat>

      <Beat as="p">
        So what <em>is</em> the vocabulary to begin with? Just the set of distinct
        characters that appear in the whole corpus — for our Little Kingdom text
        that's the 24 letters shown in the <strong>vocabulary strip</strong> below
        (a–z minus the couple that never occur). Every merge then adds exactly one
        new token to that strip, so you can literally watch the count climb from 24
        upward as whole words form.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · The vocabulary strip starts as the 24 characters in the text; each step glues the most frequent adjacent pair into a new token (highlighted) and the showcase words collapse from characters toward whole words.">
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
        <Figure caption="Fig 3 · A word you trained on = 1 token. A stranger = several. Roughly 3–4 letters per token for English.">
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

      <Beat as="h2">Now zoom out: how GPT does it</Beat>
      <Beat as="p">
        Here's the reassuring part: what you just built <em>is</em> the real
        algorithm. The models powering ChatGPT and friends change almost nothing
        about the <em>method</em> — only the <em>scale</em>.
      </Beat>

      <Beat>
        <ul className="point-list">
          <li>
            <span className="point-num">1</span>
            <div>
              <strong>Same trick, but on raw bytes.</strong> GPT-style tokenizers run
              “byte-level” BPE: they start not from the 24 letters we happened to
              have, but from the 256 possible bytes. The identical merging then works
              on any language, emoji, or code — there's literally no such thing as a
              character it can't read.
            </div>
          </li>
          <li>
            <span className="point-num">2</span>
            <div>
              <strong>A vocabulary in the tens of thousands.</strong> You watched an
              ~80-token vocabulary build itself. GPT-2 and GPT-3 stopped at{' '}
              <strong>50,257</strong> tokens; GPT-4's tokenizer uses about{' '}
              <strong>100,000</strong>; the newest ones roughly{' '}
              <strong>200,000</strong>. Same process — just far more merges before
              they call it done.
            </div>
          </li>
          <li>
            <span className="point-num">3</span>
            <div>
              <strong>A corpus you can't hold in your head.</strong> Our Little
              Kingdom is ~60 sentences. Frontier models learn from a firehose of text
              scraped from the open web (Common Crawl), plus books, Wikipedia and code
              — on the order of <strong>hundreds of billions to trillions of tokens</strong>.
              GPT-3 alone trained on roughly 300 billion; recent models, many trillions.
            </div>
          </li>
        </ul>
      </Beat>

      <Beat>
        <Callout emoji="🔭">
          <strong>Same idea, bigger dials.</strong> “Glue the most frequent pair, over
          and over” is exactly what runs, unchanged, inside every model you've heard
          of. When you hear a model has a “100k vocab” or was “trained on trillions of
          tokens,” you now know precisely what those numbers mean — and you built the
          smaller version yourself.
        </Callout>
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
