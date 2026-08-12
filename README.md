# Tiny LLM Lab - *learn · run · repeat*

A visual, story-driven course on **how large language models actually work** -
where you don't just read, you **watch each idea animate** and **run the real
code right in the page**. By the end you'll have seen (and tinkered with) a tiny
language model built from scratch, one honest piece at a time.

> One repo = the lesson **and** the lab. Every visualization on the page is
> powered by the same plain TypeScript you can read and edit.

This project is inspired by CJ (w3cj)'s wonderful talk and repo
[*How LLMs Work*](https://github.com/w3cj/how-llms-work) - go watch it. Our
version is an independent reimplementation: it runs **entirely in the browser**
(no server), uses its own original "Little Kingdom" dataset, and is wrapped in a
narrative reading experience.

---

## The story (the order never changes - each chapter sets up the next)

1. **Prologue - Can a machine really talk?** Shannon, Turing, and the one idea
   behind everything: predict the next piece of text.
2. **The Illusion - rule-based chatbots.** ELIZA fooled the world in 1966 with
   nothing but `if`-statements. Chat with one; watch each rule fire.
3. **Neural networks.** Stop writing rules - show examples instead, and watch a
   network teach itself XOR.
4. **Tokenization.** Chop text into subword tokens with Byte Pair Encoding.
5. **Embeddings.** Turn words into vectors where `king − man + woman ≈ queen`.
6. **Transformers.** Self-attention: let every word glance at every other.
7. **Sampling & the loop.** Softmax, temperature, top-p, and the autoregressive
   loop that turns one guess into paragraphs.
8. **Is it actually learning?** Loss, held-out validation, overfitting and
   perplexity - telling real learning from memorizing (watch a model overfit live).
9. **Why bigger works.** Scaling laws: the dumb, powerful idea of making it
   bigger - and watching loss fall on a predictable curve.
10. **From base model to assistant.** Fine-tuning, RLHF, and tool calling.
11. **Epilogue.** The full picture assembled - plus a live, end-to-end run of the
    whole pipeline - and where it all goes next.

> **Status:** all eleven chapters are live. Every training demo (XOR net,
> Word2Vec, the tiny transformer) trains **live in your browser** so you can
> watch it learn.

---

## Run it locally

Requires **Node 20+** and **pnpm**.

```sh
git clone https://github.com/nihalashetty/tiny-llm.git
cd tiny-llm
pnpm install
pnpm dev        # start the dev server (http://localhost:5173)
```

Other scripts:

```sh
pnpm build      # production build to dist/
pnpm preview    # serve the production build locally
pnpm typecheck  # type-check with tsc
```

---

## How it's built

- **Vite + React + TypeScript**, static - deploys anywhere (GitHub Pages config
  included in `.github/workflows/deploy.yml`).
- **`src/llm/`** - the *lab*: pure, framework-free, heavily-commented TypeScript
  implementing each algorithm - ELIZA, the XOR net (with hand-written backprop),
  the BPE tokenizer, Word2Vec, a from-scratch single-head transformer, and the
  samplers. No React, no DOM. These are the exact files shown in the in-page code
  viewer, so **what you read is what runs**.
- **`src/ui/`** - the *lesson*: React chapters, the design system, scroll-driven
  "story beats", and the visualizations (`src/ui/viz/`).
- **`src/content/`** - the curriculum spine and the citation registry.
- Training runs **live in the browser**, a few steps per animation frame (see
  `src/ui/useRafTrainer.ts`), so the UI stays smooth while you watch the loss
  fall - no backend, no build-time precompute.

### Design

The look is a warm "paper" theme (coral accent, Bricolage Grotesque / Figtree /
JetBrains Mono), ported from a Claude Design starter and kept consistent across
every chapter.

---

## Credits & sources

- Inspired by **CJ (w3cj)** - [How LLMs Work](https://github.com/w3cj/how-llms-work).
- Every historical claim links to its original paper or a reputable summary; see
  the citation cards throughout the course (and `src/content/citations.ts`).

## License

MIT - see below. The "Little Kingdom" corpus and all lesson text are original to
this project.
