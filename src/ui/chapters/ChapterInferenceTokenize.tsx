import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { SnippetRunner } from '../components/SnippetRunner';
import { TinyTransformer } from '../../llm/transformer';
import { corpusText } from '../../llm/corpus/little-kingdom';

/**
 * Live tokenizer for inference: type text, watch it split into the model's
 * whole-word tokens and their integer ids, and see which words the model has
 * never seen (dropped, because they're not in its vocabulary).
 */
function TokenizeLab() {
  // The vocabulary is fixed the moment the model is built, no training needed
  // just to *tokenize*. This is the exact same vocab used everywhere in Part 2.
  const model = useMemo(() => new TinyTransformer(corpusText), []);
  const [text, setText] = useState('the queen wears a gold crown');

  const pieces = useMemo(() => {
    return TinyTransformer.tokenize(text).map((tok) => ({
      tok,
      id: model.stoi.get(tok),
    }));
  }, [text, model]);

  const known = pieces.filter((p) => p.id !== undefined);
  const idArray = known.map((p) => p.id);

  return (
    <div className="lab">
      <div className="field">
        <label>Your message</label>
        <input
          className="tokenize-input"
          style={{ marginBottom: 0, maxWidth: 320 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="dim" style={{ fontSize: 12, margin: '2px 0 10px' }}>
        This tiny model’s vocabulary has just <b>{model.V}</b> tokens - every whole
        word in the Little Kingdom text, plus a full stop. Real models have
        50,000–200,000 subword tokens.
      </div>

      <div className="tokrow">
        {pieces.map((p, i) => (
          <span
            key={i}
            className={`tokchip${p.id === undefined ? ' unknown' : ''}`}
            title={p.id === undefined ? 'not in the vocabulary, dropped' : `token id ${p.id}`}
          >
            <span className="tokchip-word">{p.tok}</span>
            <span className="tokchip-id">{p.id === undefined ? '∅' : p.id}</span>
          </span>
        ))}
      </div>

      <div className="idreadout">
        <span className="idreadout-label">what the model actually receives →</span>
        <code>[{idArray.join(', ')}]</code>
      </div>
    </div>
  );
}

const TOKENIZE_SNIPPET = `// A miniature of what a tokenizer does at inference time.
// Split text into known pieces, then swap each for its integer id.

const vocab = { "the": 0, "queen": 1, "wears": 2, "a": 3, "gold": 4, "crown": 5 };

function tokenize(text) {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

const message = "The queen wears a gold crown";
const words = tokenize(message);
const ids   = words.map(w => vocab[w]);

console.log("words:", words);
console.log("ids:  ", ids);   // <- the model never sees letters, only these`;

export function ChapterInferenceTokenize() {
  return (
    <ChapterFrame id="inference-tokenize">
      <Beat as="p" className="lead">
        Your message is still just letters on a screen, and the model can’t read a
        single one of them. Before anything else can happen, the text has to become{' '}
        <strong>numbers</strong>. That’s the first stop on the journey, and you already
        built the machine that does it, back in Part 1.
      </Beat>

      <Beat as="h2">The same tokenizer, now running the other way</Beat>
      <Beat as="p">
        In training, the tokenizer <em>learned</em> its vocabulary, scanning mountains
        of text to find the pieces worth keeping. That learning is done. At inference,
        the vocabulary is <strong>frozen</strong>, and the tokenizer just applies it:
        it chops your sentence into known pieces and looks up each piece’s integer id.
        No decisions, no learning, a dictionary lookup.
      </Beat>

      <Beat>
        <Callout emoji="🔒">
          <strong>Frozen, like everything else at inference.</strong> The list of tokens
          and their ids was fixed when the model was built. Every conversation you’ll ever
          have runs through the exact same table. Type a word it learned, and it’s one
          neat token; type a stranger, and it shatters into smaller pieces it does know.
        </Callout>
      </Beat>

      <Beat as="h2">Watch your words shatter into ids</Beat>
      <Beat as="p">
        Type anything below. Our tiny model only knows whole words from the Little
        Kingdom, so each word either maps to one id or, if it never appeared in that
        text, gets dropped (∅). Real tokenizers never drop anything: they fall back to
        subword pieces, so <em>every</em> possible string becomes some list of ids.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Your sentence → tokens → ids. The bottom row is literally all the model receives: a list of integers.">
          <TokenizeLab />
        </Figure>
      </Beat>

      <Beat as="h2">The whole thing is just counting tokens</Beat>
      <Beat as="p">
        This is why everything about an LLM is measured in <strong>tokens</strong>, not
        words. Your context limit, the price per API call, how much of a long chat the
        model can still “see”, all of it is counted in these little integers. A rough
        rule for English: about <strong>¾ of a word per token</strong>, or 3–4 characters
        each.
      </Beat>

      <Beat as="p">
        Here’s the whole idea in a runnable nutshell, split, then look up. Press{' '}
        <strong>Run</strong>, then try changing the message:
      </Beat>

      <Beat>
        <SnippetRunner initialCode={TOKENIZE_SNIPPET} filename="tokenize.js" />
      </Beat>

      <Beat>
        <Callout emoji="🧩" tone="neutral">
          <strong>Remember from Part 1:</strong> real models use byte-level BPE, so their
          vocabulary covers every language, emoji and code snippet on Earth, there’s
          literally no such thing as a character they can’t tokenize. The <em>method</em>{' '}
          is the one you built in the Tokenization chapter; only the scale changed.
        </Callout>
      </Beat>

      <Beat as="p">
        So now your message is a row of integers. But an integer id like{' '}
        <code>42</code> is just a name tag, it says nothing about what the word{' '}
        <em>means</em>. Before that, though, there’s a subtler surprise: the model isn’t
        even fed your bare sentence. It’s handed a little <em>script</em>, with roles and
        hidden markers. Let’s pull back that curtain next.
      </Beat>
    </ChapterFrame>
  );
}
