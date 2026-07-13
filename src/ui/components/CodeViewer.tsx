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
    <div className="code">
      <div className="code-head">
        <span className="code-dot" style={{ background: '#F0663E' }} />
        <span className="code-dot" style={{ background: '#E6B980' }} />
        <span className="code-dot" style={{ background: '#1F9E7A' }} />
        <span className="code-file">{filename}</span>
        <span className="code-tag">{tag}</span>
      </div>
      <pre className={`language-${lang}`}>
        <code
          className={`language-${lang}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
