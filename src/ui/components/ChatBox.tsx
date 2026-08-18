import { useEffect, useRef, useState } from 'react';
import { respond, rules, fallbackRule, type ElizaRule } from '../../llm/eliza';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
 * the rule that fired lights up in the panel on the right - so the reader sees
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_250px]">
        <Card className="flex h-[360px] flex-col gap-0 overflow-hidden py-0">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5" ref={logRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col gap-1',
                  m.role === 'user' ? 'items-end' : 'items-start',
                )}
              >
                {m.role === 'bot' && m.ruleLabel && (
                  <div className="font-mono text-[0.66rem] text-muted-foreground">
                    ▶ fired rule: {m.ruleLabel}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-normal',
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground',
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something to the Oracle…"
              aria-label="Message to the chatbot"
            />
            <Button type="submit">Send</Button>
          </form>
        </Card>

        <Card className="max-h-[360px] gap-0 overflow-y-auto p-3" aria-label="The rulebook">
          <div className="mb-2.5 font-semibold">The entire "brain" 🧠</div>
          {allRules.map((r) => (
            <div
              key={r.id}
              className={cn(
                'mb-1.5 rounded-md border p-2 transition-colors',
                firedId === r.id ? 'border-primary bg-muted' : 'border-border',
              )}
            >
              <span className="font-mono text-[0.7rem] font-bold text-foreground">{r.id}</span>
              <div className="text-[0.78rem] text-foreground/90">{r.label}</div>
              <div className="mt-0.5 font-mono text-[0.62rem] break-all text-muted-foreground">
                {String(r.pattern)}
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Button key={s} variant="outline" size="sm" className="rounded-full" onClick={() => send(s)}>
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}
