import { useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';

export type CodeLang = 'typescript' | 'javascript' | 'python';

/**
 * Read-only, syntax-highlighted code. Chapters feed it the REAL source of the
 * matching `src/llm/*.ts` file (imported with Vite's `?raw`), so the code the
 * reader studies is exactly the code that powers the visualization above it.
 *
 * Token colours come from the ported Prism `.token.*` rules in index.css.
 */
export function CodeViewer({
  code,
  lang = 'typescript',
  filename,
  tag = 'real source',
}: {
  code: string;
  lang?: CodeLang;
  filename: string;
  tag?: string;
}) {
  const html = useMemo(
    () => Prism.highlight(code.trimEnd(), Prism.languages[lang], lang),
    [code, lang],
  );

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-800/50 px-3.5 py-2.5">
        <span className="size-[11px] rounded-full" style={{ background: '#F0663E' }} />
        <span className="size-[11px] rounded-full" style={{ background: '#E6B980' }} />
        <span className="size-[11px] rounded-full" style={{ background: '#1F9E7A' }} />
        <span className="ml-1.5 font-mono text-xs text-zinc-300">{filename}</span>
        <span className="ml-auto font-mono text-[0.62rem] tracking-widest text-zinc-500 uppercase">
          {tag}
        </span>
      </div>
      <pre className={`language-${lang} m-0 max-h-[460px] overflow-auto p-4`}>
        <code
          className={`language-${lang} font-mono text-[0.8rem] leading-relaxed text-zinc-100`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
