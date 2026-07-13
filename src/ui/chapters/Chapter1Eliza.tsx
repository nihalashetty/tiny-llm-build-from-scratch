import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { SnippetRunner } from '../components/SnippetRunner';
import { ChatBox } from '../components/ChatBox';
// The real source of our chatbot — this exact text is what runs the chat above.
import elizaSource from '../../llm/eliza.ts?raw';

const pocketEliza = `// A pocket-sized ELIZA you can edit. Try adding your own rule!
const swaps = { i: "you", my: "your", me: "you", am: "are", you: "I", your: "my" };
const reflect = (s) => s.split(" ").map((w) => swaps[w] || w).join(" ");

const rules = [
  { re: /i feel (.*)/i, reply: (g) => \`Tell me more about feeling \${reflect(g)}.\` },
  { re: /i need (.*)/i, reply: (g) => \`Why do you need \${reflect(g)}?\` },
  // 👇 Add a rule here, e.g. for  /i love (.*)/i
];

function respond(input) {
  for (const r of rules) {
    const m = input.match(r.re);
    if (m) return r.reply(m[1]);
  }
  return "Go on…"; // nothing matched
}

console.log(respond("i feel nervous about the king"));
console.log(respond("i need a map of the castle"));
console.log(respond("the weather is nice today")); // no rule → fallback`;

export function Chapter1Eliza() {
  return (
    <ChapterFrame id="chatbots">
      <Beat as="p" className="lead">
        In 1966, at MIT, a program called <strong>ELIZA</strong> pretended to be
        a therapist. People sat down, typed their worries, and — this is the
        part that unsettled everyone — they <em>opened up</em>. One story goes
        that its creator's own secretary asked him to leave the room so she
        could talk to it privately.
      </Beat>

      <Beat as="p">
        Here's the twist that makes this the perfect place to start:{' '}
        <strong>ELIZA understood absolutely nothing.</strong> No learning, no
        memory, no meaning. Just a list of text patterns and a clever trick.
        Let's meet it.
      </Beat>

      <Beat as="h2">Meet the Oracle (our ELIZA)</Beat>
      <Beat as="p">
        Say anything to the chatbot below. As it replies, watch the panel on the
        right: the exact rule that "fired" lights up. Try the suggestion chips,
        then try to say something that stumps it.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Every reply is one rule from the list on the right. Watch which one lights up.">
          <ChatBox />
        </Figure>
      </Beat>

      <Beat as="h2">The whole trick: match, then reflect</Beat>
      <Beat as="p">
        ELIZA does just two things. First it <strong>matches</strong> your
        sentence against patterns like <code>"I feel ___"</code>. Then it{' '}
        <strong>reflects</strong> the rest back at you, flipping pronouns so it
        sounds personal: <em>you</em> → <em>I</em>, <em>my</em> → <em>your</em>.
        Say “I feel nervous about my journey” and it can answer “Tell me more
        about feeling nervous about your journey” — without having any idea what
        nervousness, or a journey, is.
      </Beat>

      <Beat>
        <Callout emoji="🎭">
          <strong>Reflection</strong> is the whole illusion. Swapping a handful
          of pronouns turns your own words into something that feels like
          listening.
        </Callout>
      </Beat>

      <Beat as="h2">Look under the hood</Beat>
      <Beat as="p">
        This isn't a simplified retelling — the code below is the actual file
        powering the chat above. Notice there's no “intelligence” anywhere: it's
        a list of <code>{'{ pattern, responses }'}</code> objects, checked top to
        bottom, first match wins.
      </Beat>

      <Beat>
        <CodeViewer code={elizaSource} filename="src/llm/eliza.ts" lang="typescript" />
      </Beat>

      <Beat as="h2">Now you try — add a rule</Beat>
      <Beat as="p">
        Here's a pocket version you can edit. Add a rule for something like{' '}
        <code>/i love (.*)/i</code> and press <strong>Run</strong>. You're now
        writing a chatbot the exact way people did for 30 years.
      </Beat>

      <Beat>
        <SnippetRunner initialCode={pocketEliza} filename="pocket-eliza.js" />
      </Beat>

      <Beat as="h2">It caught on — and it kept faking</Beat>
      <Beat as="p">
        A few years later, psychiatrist Kenneth Colby built <strong>PARRY</strong>,
        a bot that imitated a person with paranoia. In 1972 the two were
        connected over the early internet and left to “talk” to each other — two
        piles of rules, bouncing canned lines back and forth. The same idea kept
        resurfacing for decades: <strong>A.L.I.C.E.</strong> in the 1990s, and{' '}
        <strong>SmarterChild</strong>, which a generation met on instant
        messenger in the 2000s.
      </Beat>

      <Beat>
        <CitationCard ids={['eliza-1966', 'parry-1971', 'alice-1995', 'smarterchild-2001']} />
      </Beat>

      <Beat as="h2">The honest problem (this is the whole reason for Chapter 2)</Beat>
      <Beat as="p">
        Play with the Oracle long enough and the magic collapses. Step outside
        its patterns and it goes blank. It can't learn from you. It has no idea
        that a king and a queen are related, or that “happy” and “glad” mean
        nearly the same thing. Every single thing it can do, a human had to type
        out by hand, in advance.
      </Beat>

      <Beat>
        <Callout emoji="🧱" tone="neutral">
          <strong>The wall:</strong> rules don't scale. Real language has endless
          variety, and you can't write an <code>if</code>-statement for every
          sentence a person might say. To go further, we need a machine that
          learns the patterns <em>itself</em>, from examples — instead of us
          spelling them all out.
        </Callout>
      </Beat>

      <Beat as="p">
        That's exactly the leap the world spent decades trying to make. Next, we
        stop writing rules and start <strong>teaching a machine to learn</strong>{' '}
        — and we'll watch one figure something out that stumped researchers for
        seventeen years.
      </Beat>
    </ChapterFrame>
  );
}
