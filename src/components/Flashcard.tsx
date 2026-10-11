'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { MathText } from '@/lib/math-text';
import type { FlashcardItem, FlashcardProps } from '@/types/course';

export type { FlashcardItem, FlashcardProps };

/**
 * Tarjeta individual con volteo 3D. El anverso muestra el concepto; el
 * reverso su definición o fórmula (ambos pueden llevar LaTeX $…$).
 */
function Card({ front, back }: FlashcardItem) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={flipped ? `Reverso de la tarjeta ${front}` : `Tarjeta ${front}: pulsa para voltear`}
      className={clsx(
        'flashcard block h-48 w-full cursor-pointer [perspective:1000px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        flipped && 'flashcard-flipped'
      )}
    >
      <span className="flashcard-inner relative block h-full w-full">
        <span className="flashcard-face absolute inset-0 flex items-center justify-center rounded border border-brand-200 bg-brand-700 shadow-md">
          <span className="px-4 text-center text-2xl font-bold tracking-wide text-white">
            <MathText text={front} />
          </span>
        </span>
        <span className="flashcard-face flashcard-back absolute inset-0 flex items-center justify-center overflow-y-auto rounded border border-ink-200 bg-white p-5 text-left shadow-md">
          <span className="text-sm leading-relaxed text-ink-700">
            <MathText text={back} />
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Rejilla de tarjetas de repaso para el cierre de un módulo.
 * Recibe `items` (interfaz de `course.ts`): cada módulo declara
 * `<Flashcard items={[{ front, back }, …]} />`.
 */
export function Flashcard({ items, title }: FlashcardProps) {
  return (
    <div className="my-6">
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {title}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((card) => (
          <Card key={card.front} {...card} />
        ))}
      </div>
    </div>
  );
}

export interface FlashcardsProps {
  cards: FlashcardItem[];
  title?: string;
}

/** Alias de compatibilidad: misma rejilla con prop `cards`. */
export function Flashcards({ cards, title }: FlashcardsProps) {
  return <Flashcard items={cards} title={title} />;
}
