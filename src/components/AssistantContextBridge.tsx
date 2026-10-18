'use client';

import { useEffect } from 'react';
import katex from 'katex';
import { useBlackboardContext, type BlackboardCanvasRef } from '@cursos/blackboard';
import { Bm25Index, retrieveContext, setRetriever, type RagDoc } from '@cursos/blackboard/rag';
import { setLatexValidator, setBoardOps } from '@cursos/blackboard/assistant';
import { getActiveSession, onSessionChanged } from '@/lib/session-store';
import { logEvent } from '@cursos/blackboard';
import { latexToDataUrl } from '@/lib/latex-image';
import { runRCode } from '@/lib/webr';

// The corpus is course-wide: fetch once per page load, then rebuild only
// the cheap retriever closure when the active module changes.
let cachedIndex: Bm25Index | null = null;

async function loadCorpusIndex(): Promise<Bm25Index | null> {
  if (cachedIndex) return cachedIndex;
  const r = await fetch('/api/rag-corpus');
  const data: { docs: RagDoc[] } = r.ok ? await r.json() : { docs: [] };
  if (data.docs.length === 0) return null;
  const index = new Bm25Index();
  index.add(data.docs);
  cachedIndex = index;
  void logEvent('corpus-loaded', `RAG corpus: ${data.docs.length} docs`);
  return index;
}

/**
 * Client-side wiring for the contextual assistant:
 * - loads the corpus once from /api/rag-corpus → BM25 index → setRetriever
 * - injects KaTeX as the LaTeX syntax validator
 * - injects BoardToolOps (latex render → canvas insert → WebR run)
 * - mirrors session.visitedSections into blackboard state for the prompt
 */
export function AssistantContextBridge({
  moduleSlug,
  canvasRef,
}: {
  moduleSlug?: string;
  canvasRef?: React.RefObject<BlackboardCanvasRef | null>;
}) {
  const { state, dispatch } = useBlackboardContext();
  const slug = moduleSlug ?? state.moduleContext?.slug ?? '';

  useEffect(() => {
    setLatexValidator((src) => {
      try {
        katex.renderToString(src, { throwOnError: true });
        return true;
      } catch {
        return false;
      }
    });

    setBoardOps({
      renderLatex: (latex) => latexToDataUrl(latex),
      insertImage: (dataUrl, meta) =>
        canvasRef?.current?.insertImage(dataUrl, { meta }),
      runR: async (code) => {
        const result = await runRCode(code);
        return { text: result.text, error: result.error, plots: result.plots };
      },
    });

    return () => {
      setLatexValidator(null);
      setBoardOps(null);
    };
  }, [canvasRef]);

  // Retriever: index is built once; only the module-aware closure is
  // swapped when navigating between modules.
  useEffect(() => {
    let cancelled = false;
    loadCorpusIndex()
      .then((index) => {
        if (cancelled || !index) return;
        setRetriever((query, k) => retrieveContext(query, slug, index, k));
      })
      .catch((err) => {
        console.error('[rag] corpus load failed', err);
        void logEvent('corpus-error', String(err));
      });
    return () => {
      cancelled = true;
      setRetriever(null);
    };
  }, [slug]);

  // Session mirror: subscribe to session-store notifications instead of
  // polling — visited sections update exactly when the session mutates.
  useEffect(() => {
    let active = true;
    const syncSections = async () => {
      const session = await getActiveSession();
      if (active && session) {
        dispatch({
          type: 'SET_VISITED_SECTIONS',
          sections: [...new Set(session.visitedSections.map((s) => s.slug))],
        });
      }
    };
    void syncSections();
    const unsubscribe = onSessionChanged(() => void syncSections());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [dispatch]);

  return null;
}
