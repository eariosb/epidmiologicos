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
import {
  TwoByTwoExplorer,
  ConfusionExplorer,
  PvalueVsEffect,
  KaplanMeierSim,
  McNemarCmhDemo,
  DiagnosticTestExplorer,
  DesignTree,
  PrevalenceExplorer,
  StandardizationExplorer,
  InteractionExplorer,
  CohortGantt,
  BerksonExplorer,
  RocExplorer,
  MetaExplorer,
  EpiCurveExplorer,
} from '@/components/EpiSims';
import {
  ExactTestExplorer,
  ExactPowerExplorer,
  CorrectionExplorer,
  SampleSizeExplorer,
  CIMethodsExplorer,
  PrecisionSampleSizeExplorer,
} from '@/components/ExactSims';
import { LangTabs } from '@/components/LangTabs';
import { SasBlock } from '@/components/SasBlock';
import { DecisionPanel } from '@/components/DecisionPanel';
import { DecisionCard } from '@/components/DecisionCard';
import { SimReset } from '@/components/SimReset';
import { ToolCard } from '@/components/ToolCard';
import { FormulaPalette } from '@/components/FormulaPalette';
import { Term } from '@/components/Term';
import { BradfordHill, EpiTable } from '@/components/CourseBlocks';
import { ConductStudy, ConductStep } from '@/components/ConductStudy';
import { Table1Builder, DataQualityPanel } from '@/components/QualitySims';
import { MissingDataLab, EValueCalculator, BiasAnalysis2x2 } from '@/components/WorldSims';
import { Claim } from '@/components/Claim';
import { Anexo } from '@/components/Anexo';
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
  return <thead className="bg-brand-50">{children}</thead>;
}

function MdxTh({ children }: { children?: ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-800">
      {children}
    </th>
  );
}

function MdxTd({ children }: { children?: ReactNode }) {
  return <td className="border-t border-ink-100 px-4 py-2.5 align-top text-ink-700">{children}</td>;
}

function MdxPre({ children }: { children?: ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-lg bg-code px-4 py-3 text-sm leading-relaxed text-gray-100 [&_code]:rounded-none [&_code]:bg-transparent [&_code]:px-0 [&_code]:py-0 [&_code]:text-inherit">
      {children}
    </pre>
  );
}

function MdxInlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded bg-code px-1.5 py-0.5 text-[0.85em] font-mono text-gray-100">
      {children}
    </code>
  );
}

/** Envuelve un interactivo con el botón "Reiniciar" (remonta el estado). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withReset = (C: ComponentType<any>) =>
  function Resettable(props: Record<string, unknown>) {
    return (
      <SimReset>
        <C {...props} />
      </SimReset>
    );
  };

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
  TwoByTwoExplorer: withReset(TwoByTwoExplorer),
  ConfusionExplorer: withReset(ConfusionExplorer),
  PvalueVsEffect: withReset(PvalueVsEffect),
  KaplanMeierSim: withReset(KaplanMeierSim),
  McNemarCmhDemo: withReset(McNemarCmhDemo),
  DiagnosticTestExplorer: withReset(DiagnosticTestExplorer),
  DesignTree: withReset(DesignTree),
  PrevalenceExplorer: withReset(PrevalenceExplorer),
  StandardizationExplorer: withReset(StandardizationExplorer),
  InteractionExplorer: withReset(InteractionExplorer),
  CohortGantt: withReset(CohortGantt),
  BerksonExplorer: withReset(BerksonExplorer),
  RocExplorer: withReset(RocExplorer),
  MetaExplorer: withReset(MetaExplorer),
  EpiCurveExplorer: withReset(EpiCurveExplorer),
  ExactTestExplorer: withReset(ExactTestExplorer),
  ExactPowerExplorer: withReset(ExactPowerExplorer),
  CorrectionExplorer: withReset(CorrectionExplorer),
  SampleSizeExplorer: withReset(SampleSizeExplorer),
  CIMethodsExplorer: withReset(CIMethodsExplorer),
  PrecisionSampleSizeExplorer: withReset(PrecisionSampleSizeExplorer),
  LangTabs,
  ToolCard,
  SasBlock,
  DecisionPanel: withReset(DecisionPanel),
  DecisionCard,
  FormulaPalette,
  Term,
  EpiTable,
  BradfordHill,
  ConductStudy,
  ConductStep,
  Table1Builder: withReset(Table1Builder),
  DataQualityPanel: withReset(DataQualityPanel),
  MissingDataLab: withReset(MissingDataLab),
  EValueCalculator: withReset(EValueCalculator),
  BiasAnalysis2x2: withReset(BiasAnalysis2x2),
  Claim,
  Anexo,
  BlackboardAnchor,
  BlackboardEmbed,
  table: MdxTable,
  thead: MdxThead,
  th: MdxTh,
  td: MdxTd,
  pre: MdxPre,
  code: MdxInlineCode,
};
