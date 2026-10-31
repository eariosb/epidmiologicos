'use client';

// Envuelve un simulador en un <figure data-sim> transparente al layout y
// captura interacciones por DELEGACIÓN — sin tocar la lógica interna del sim.
//
//   botón        → sim-interact {action: play|pause|reset|click}
//   input range  → sim-interact {action: 'param', param, value} con debounce 800 ms
//   select/check → sim-interact {action: 'param', param, value} inmediato
//   canvas/svg   → sim-interact {action: 'click'} (arrastres en gráficos)
//
// Especificación: prueba-campo/docs/03-telemetria.md §3 (sim-interact).

import { useRef, type ReactNode, type SyntheticEvent } from 'react';
import { currentModuleSlug, track } from '@/lib/telemetry';

const PARAM_DEBOUNCE_MS = 800;

function paramName(el: HTMLElement): string {
  return (
    el.getAttribute('aria-label') ??
    el.getAttribute('name') ??
    el.id ??
    'param'
  );
}

function classifyButton(btn: HTMLButtonElement): string {
  const label = `${btn.getAttribute('aria-label') ?? ''} ${btn.textContent ?? ''}`.toLowerCase();
  if (/reiniciar|reset|restaurar|limpiar|nueva|new/.test(label)) return 'reset';
  if (/pausar|detener|stop|⏸/.test(label)) return 'pause';
  if (/iniciar|simular|ejecutar|reproducir|play|▶|lanzar|arrancar|generar/.test(label)) return 'play';
  return 'click';
}

export function SimTracker({ sim, children }: { sim: string; children: ReactNode }) {
  // Un timer por parámetro: el debounce es por slider, no global.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const emit = (payload: Record<string, unknown>) =>
    track('sim-interact', { sim, ...payload }, currentModuleSlug());

  const onClick = (e: SyntheticEvent) => {
    const el = e.target as HTMLElement;
    const btn = el.closest('button');
    if (btn && (e.currentTarget as HTMLElement).contains(btn)) {
      emit({ action: classifyButton(btn) });
      return;
    }
    // clicks en canvas/svg (arrastres, brushing) cuentan como interacción
    if (el.closest('canvas') || el.closest('svg')) emit({ action: 'click' });
  };

  const onInput = (e: SyntheticEvent) => {
    const el = e.target as HTMLElement;
    if (!(el instanceof HTMLInputElement) || el.type !== 'range') return;
    const key = paramName(el);
    const value = el.value;
    const prev = timers.current.get(key);
    if (prev) clearTimeout(prev);
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key);
        emit({ action: 'param', param: key, value });
      }, PARAM_DEBOUNCE_MS),
    );
  };

  const onChange = (e: SyntheticEvent) => {
    const el = e.target as HTMLElement;
    if (el instanceof HTMLInputElement && el.type === 'range') return; // lo cubre onInput
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement
    ) {
      emit({ action: 'param', param: paramName(el), value: el.value });
    }
  };

  return (
    <figure
      data-sim={sim}
      className="contents"
      onClick={onClick}
      onInput={onInput}
      onChange={onChange}
    >
      {children}
    </figure>
  );
}
