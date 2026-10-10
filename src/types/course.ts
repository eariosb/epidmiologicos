// Shared content types for the epidemiology course (MDX-based architecture).

/** Front-matter metadata stored at the top of each module's .mdx file. */
export interface ModuleMeta {
  /** Lesson/module title shown as the page heading. */
  title: string;
  /** URL slug, e.g. "01-por-que-modelar-mas-que-la-media". */
  slug: string;
  /** Short subtitle / tagline shown under the title. */
  subtitle?: string;
  /** Learning objective(s) for the module. */
  objective: string | string[];
  /** 1-based position of the module within the course. */
  order: number;
  /** Dataset(s) used in this module, shown in the lesson header. */
  datasets?: string[];
}

/** A module entry combining its front matter with the file location. */
export interface ModuleEntry {
  meta: ModuleMeta;
  /** File name (without directory), e.g. "01-por-que-modelar-mas-que-la-media.mdx". */
  fileName: string;
}

export type CalloutType = 'tip' | 'info' | 'warning' | 'success';

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export interface RCellProps {
  /** Unique id within the lesson, used for restore-original tracking. */
  id: string;
  /** Short label shown above the cell. */
  title?: string;
  /** Initial / default R code shown in the editor. */
  code: string;
  /** Render the editor expanded on load. Default false: theory first, code on demand. */
  defaultOpen?: boolean;
}

/**
 * Guided executable lab ("sandbox ligero") placed at the end of a module:
 * a statement, an editable WebR cell with small simulated data and cheap
 * epidemiological analyses, a "Tu turno" analysis checklist, and collapsible
 * hint / guide-answer sections. Real course models remain precomputed.
 */
export interface LabExerciseProps {
  /** Unique id within the lesson, convention `lab-NN-descripcion`. */
  id: string;
  /** Title shown in the lab header. */
  title: string;
  /** Initial R code in the executable cell (includes set.seed + simulation). */
  code: string;
  /** Analysis/interpretation tasks listed under "Tu turno". */
  tasks?: string[];
  /** Collapsible hint for the student. */
  hint?: string;
  /** Collapsible guide answers to the tasks. */
  solution?: string;
  /** Enunciado del ejercicio (MDX children). */
  children?: React.ReactNode;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  explanation?: string;
}

export interface QuizProps {
  questions: QuizQuestion[];
  title?: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface FlashcardProps {
  items: FlashcardItem[];
  title?: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  title?: string;
}

export interface DataTableVariable {
  name: string;
  type: string;
  description: string;
}

export interface DataTableProps {
  title: string;
  description: string;
  variables: DataTableVariable[];
  source: string;
  license?: string;
}
