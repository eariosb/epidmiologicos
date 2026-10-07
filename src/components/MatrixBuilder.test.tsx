import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import type { BlackboardCanvasRef } from '@cursos/blackboard';
import { MatrixBuilder } from './MatrixBuilder';

vi.mock('@/lib/latex-image', () => ({
  latexToDataUrl: vi.fn(async () => 'data:image/png;base64,matrix'),
}));

function makeCanvasRef() {
  const insertImage = vi.fn();
  const ref = createRef<BlackboardCanvasRef>() as RefObject<BlackboardCanvasRef | null> & {
    current: { insertImage: import("vitest").Mock };
  };
  (ref as { current: unknown }).current = { insertImage } as never;
  return ref;
}

describe('MatrixBuilder cell editing', () => {
  it('lets the user clear the default cell and type decimals', () => {
    const canvasRef = makeCanvasRef();
    render(<MatrixBuilder canvasRef={canvasRef} />);
    const cell = screen.getByLabelText('Celda 1,1') as HTMLInputElement;
    expect(cell.value).toBe('0');
    // Intermediate states must survive: "" while deleting, "0." while typing
    fireEvent.change(cell, { target: { value: '' } });
    expect(cell.value).toBe('');
    fireEvent.change(cell, { target: { value: '0.' } });
    expect(cell.value).toBe('0.');
    fireEvent.change(cell, { target: { value: '0.75' } });
    expect(cell.value).toBe('0.75');
    // And selects everything on focus so typing replaces the default
  });

  it('inserts the matrix into the blackboard with parsed numeric values', async () => {
    const canvasRef = makeCanvasRef();
    render(<MatrixBuilder canvasRef={canvasRef} initialSize={2} />);
    fireEvent.change(screen.getByLabelText('Celda 1,1'), { target: { value: '0.75' } });
    fireEvent.change(screen.getByLabelText('Celda 1,2'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Insertar en pizarra/ }));
    await waitFor(() => expect(canvasRef.current.insertImage).toHaveBeenCalled());
    const [, opts] = canvasRef.current.insertImage.mock.calls[0];
    const values = (opts.meta as { payload: { values: number[][] } }).payload.values;
    expect(values).toEqual([
      [0.75, 2],
      [0, 0],
    ]);
  });
});
