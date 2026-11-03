import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const setTeacherMode = vi.fn();
let mode: 'teacher' | 'student' = 'teacher';

vi.mock('@/hooks/useBroadcast', () => ({
  useBroadcast: () => ({ mode, setTeacherMode }),
}));

vi.mock('@cursos/blackboard', () => ({
  BlackboardTrigger: () => <button type="button">Pizarra</button>,
}));

import { RoleAwareBlackboardTrigger } from '../RoleAwareBlackboardTrigger';

beforeEach(() => {
  setTeacherMode.mockClear();
  mode = 'teacher';
});

describe('RoleAwareBlackboardTrigger (rol persistido)', () => {
  it('en modo docente muestra el disparador de la pizarra', () => {
    render(<RoleAwareBlackboardTrigger />);
    expect(screen.getByRole('button', { name: 'Pizarra' })).toBeInTheDocument();
  });

  it('en modo estudiante ofrece volver a docente en vez de desaparecer', () => {
    mode = 'student';
    render(<RoleAwareBlackboardTrigger />);
    const back = screen.getByRole('button', { name: /volver a docente/i });
    fireEvent.click(back);
    expect(setTeacherMode).toHaveBeenCalledTimes(1);
  });

  it('no deja el disparador cuando la pestaña sigue en modo estudiante', () => {
    mode = 'student';
    render(<RoleAwareBlackboardTrigger />);
    expect(screen.queryByRole('button', { name: 'Pizarra' })).not.toBeInTheDocument();
  });
});
