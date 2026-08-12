/**
 * A rule-based chatbot, in the spirit of ELIZA (Weizenbaum, 1966).
 *
 * There is no learning here and absolutely no "understanding" - just a list of
 * text patterns and canned replies. When your sentence matches a pattern, the
 * bot echoes part of it back, swapping "I" for "you", "my" for "your", and so
 * on. That single trick (pattern-match + reflection) was enough to make people
 * in the 1960s feel genuinely heard.
 *
 * Our version plays the "Oracle of the Little Kingdom", but the machinery is
 * exactly ELIZA's. `respond()` returns which rule fired so the UI can light it
 * up and reveal the illusion.
 */

export interface ElizaRule {
  id: string;
  /** human-friendly description shown in the rules panel */
  label: string;
  /** the pattern we test the (lower-cased) input against */
  pattern: RegExp;
  /** possible replies; `$1` is replaced by the reflected capture group */
  responses: string[];
}

export interface ElizaResult {
  reply: string;
  /** the rule that fired (a synthetic "fallback" rule if nothing matched) */
  rule: ElizaRule;
  /** the slice of input that matched, useful for highlighting */
  matchedText: string;
}

/** Pronoun swaps that make a reply feel personal: "I need you" → "…you need me". */
const REFLECTIONS: Record<string, string> = {
  i: 'you',
  me: 'you',
  my: 'your',
  mine: 'yours',
  am: 'are',
  "i'm": 'you are',
  myself: 'yourself',
  you: 'I',
  your: 'my',
  yours: 'mine',
  yourself: 'myself',
  are: 'am',
};

/** Swap pronouns word-by-word (a single pass, so nothing flips twice). */
function reflect(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/[^a-z']/gi, '').toLowerCase();
      const swapped = REFLECTIONS[bare];
      return swapped ?? word;
    })
    .join(' ')
    .trim();
}

/** Tidy a captured phrase before we echo it (drop trailing punctuation). */
function clean(text: string): string {
  return text.replace(/[.!?,;:]+$/g, '').trim();
}

/** The rulebook, checked top to bottom - the first match wins. */
export const rules: ElizaRule[] = [
  {
    id: 'need',
    label: '“I need / want …”',
    pattern: /\bi (?:need|want) (.*)/,
    responses: [
      'Why do you need $1?',
      'Would truly having $1 change everything?',
      'What would it mean to you to have $1?',
    ],
  },
  {
    id: 'feel',
    label: '“I feel …”',
    pattern: /\bi (?:feel|felt) (.*)/,
    responses: [
      'Tell me more about feeling $1.',
      'Does feeling $1 come to you often?',
      'And when you feel $1, what do you do?',
    ],
  },
  {
    id: 'am',
    label: '“I am …”',
    // "i am …" needs the space; "i'm …" must not, so the space lives inside the
    // first branch. (Written as /\bi (?:am|'m)/ the contraction never matched.)
    pattern: /\bi(?: am|'m) (.*)/,
    responses: [
      'How long have you been $1?',
      'And how do you feel about being $1?',
      'Do you believe it is normal to be $1?',
    ],
  },
  {
    id: 'cant',
    label: '“I can’t …”',
    pattern: /\bi (?:can'?t|cannot) (.*)/,
    responses: [
      'What makes you think you cannot $1?',
      'Have you truly tried to $1?',
      'Perhaps you could $1 if the time were right.',
    ],
  },
  {
    id: 'because',
    label: '“because …”',
    pattern: /\bbecause (.*)/,
    responses: [
      'Is that the real reason?',
      'Does any other reason come to mind?',
      'What else might explain it?',
    ],
  },
  {
    id: 'sorry',
    label: 'An apology',
    pattern: /\b(?:sorry|apolog)/,
    responses: [
      'No need to apologize in this hall.',
      'Apologies are not required here - go on.',
    ],
  },
  {
    id: 'why',
    label: '“why …”',
    pattern: /\bwhy (.*)/,
    responses: [
      'Why do you think $1?',
      'Does that question trouble you often?',
    ],
  },
  {
    id: 'kingdom',
    label: 'Kingdom & kin',
    pattern: /\b(king|queen|prince|princess|mother|father|family|crown|throne)\b/,
    responses: [
      'Tell me more about the $1.',
      'The $1 - why does that come to mind now?',
      'What does the $1 mean to you?',
    ],
  },
  {
    id: 'greeting',
    label: 'A greeting',
    pattern: /\b(hello|hi|hey|greetings|good day)\b/,
    responses: [
      'Well met, traveller. What weighs on your mind?',
      'Greetings. Speak freely - what troubles you?',
    ],
  },
  {
    id: 'yes',
    label: 'Agreement',
    pattern: /^(?:yes|yeah|yep|sure|of course)\b/,
    responses: ['You seem certain. Why is that?', 'And what follows from that?'],
  },
  {
    id: 'no',
    label: 'Refusal',
    pattern: /^(?:no|nope|not really)\b/,
    responses: ['Why not?', 'Are you sure? What holds you back?'],
  },
  {
    id: 'question',
    label: 'A question thrown back',
    pattern: /\?\s*$/,
    responses: [
      'What do you think?',
      'Why do you ask?',
      'Perhaps you already know the answer.',
    ],
  },
];

/** Used when nothing above matched - keep the conversation moving. */
export const fallbackRule: ElizaRule = {
  id: 'fallback',
  label: 'No pattern matched → fallback',
  pattern: /.*/,
  responses: [
    'Go on…',
    'I see. Please, tell me more.',
    'Why do you say that?',
    'Let us return to your thoughts - what troubles you most?',
  ],
};

function choose<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Fill `$1`, `$2`, … in a template with the reflected capture groups. */
function fill(template: string, groups: string[]): string {
  return template.replace(/\$(\d)/g, (_, d: string) => {
    const g = groups[Number(d) - 1] ?? '';
    return reflect(clean(g));
  });
}

/**
 * The whole bot in one function: find the first matching rule, pick one of its
 * replies, and fill in the (reflected) captured phrase.
 */
export function respond(rawInput: string, rng: () => number = Math.random): ElizaResult {
  const probe = rawInput.toLowerCase().trim();

  for (const rule of rules) {
    const m = probe.match(rule.pattern);
    if (m) {
      const groups = m.slice(1).map((g) => g ?? '');
      return {
        reply: fill(choose(rule.responses, rng), groups),
        rule,
        matchedText: m[0],
      };
    }
  }

  return {
    reply: choose(fallbackRule.responses, rng),
    rule: fallbackRule,
    matchedText: '',
  };
}
