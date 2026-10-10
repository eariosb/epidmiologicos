import katex from 'katex';
import type { ReactNode } from 'react';

/**
 * Renders a plain string that may contain LaTeX in `$…$` / `$$…$$`
 * delimiters. Text segments render as-is; math segments go through
 * KaTeX with `throwOnError: false` so a malformed formula degrades to
 * its literal source instead of breaking the page.
 *
 * Used by components that receive strings as props (Quiz options,
 * Flashcard backs, LabExercise tasks…) — MDX children don't need this
 * because rehype-katex already processes them.
 */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return (
            <span
              key={i}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.slice(2, -2), {
                  throwOnError: false,
                  displayMode: true,
                }),
              }}
            />
          );
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return (
            <span
              key={i}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.slice(1, -1), {
                  throwOnError: false,
                }),
              }}
            />
          );
        }
        return <span key={i}>{part as ReactNode}</span>;
      })}
    </>
  );
}
