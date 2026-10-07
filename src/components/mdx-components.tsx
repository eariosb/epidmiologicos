import type { ComponentType, ReactNode } from 'react';

/** Mapa de componentes disponibles en MDX (equivalente liviano a mdx/types). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MDXComponents = Record<string, ComponentType<any>>;
import { Callout } from '@/components/Callout';
import { CodeBlock } from '@/components/CodeBlock';
import { Quiz } from '@/components/Quiz';
import { Flashcard, Flashcards } from '@/components/Flashcard';
import { DataTable } from '@/components/DataTable';
import { ProcessSteps } from '@/components/ProcessSteps';
import { RCell } from '@/components/RCell';
import { LabExercise } from '@/components/LabExercise';
import { MatrixBuilder } from '@/components/MatrixBuilder';
import { FormulaPalette } from '@/components/FormulaPalette';
import { BlackboardAnchor, BlackboardEmbed } from '@cursos/blackboard';

/**
 * Mapeo de componentes disponibles dentro de los MDX de los módulos +
 * estilos de tablas Markdown (mismo patrón que el curso MLM).
 */

function MdxTable({ children }: { children?: ReactNode }) {
  return (
    <div className="my-6 w-full overflow-x-auto rounded border border-ink-200">
      <table className="min-w-full divide-y divide-ink-200 text-sm">{children}</table>
    </div>
  );
}

function MdxThead({ children }: { children?: ReactNode }) {
  return <thead className="bg-accent-50">{children}</thead>;
}

function MdxTh({ children }: { children?: ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-accent-800">
      {children}
    </th>
  );
}

function MdxTd({ children }: { children?: ReactNode }) {
  return <td className="border-t border-ink-100 px-4 py-2.5 align-top text-ink-700">{children}</td>;
}

function MdxPre({ children }: { children?: ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-lg bg-[#1e1e2e] px-4 py-3 text-sm leading-relaxed text-gray-100 [&_code]:rounded-none [&_code]:bg-transparent [&_code]:px-0 [&_code]:py-0 [&_code]:text-inherit">
      {children}
    </pre>
  );
}

function MdxInlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded bg-[#1e1e2e] px-1.5 py-0.5 text-[0.85em] font-mono text-gray-100">
      {children}
    </code>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  CodeBlock,
  Quiz,
  Flashcard,
  Flashcards,
  DataTable,
  ProcessSteps,
  RCell,
  LabExercise,
  MatrixBuilder,
  FormulaPalette,
  BlackboardAnchor,
  BlackboardEmbed,
  table: MdxTable,
  thead: MdxThead,
  th: MdxTh,
  td: MdxTd,
  pre: MdxPre,
  code: MdxInlineCode,
};
