'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  useBlackboardContext,
  useBlackboardScene,
  type BlackboardCanvasRef,
} from '@cursos/blackboard';

const btn =
  'flex h-8 w-8 items-center justify-center rounded text-sm font-semibold text-ink-700 transition-colors hover:bg-brand-100 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-ink-200 dark:hover:bg-brand-900/40 dark:hover:text-brand-300';

/**
 * Compact page navigation for the icon rail:
 * ‹ prev / counter / next › + new page + delete current page.
 *
 * Every operation flushes the live canvas first so pending debounced strokes
 * land on the page being left, and serializes itself through `busyRef` so
 * rapid clicks cannot interleave save/load/switch.
 */
export function PageNav({
  canvasRef,
}: Readonly<{
  canvasRef: React.RefObject<BlackboardCanvasRef | null>;
}>) {
  const { state, dispatch } = useBlackboardContext();
  const { activeSceneId, createScene, saveScene, loadScene, deleteScene } =
    useBlackboardScene();
  const busyRef = useRef(false);

  // moduleScenes is empty when no module bridge has mounted (home, lecciones,
  // etc.); fall back to every scene so pages created there are still listed.
  const slug = state.moduleContext?.slug;
  const moduleSlug = slug ?? 'global';
  // Page order = creation order (ids end with Date.now() suffixes and the
  // default page has no suffix, so locale ordering yields default first,
  // then oldest→newest). Never sort by updatedAt — every debounced save
  // would reshuffle the list under the user's feet.
  const pages = Object.values(state.scenes)
    .filter((s) => (slug ? s.moduleSlug === slug : true))
    .sort((a, b) => a.id.localeCompare(b.id));
  const index = pages.findIndex((p) => p.id === activeSceneId);

  const flushCurrent = async () => {
    canvasRef.current?.flush?.();
    const scene = await canvasRef.current?.getScene?.();
    if (scene) await saveScene(scene);
  };

  const run = async (op: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await op();
    } catch (err) {
      console.error('[blackboard] page navigation failed', err);
    } finally {
      busyRef.current = false;
    }
  };

  const select = async (id: string) => {
    if (id === activeSceneId) return;
    await flushCurrent();
    await loadScene(id);
    dispatch({ type: 'SELECT_SCENE', id });
  };

  const goto = (i: number) =>
    run(async () => {
      if (i < 0 || i >= pages.length) return;
      await select(pages[i].id);
    });

  const handleNewPage = () =>
    run(async () => {
      const newId = `blackboard/${moduleSlug}/${Date.now()}`;
      await flushCurrent();
      await createScene(moduleSlug, newId);
      dispatch({ type: 'SELECT_SCENE', id: newId });
    });

  const handleDeletePage = () =>
    run(async () => {
      if (!activeSceneId) return;
      if (!window.confirm('¿Eliminar la página actual? Esta acción no se puede deshacer.')) return;
      // Pick the neighbor BEFORE deleting (pages still contains the victim).
      const neighbor = pages[index > 0 ? index - 1 : 1]?.id;
      await deleteScene(activeSceneId);
      // Without a neighbor the module bridge re-bootstraps the default scene.
      if (neighbor && neighbor !== activeSceneId) {
        await loadScene(neighbor);
        dispatch({ type: 'SELECT_SCENE', id: neighbor });
      }
    });

  return (
    <div className="flex flex-col items-center gap-1" aria-label="Páginas de la pizarra">
      <button
        type="button"
        onClick={() => void goto(index - 1)}
        disabled={index <= 0}
        className={btn}
        title="Página anterior de la pizarra"
        aria-label="Página anterior de la pizarra"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
      </button>
      <span
        className="text-[11px] font-semibold tabular-nums text-ink-600 dark:text-ink-200"
        title={`Página ${index + 1} de ${pages.length}`}
      >
        {pages.length === 0 ? '–' : `${index + 1}/${pages.length}`}
      </span>
      <button
        type="button"
        onClick={() => void goto(index + 1)}
        disabled={index < 0 || index >= pages.length - 1}
        className={btn}
        title="Página siguiente de la pizarra"
        aria-label="Página siguiente de la pizarra"
      >
        <ChevronRight aria-hidden className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => void handleNewPage()}
        className={btn}
        title="Nueva página de pizarra"
        aria-label="Nueva página de pizarra"
      >
        <Plus aria-hidden className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => void handleDeletePage()}
        disabled={!activeSceneId}
        className={`${btn} hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/30`}
        title="Eliminar página actual"
        aria-label="Eliminar página actual"
      >
        <Trash2 aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
