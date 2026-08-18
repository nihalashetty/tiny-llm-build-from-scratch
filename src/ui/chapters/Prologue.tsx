import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { SnippetRunner } from '../components/SnippetRunner';

const shannonGame = `// Shannon's game (1951): how guessable is the next letter?
// Let's see which letter tends to follow "th" in a little sentence.
const text = "the king and the queen sat on the throne in the throne room";

const after = {};
for (let i = 0; i + 2 < text.length; i++) {
  if (text[i] === "t" && text[i + 1] === "h") {
    const next = text[i + 2];
    after[next] = (after[next] || 0) + 1;
  }
}

console.log('After "th", the next letter was:');
console.log(after);
console.log('So a good guess for the next letter is "e".');`;

export function Prologue() {
  return (
    <ChapterFrame id="prologue">
      <Beat as="p" className="lead">
        You type a few words. A moment later, sentences come back - fluent,
        relevant, sometimes even funny. It feels like <em>someone</em> is in
        there. So here's the only question this whole course exists to answer:
        <strong> what is actually happening inside the box?</strong>
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Text goes in, text comes out. Everything in this course is about the “?”.">
          <BlackBox />
        </Figure>
      </Beat>

      <Beat as="p">
        We're going to open that box completely. Not with hand-waving and
        analogies you have to take on faith, but by <strong>building a tiny
        language model from scratch</strong>, one honest piece at a time - and
        watching each piece work. By the end, the “?” will just be a stack of
        ideas you've seen with your own eyes.
      </Beat>

      <Beat as="h2">Two people saw this coming - decades early</Beat>

      <Beat as="p">
        Long before computers could hold a conversation, two thinkers guessed
        how it might happen. <strong>Claude Shannon</strong> noticed that
        language is deeply predictable: cover the last word of a sentence and
        you can usually guess it. He measured exactly how guessable English is -
        and that idea, “predict the next bit of text,” is the beating heart of
        every model we'll build.
      </Beat>

      <Beat as="p">
        <strong>Alan Turing</strong> asked a different question: never mind what's
        going on inside - if a machine's replies are indistinguishable from a
        person's, does the difference matter? That's the bar. That's the game.
      </Beat>

      <Beat>
        <CitationCard ids={['shannon-1951', 'turing-1950', 'shannon-1948']} />
      </Beat>

      <Beat as="h2">Play Shannon's game for a second</Beat>

      <Beat as="p">
        Predicting the next letter sounds trivial, but it's the entire trick,
        scaled up billions of times. Here's the smallest possible taste: count
        what usually comes after the letters <code>th</code> in a sentence. Hit{' '}
        <strong>Run</strong> - then change the text and run it again.
      </Beat>

      <Beat>
        <SnippetRunner initialCode={shannonGame} filename="shannons-game.js" />
      </Beat>

      <Beat>
        <Callout emoji="🧭">
          <strong>Where we're headed:</strong> fake conversations with pure rules
          → teaching machines to learn from examples → turning words into numbers,
          then into meaning → the transformer that powers today's models → and
          finally, how a raw model becomes a helpful assistant. Same thread the
          whole way. Turn the page.
        </Callout>
      </Beat>
    </ChapterFrame>
  );
}

/** A small self-drawn "black box" diagram - no external assets. */
function BlackBox() {
  return (
    <svg viewBox="0 0 640 220" width="100%" role="img" aria-label="Text goes into a black box and text comes out">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#b6bcc6" />
        </marker>
      </defs>

      {/* input */}
      <rect x="8" y="86" width="176" height="48" rx="10" fill="#fbfbfc" stroke="#e2e5ea" />
      <text x="96" y="115" textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="14" fill="#3c414b">
        the queen wears a…
      </text>

      <line x1="188" y1="110" x2="236" y2="110" stroke="#b6bcc6" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* the box */}
      <rect x="240" y="40" width="160" height="140" rx="18" fill="#15171c" />
      <text x="320" y="128" textAnchor="middle" fontFamily="'Geist', sans-serif" fontSize="72" fontWeight="800" fill="#e0553a">
        ?
      </text>
      <text x="320" y="164" textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="11" fill="#8b929e">
        the model
      </text>

      <line x1="404" y1="110" x2="452" y2="110" stroke="#b6bcc6" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* output */}
      <rect x="456" y="86" width="176" height="48" rx="10" fill="#fdeeea" stroke="#f6cec3" />
      <text x="544" y="115" textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="15" fill="#a63a25">
        crown
      </text>
    </svg>
  );
}
