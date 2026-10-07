'use client';

import { useState } from 'react';
import clsx from 'clsx';

export interface FlashcardProps {
  /** Anverso: nombre corto de la distribución (ej. "BCT") */
  front: string;
  /** Reverso: soporte, parámetros y uso típico */
  back: string;
}

/**
 * Tarjeta de repaso con volteo 3D. El anverso lleva el nombre gamlss de una
 * distribución; el reverso su soporte, parámetros (μ, σ, ν, τ) y caso de uso.
 */
export function Flashcard({ front, back }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={flipped ? `Reverso de la tarjeta ${front}` : `Tarjeta ${front}: pulsa para voltear`}
      className={clsx(
        'flashcard my-4 block h-48 w-full max-w-md cursor-pointer [perspective:1000px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        flipped && 'flashcard-flipped'
      )}
    >
      <span className="flashcard-inner relative block h-full w-full">
        <span className="flashcard-face absolute inset-0 flex items-center justify-center rounded border border-accent-200 bg-accent-700 shadow-md">
          <span className="text-3xl font-bold tracking-wide text-white">{front}</span>
        </span>
        <span className="flashcard-face flashcard-back absolute inset-0 flex items-center justify-center rounded border border-ink-200 bg-white p-5 text-left shadow-md">
          <span className="text-sm leading-relaxed text-ink-700">{back}</span>
        </span>
      </span>
    </button>
  );
}

export interface FlashcardsProps {
  cards: FlashcardProps[];
}

/** Rejilla de flashcards para el cierre de un módulo. */
export function Flashcards({ cards }: FlashcardsProps) {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <Flashcard key={c.front} {...c} />
      ))}
    </div>
  );
}
