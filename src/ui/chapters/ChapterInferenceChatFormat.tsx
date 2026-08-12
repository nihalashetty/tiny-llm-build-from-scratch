import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CodeViewer } from '../components/CodeViewer';
import { applyChatTemplate, SPECIAL, type ChatMessage } from '../../llm/chat-template';
import chatTemplateSource from '../../llm/chat-template.ts?raw';

/**
 * Reveal the hidden wrapper. The reader edits a system prompt + a couple of
 * turns, and sees the exact templated string the model is fed, special tokens
 * highlighted, ending in an open <|assistant|> turn for the model to finish.
 */
function ChatWrapperLab() {
  const [system, setSystem] = useState('You are a helpful, friendly assistant.');
  const [user, setUser] = useState('Explain gravity like I’m five.');

  const messages: ChatMessage[] = useMemo(
    () => [{ role: 'user', content: user }],
    [user],
  );
  const prompt = useMemo(() => applyChatTemplate(system, messages), [system, messages]);

  // Split the assembled string so we can colour the special tokens.
  const specials = Object.values(SPECIAL);
  const parts = useMemo(() => {
    const re = new RegExp(`(${specials.map((s) => s.replace(/[|]/g, '\\|')).join('|')})`, 'g');
    return prompt.split(re).filter((s) => s !== '');
  }, [prompt, specials]);

  return (
    <div className="lab">
      <div className="field">
        <label>System prompt</label>
        <input
          className="tokenize-input"
          style={{ marginBottom: 0, maxWidth: 360 }}
          value={system}
          onChange={(e) => setSystem(e.target.value)}
        />
      </div>
      <div className="field" style={{ marginTop: 8 }}>
        <label>Your message</label>
        <input
          className="tokenize-input"
          style={{ marginBottom: 0, maxWidth: 360 }}
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
      </div>

      <div className="wrapper-out">
        <div className="wrapper-out-label">what the model is really fed:</div>
        <pre className="wrapper-pre">
          {parts.map((p, i) =>
            specials.includes(p) ? (
              <span key={i} className="special-tok">
                {p}
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
          <span className="cursor-blink">▊</span>
        </pre>
      </div>
      <div className="lab-hint">
        Notice the last line: an <b>open</b> <code>{SPECIAL.assistant}</code> with nothing
        after it. The model’s entire task is to <em>continue the text from right there</em>.
        “Generating a reply” is just finishing this unfinished script.
      </div>
    </div>
  );
}

export function ChapterInferenceChatFormat() {
  return (
    <ChapterFrame id="inference-chat-format">
      <Beat as="p" className="lead">
        Here’s something that surprises almost everyone: when you send{' '}
        <em>“Explain gravity like I’m five,”</em> the model does <strong>not</strong>{' '}
        receive that sentence. It receives a small stage-play, with named roles, hidden
        markers, and an empty spot where its own line is supposed to go.
      </Beat>

      <Beat as="h2">A base model only knows how to continue text</Beat>
      <Beat as="p">
        Remember what the model actually learned in Part 1: given some text, predict what
        comes next. That’s <em>all</em> it does. It has no built-in notion of “a question
        was asked” or “now it’s my turn to answer.” Hand a raw base model your question
        and it might just… write more questions, because that’s a plausible continuation.
      </Beat>

      <Beat as="p">
        So how does ChatGPT or Claude know to <em>answer</em>? Two things, working
        together: the fine-tuning from the assistant chapter taught it a <strong>format</strong>,
        and at inference we wrap every message in exactly that format. The model learned
        that after a special “assistant” marker, a helpful reply is what comes next, so
        continuing the text <em>is</em> answering.
      </Beat>

      <Beat>
        <Callout emoji="🎭">
          <strong>The chat format is a costume.</strong> Underneath, the model is still
          doing the one and only thing it can do, continuing text. We just dress your
          message up as a script whose most natural continuation happens to be a helpful
          answer.
        </Callout>
      </Beat>

      <Beat as="h2">Meet the wrapper</Beat>
      <Beat as="p">
        The wrapper is called a <strong>chat template</strong>. It stitches together a{' '}
        <strong>system</strong> instruction (the standing rules), the alternating{' '}
        <strong>user</strong> and <strong>assistant</strong> turns of the conversation,
        and a set of <strong>special tokens</strong> that fence off each turn. Those
        special tokens get their own reserved ids, so the model can never mistake them for
        ordinary words. Edit the fields and watch the real string assemble:
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · One line in, a whole script out. The coloured chunks are special tokens; the trailing open assistant turn is the model’s cue to start writing.">
          <ChatWrapperLab />
        </Figure>
      </Beat>

      <Beat as="h2">Why the system prompt is so powerful</Beat>
      <Beat as="p">
        Now you can see exactly what a “system prompt” is: it’s just the first block of
        text in the script, before you ever say a word. Because everything the model
        writes is a continuation of that whole string, those opening instructions colour
        every token that follows. Change the system line to{' '}
        <em>“You are a grumpy pirate”</em> and the most natural continuation of the script
        genuinely becomes pirate-speak. No magic, just context.
      </Beat>

      <Beat as="p">
        This is also why earlier turns keep mattering: the entire conversation, roles and
        all, is re-assembled into one long string and fed in fresh every single time the
        model writes its next reply. The model has no memory between calls, the{' '}
        <em>transcript is the memory.</em>
      </Beat>

      <Beat as="h2">The template, in code</Beat>
      <Beat as="p">
        Here’s the actual function powering the widget above. Real models (GPT, Claude,
        Llama) each use their own exact tokens and layout, but this is a faithful
        miniature, note the last line, which opens an assistant turn and leaves it
        deliberately unfinished.
      </Beat>

      <Beat>
        <CodeViewer code={chatTemplateSource} filename="src/llm/chat-template.ts" lang="typescript" />
      </Beat>

      <Beat>
        <Callout emoji="🧵" tone="neutral">
          <strong>This is the one place Part 2 differs from a raw base model.</strong>{' '}
          Everything downstream, tokenizing, embedding, the forward pass, sampling, is
          identical whether or not there’s a chat wrapper. The wrapper only decides{' '}
          <em>what text goes in</em>. From here on, we follow that assembled string
          through the network.
        </Callout>
      </Beat>

      <Beat as="p">
        The whole script, system prompt, your turn, the special tokens, the open
        assistant marker, now gets tokenized into one long list of ids. Next, those ids
        finally turn into something the network can compute with: vectors.
      </Beat>
    </ChapterFrame>
  );
}
