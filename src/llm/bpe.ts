/**
 * Byte Pair Encoding (BPE) - the tokenizer trick behind GPT-2, GPT-4, LLaMA and
 * friends. Philip Gage invented it in 1994 to *compress* files; Sennrich et al.
 * reused it in 2015 to break words into reusable subword pieces for translation.
 *
 * The whole idea in one breath: start with a vocabulary of individual
 * CHARACTERS, then repeatedly find the two tokens that sit next to each other
 * most often and glue them into ONE new token. Do that a few dozen times and
 * common chunks ("th", "ee") - then whole words ("queen") - become single
 * tokens, while rare words stay split into pieces. No neural network, no magic:
 * just counting pairs and gluing the winner. Read this file top to bottom and
 * you'll have implemented a real tokenizer.
 *
 * Worked example, the word "queen":
 *   start:      q u e e n          (5 character tokens)
 *   e+e is the most common pair →  q u ee n
 *   ...later, more merges →        qu ee n  →  queen   (1 token)
 */

/** One learned rule: "whenever you see token `a` then token `b`, glue them." */
export interface Merge {
  pair: [string, string]; // the two tokens to glue, e.g. ["e", "e"]
  merged: string; //         what they become,     e.g. "ee"
  count: number; //          how often that pair was seen when we chose it
}

/** A snapshot after one merge - everything the animation needs to draw a frame. */
export interface BpeStep extends Merge {
  vocabSize: number; //  how many distinct tokens exist now
  vocab: string[]; //    the actual tokens, so you can watch the vocabulary grow
  /** how a few showcase words look after this merge, e.g. queen → ["qu","ee","n"] */
  sample: Record<string, string[]>;
}

export interface BpeResult {
  merges: Merge[]; //     the rules, in the order we learned them
  steps: BpeStep[]; //    one snapshot per merge (for stepping through)
  baseVocab: string[]; // the starting tokens: every distinct character in the text
  finalVocab: string[]; //the tokens we end up with after all the merges
}

// We store a token pair as the string "a b" so it can be a Map key. A space is
// safe as the separator because our tokens are only ever letters.
const PAIR_SEP = ' ';

/**
 * Count how often each WORD appears (letters only, lower-cased). BPE works one
 * word at a time, and a word that shows up 50× should pull 50× as hard on which
 * pair wins - so we keep these counts and weight everything by them.
 * "The king. The queen." → { the: 2, king: 1, queen: 1 }
 */
export function countWords(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

/**
 * Look at every word's current token list and tally each ADJACENT pair, adding
 * the word's frequency each time. If "queen" (seen 4×) is split as
 * [q, u, ee, n], it contributes 4 to "q u", 4 to "u ee", and 4 to "ee n".
 * The pair with the biggest tally is the one we'll glue next.
 */
function countPairs(splits: Map<string, string[]>, freq: Map<string, number>) {
  const counts = new Map<string, number>();
  for (const [word, toks] of splits) {
    const f = freq.get(word) ?? 1;
    for (let i = 0; i < toks.length - 1; i++) {
      const key = toks[i] + PAIR_SEP + toks[i + 1];
      counts.set(key, (counts.get(key) ?? 0) + f);
    }
  }
  return counts;
}

/**
 * Walk one word's token list and glue every adjacent [a, b] into `merged`.
 * mergeTokens(["q","u","e","e","n"], "e", "e", "ee") → ["q","u","ee","n"].
 * (When we find a pair we push the merged token and skip an extra step, so the
 * "b" we just consumed isn't reused.)
 */
function mergeTokens(toks: string[], a: string, b: string, merged: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    if (i < toks.length - 1 && toks[i] === a && toks[i + 1] === b) {
      out.push(merged);
      i++; // skip b - it's now part of `merged`
    } else {
      out.push(toks[i]);
    }
  }
  return out;
}

/** The vocabulary = every distinct token currently in use across all words. */
function distinctTokens(splits: Map<string, string[]>): Set<string> {
  const v = new Set<string>();
  for (const toks of splits.values()) for (const t of toks) v.add(t);
  return v;
}

/**
 * TRAIN the tokenizer: learn a list of merge rules from a corpus.
 *
 * @param maxMerges   stop after at most this many merges (our vocabulary budget)
 * @param minCount    stop early if even the best pair is rarer than this
 * @param sampleWords words to photograph after each merge, for the animation
 */
export function trainBpe(
  text: string,
  maxMerges = 80,
  minCount = 2,
  sampleWords: string[] = ['queen', 'throne', 'morning', 'children'],
): BpeResult {
  const freq = countWords(text);

  // Every word starts life as a list of single characters:
  // "queen" → ["q","u","e","e","n"]. This map is the state we keep reshaping.
  const splits = new Map<string, string[]>();
  for (const word of freq.keys()) splits.set(word, word.split(''));

  // The starting vocabulary is just the distinct characters in the whole text.
  const baseVocab = [...distinctTokens(splits)].sort();
  const merges: Merge[] = [];
  const steps: BpeStep[] = [];

  for (let m = 0; m < maxMerges; m++) {
    // 1. Count every adjacent pair, then pick the single most frequent one.
    const pairs = countPairs(splits, freq);
    let bestKey = '';
    let bestCount = 0;
    for (const [key, count] of pairs) {
      if (count > bestCount) {
        bestCount = count;
        bestKey = key;
      }
    }
    // Nothing left worth merging? Then we're done early.
    if (!bestKey || bestCount < minCount) break;

    // 2. Glue that winning pair everywhere it appears: "e"+"e" becomes "ee".
    const [a, b] = bestKey.split(PAIR_SEP);
    const merged = a + b;
    for (const [word, toks] of splits) {
      splits.set(word, mergeTokens(toks, a, b, merged));
    }

    // 3. Record the rule and a snapshot, then loop and find the next-best pair.
    merges.push({ pair: [a, b], merged, count: bestCount });
    const sample: Record<string, string[]> = {};
    for (const w of sampleWords) if (splits.has(w)) sample[w] = [...splits.get(w)!];
    const vocab = [...distinctTokens(splits)].sort();
    steps.push({ pair: [a, b], merged, count: bestCount, vocabSize: vocab.length, vocab, sample });
  }

  return { merges, steps, baseVocab, finalVocab: [...distinctTokens(splits)].sort() };
}

/**
 * INFERENCE, one word: apply the learned merges (in the same order we learned
 * them) to split a word into tokens. A word we trained on collapses back to
 * few tokens; a brand-new word stays in smaller pieces the model has seen.
 */
export function applyMerges(word: string, merges: Merge[]): string[] {
  let toks = word.toLowerCase().split('');
  for (const { pair, merged } of merges) {
    toks = mergeTokens(toks, pair[0], pair[1], merged);
  }
  return toks;
}

/** Tokenize arbitrary text: pull out the words, tokenize each, concatenate. */
export function tokenize(text: string, merges: Merge[]): string[] {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.flatMap((w) => applyMerges(w, merges));
}
