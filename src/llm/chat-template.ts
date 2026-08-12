/**
 * The "chat template", the hidden wrapper every message goes through before a
 * chat model ever sees it.
 *
 * You type one line. But a base language model only knows how to *continue text*.
 * It has no idea whose turn it is or that it's supposed to answer. So at
 * inference time we wrap your message in a little script: a system instruction,
 * then alternating user/assistant turns, each fenced by special tokens the model
 * was fine-tuned to recognise. The model's whole job is then simply to continue
 * the text right after the final `<|assistant|>` marker.
 *
 * Real models (GPT, Claude, Llama, …) each use their own exact tokens and
 * layout, but the *idea* is identical, and this is a faithful miniature of it.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Special tokens that mark the structure. Real tokenizers give each of these a
 *  single reserved id, so the model can never confuse them with ordinary text. */
export const SPECIAL = {
  system: '<|system|>',
  user: '<|user|>',
  assistant: '<|assistant|>',
  end: '<|end|>',
};

/**
 * Assemble the full prompt string the model actually reads. The trailing
 * `<|assistant|>` (with no closing `<|end|>`) is the crucial part: it's an
 * unfinished turn, and completing it is exactly what "generating a reply" means.
 */
export function applyChatTemplate(system: string, messages: ChatMessage[]): string {
  let out = `${SPECIAL.system}\n${system}${SPECIAL.end}\n`;
  for (const m of messages) {
    const tag = m.role === 'user' ? SPECIAL.user : SPECIAL.assistant;
    out += `${tag}\n${m.content}${SPECIAL.end}\n`;
  }
  // Open an assistant turn and leave it hanging, the model writes what comes next.
  out += `${SPECIAL.assistant}\n`;
  return out;
}
