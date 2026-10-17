// Renderiza cada modulo con el pipeline real (remark-math + rehype-katex)
// y reporta cualquier salida de error de KaTeX o componente no definido.
// Uso: pnpm exec tsx scripts/check_render.mjs (importa TS desde src/lib)
import fs from 'node:fs';
import path from 'node:path';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { remarkModuleRefs } from '../src/lib/remark-module-refs.ts';
import { remarkAutoTerms } from '../src/lib/remark-auto-terms.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { GLOSSARY } from '../src/lib/glossary.ts';

const dir = 'src/content/modules';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort();

// Stubs para todos los componentes custom usados en los MDX.
const stub = () => null;
const components = {
  Callout: stub, CodeBlock: stub, Quiz: stub, Flashcard: stub, Flashcards: stub,
  DataTable: stub, ProcessSteps: stub, RCell: stub, LabExercise: stub,
  FormulaPalette: stub, BlackboardAnchor: stub, BlackboardEmbed: stub,
  TwoByTwoExplorer: stub, ConfusionExplorer: stub, PvalueVsEffect: stub,
  KaplanMeierSim: stub, McNemarCmhDemo: stub, DiagnosticTestExplorer: stub,
  DesignTree: stub,
  PrevalenceExplorer: stub, StandardizationExplorer: stub,
  InteractionExplorer: stub, InteractionNoiseLab: stub, TestSelector: stub, PValueLab: stub, CohortGantt: stub, BerksonExplorer: stub,
  RocExplorer: stub, MetaExplorer: stub, EpiCurveExplorer: stub,
  LangTabs: stub, SasBlock: stub, ToolCard: stub,
  DecisionPanel: stub, DecisionCard: stub,
  EpiTable: stub, BradfordHill: stub, Claim: stub, Anexo: stub,
  ConductStudy: stub, ConductStep: stub,
  Table1Builder: stub, DataQualityPanel: stub,
  MissingDataLab: stub, EValueCalculator: stub, BiasAnalysis2x2: stub,
  CityLab: stub,
  Profundiza: stub, SalaDeMaquinas: stub,
  ExactTestExplorer: stub, ExactPowerExplorer: stub, CorrectionExplorer: stub,
  CIMethodsExplorer: stub, PrecisionSampleSizeExplorer: stub,
  SampleSizeExplorer: stub,
  AuditCard: stub, MultinomCIExplorer: stub, Tau2Audit: stub,
  BootstrapStress: stub,
  // Term se renderiza de verdad: label + tooltip, para validar el texto.
  Term: ({ k, tip, children }) =>
    createElement('span', null, children ?? k, tip ? ` (${tip})` : null),
  // MRef: el plugin remark genera estos nodos; basta renderizar el texto.
  MRef: ({ children }) => createElement('a', { href: '#' }, children),
};

const opts = {
  blockJS: false,
  mdxOptions: { remarkPlugins: [remarkMath, remarkGfm, remarkModuleRefs, remarkAutoTerms], rehypePlugins: [rehypeKatex] },
};

let failures = 0;
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
  const source = raw.replace(/^---[\s\S]*?---\n/, '');
  try {
    const { content } = await compileMDX({ source, components, options: opts });
    const html = renderToStaticMarkup(content);
    const errors = [...html.matchAll(/katex-error" title="([^"]+)"/g)].map((m) =>
      m[1].replace(/&[#\w]+;/g, "'"),
    );
    const stray = (html.match(/\$[^<]*\$/g) ?? []).filter((s) => s.length > 6);
    if (errors.length || stray.length) {
      failures++;
      console.log('FAIL:', f);
      errors.forEach((e) => console.log('  katex:', e.slice(0, 140)));
      [...new Set(stray)].slice(0, 5).forEach((s) => console.log('  raw$: ', s.slice(0, 90)));
    } else {
      console.log('OK:', f);
    }
  } catch (e) {
    failures++;
    console.log('FAIL (compile):', f, '-', String(e.message).split('\n')[0]);
  }
}
// Auditoría inversa: componentes registrados que ningún módulo invoca.
// No falla el check (pueden ser legítimos — MRef lo genera el plugin) pero
// reporta huérfanos para que no se acumulen componentes muertos.
const allSource = files
  .map((f) => fs.readFileSync(path.join(dir, f), 'utf-8'))
  .join('\n');
const generatedOrHelper = new Set(['MRef']);
const unused = Object.keys(components).filter(
  (name) =>
    !generatedOrHelper.has(name) &&
    !new RegExp(`<${name}[\\s/>]`).test(allSource),
);
if (unused.length) {
  console.log('\nRegistrados pero nunca usados en MDX:', unused.join(', '));
}

// Toda clave <Term k="..."> usada en los modulos debe existir en el
// glosario; una clave rota renderiza sin tooltip en silencio.
const badTerms = [...allSource.matchAll(/<Term k="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((k) => !(k in GLOSSARY));
if (badTerms.length) {
  failures++;
  console.log(
    '\nClaves <Term> sin entrada en el glosario:',
    [...new Set(badTerms)].join(', '),
  );
}

console.log(failures ? `\n${failures} modulo(s) con problemas` : '\nTodos los modulos renderizan limpio');
process.exit(failures ? 1 : 0);
