import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * A tiny, editable code playground. The reader can tweak the snippet and hit
 * Run; we execute it in the browser via `new Function` and capture console.*
 * output. This mirrors the starter design's runner and the video's mostly
 * predefined input/output style.
 *
 * Scope note: this runs the reader's own JavaScript in their own browser tab.
 * There are no imports or special globals exposed - it's for small, safe
 * experiments (loops, string ops, math), not arbitrary programs.
 */

type Tone = 'log' | 'warn' | 'error' | 'muted';
interface Line {
  text: string;
  tone: Tone;
}

const toneColor: Record<Tone, string> = {
  log: '#efe7dc',
  warn: '#e6b980',
  error: '#f0a38a',
  muted: '#767d88',
};

function fmt(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
  } catch {
    return String(v);
  }
}

export function SnippetRunner({
  initialCode,
  filename = 'try-it.js',
}: {
  initialCode: string;
  filename?: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<Line[] | null>(null);

  function run() {
    const lines: Line[] = [];
    const push = (tone: Tone) => (...args: unknown[]) =>
      lines.push({ text: args.map(fmt).join(' '), tone });
    const con = {
      log: push('log'),
      info: push('log'),
      warn: push('warn'),
      error: push('error'),
    };
    try {
      // eslint-disable-next-line no-new-func
      new Function('console', code)(con);
      if (lines.length === 0) lines.push({ text: '✓ ran with no output', tone: 'muted' });
    } catch (err) {
      lines.push({ text: '⚠ ' + (err as Error).message, tone: 'error' });
    }
    setOutput(lines);
  }

  function reset() {
    setCode(initialCode);
    setOutput(null);
  }

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-800/50 px-3 py-2">
        <span className="size-[11px] rounded-full" style={{ background: '#F0663E' }} />
        <span className="ml-1 font-mono text-xs text-zinc-300">{filename}</span>
        <span className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
            onClick={reset}
          >
            Reset
          </Button>
          <Button size="sm" className="h-7" onClick={run}>
            Run ▶
          </Button>
        </span>
      </div>
      <textarea
        className="block min-h-[150px] w-full resize-y bg-zinc-900 p-4 font-mono text-[0.8rem] leading-relaxed text-zinc-100 outline-none"
        value={code}
        spellCheck={false}
        onChange={(e) => setCode(e.target.value)}
        rows={Math.min(16, code.split('\n').length + 1)}
        aria-label="Editable code"
      />
      <div className="max-h-[260px] overflow-auto border-t border-zinc-800 bg-[#111317] p-4 font-mono text-[0.78rem] leading-relaxed">
        {output === null ? (
          <span className="text-zinc-500">Press Run ▶ to see the output.</span>
        ) : (
          output.map((l, i) => (
            <div className="break-words whitespace-pre-wrap" key={i} style={{ color: toneColor[l.tone] }}>
              {l.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
