import { useState } from 'react';

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
    <div className="runner">
      <div className="runner-head">
        <span className="code-dot" style={{ background: '#F0663E' }} />
        <span className="runner-file">{filename}</span>
        <span className="runner-actions">
          <button className="btn btn-ghost" onClick={reset}>
            Reset
          </button>
          <button className="btn btn-run" onClick={run}>
            Run ▶
          </button>
        </span>
      </div>
      <textarea
        className="runner-editor"
        value={code}
        spellCheck={false}
        onChange={(e) => setCode(e.target.value)}
        rows={Math.min(16, code.split('\n').length + 1)}
        aria-label="Editable code"
      />
      <div className="runner-output">
        {output === null ? (
          <span className="out-empty">Press Run ▶ to see the output.</span>
        ) : (
          output.map((l, i) => (
            <div className="out-line" key={i} style={{ color: toneColor[l.tone] }}>
              {l.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
