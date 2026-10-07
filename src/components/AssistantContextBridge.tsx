'use client';

import { useEffect } from 'react';
import katex from 'katex';
import { useBlackboardContext, type BlackboardCanvasRef } from '@cursos/blackboard';
import { Bm25Index, retrieveContext, setRetriever, type RagDoc } from '@cursos/blackboard/rag';
import { setLatexValidator, setBoardOps } from '@cursos/blackboard/assistant';
import { getActiveSession } from '@/lib/session-store';
import { logEvent } from '@cursos/blackboard';
import { latexToDataUrl } from '@/lib/latex-image';
import { runRCode } from '@/lib/webr';

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
  const { dispatch } = useBlackboardContext();

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

    let cancelled = false;
    fetch('/api/rag-corpus')
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data: { docs: RagDoc[] }) => {
        if (cancelled || data.docs.length === 0) return;
        const index = new Bm25Index();
        index.add(data.docs);
        setRetriever((query, k) => retrieveContext(query, moduleSlug ?? '', index, k));
        void logEvent('corpus-loaded', `RAG corpus: ${data.docs.length} docs`);
      })
      .catch((err) => {
        console.error('[rag] corpus load failed', err);
        void logEvent('corpus-error', String(err));
      });

    return () => {
      cancelled = true;
      setRetriever(null);
      setLatexValidator(null);
      setBoardOps(null);
    };
  }, [dispatch, moduleSlug, canvasRef]);

  useEffect(() => {
    let active = true;
    const syncSections = async () => {
      const session = await getActiveSession();
      if (active && session) {
        dispatch({
          type: 'SET_VISITED_SECTIONS',
          sections: session.visitedSections.map((s) => s.slug),
        });
      }
    };
    void syncSections();
    const interval = setInterval(syncSections, 15_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [dispatch]);

  return null;
}
