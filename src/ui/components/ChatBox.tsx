import { useEffect, useRef, useState } from 'react';
import { respond, rules, fallbackRule, type ElizaRule } from '../../llm/eliza';

interface Msg {
  role: 'user' | 'bot';
  text: string;
  ruleLabel?: string;
}

const SUGGESTIONS = [
  'Hello there',
  'I feel lost',
  'I need to see the king',
  "I can't sleep at night",
  'Tell me about the queen',
];

/**
 * Live ELIZA chat for Chapter 1. Every reply comes from src/llm/eliza.ts, and
 * the rule that fired lights up in the panel on the right — so the reader sees
 * there is no "brain", just a rulebook being consulted top to bottom.
 */
export function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: 'Well met, traveller. What weighs on your mind?' },
  ]);
  const [input, setInput] = useState('');
  const [firedId, setFiredId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const res = respond(clean);
    setFiredId(res.rule.id);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: clean },
      { role: 'bot', text: res.reply, ruleLabel: res.rule.label },
    ]);
    setInput('');
  }

  const allRules: ElizaRule[] = [...rules, fallbackRule];

  return (
    <div>
      <div className="eliza">
        <div className="chat">
          <div className="chat-log" ref={logRef}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'contents' }}>
                {m.role === 'bot' && m.ruleLabel && (
                  <div className="bubble-tag">▶ fired rule: {m.ruleLabel}</div>
                )}
                <div className={`bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something to the Oracle…"
              aria-label="Message to the chatbot"
            />
            <button className="btn btn-run" type="submit">
              Send
            </button>
          </form>
        </div>

        <div className="rules-panel" aria-label="The rulebook">
          <div className="rules-title">The entire "brain" 🧠</div>
          {allRules.map((r) => (
            <div key={r.id} className={`rule-row${firedId === r.id ? ' fired' : ''}`}>
              <span className="rule-id">{r.id}</span>
              <div className="rule-label">{r.label}</div>
              <div className="rule-pattern">{String(r.pattern)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
