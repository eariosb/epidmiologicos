import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const track = vi.fn();
vi.mock('@/lib/telemetry', () => ({
  track: (...args: unknown[]) => track(...args),
  currentModuleSlug: () => '02-cadenas-markov-discretas',
}));

import { TermTracker } from './TermTracker';

beforeEach(() => {
  track.mockClear();
});

describe('TermTracker (delegación de term-view)', () => {
  it('reporta la clave del término bajo el cursor con el módulo actual', () => {
    render(
      <TermTracker>
        <p>
          La <span data-term="RR">RR</span> y el <span data-term="OR">OR</span>.
        </p>
      </TermTracker>,
    );
    fireEvent.mouseOver(screen.getByText('RR'));
    expect(track).toHaveBeenCalledWith('term-view', { key: 'RR' }, '02-cadenas-markov-discretas');
  });

  it('no repite la misma clave dentro de la ventana de 2 s', () => {
    render(
      <TermTracker>
        <span data-term="RR">RR</span>
      </TermTracker>,
    );
    const el = screen.getByText('RR');
    fireEvent.mouseOver(el);
    fireEvent.mouseOver(el);
    fireEvent.focus(el);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('registra una clave distinta y también el foco por teclado', () => {
    render(
      <TermTracker>
        <span data-term="RR">RR</span>
        <span data-term="CTMC">CTMC</span>
      </TermTracker>,
    );
    fireEvent.mouseOver(screen.getByText('RR'));
    fireEvent.focus(screen.getByText('CTMC'));
    expect(track.mock.calls.map((c) => (c[1] as { key: string }).key)).toEqual(['RR', 'CTMC']);
  });

  it('ignora el hover fuera de un término', () => {
    render(
      <TermTracker>
        <p>texto sin términos</p>
      </TermTracker>,
    );
    fireEvent.mouseOver(screen.getByText('texto sin términos'));
    expect(track).not.toHaveBeenCalled();
  });
});
