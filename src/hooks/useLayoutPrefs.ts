'use client';

import { useSyncExternalStore } from 'react';
import {
  DEFAULT_LAYOUT_PREFS,
  getLayoutPrefs,
  subscribeLayoutPrefs,
  type LayoutPrefs,
} from '@/lib/layout-prefs';
import { getTocPresent, subscribeTocPresent } from '@/lib/layout-slots';

/**
 * Lee las preferencias de layout sin desajustes de hidratación: el servidor
 * y el primer render del cliente usan los valores por defecto, y en cuanto
 * React hidrata se adopta lo guardado en `localStorage`. Las clases de
 * `<html>` ya las puso el script de arranque, así que el primer pintado es
 * el correcto aunque los botones se sincronicen un instante después.
 */
export function useLayoutPrefs(): LayoutPrefs {
  return useSyncExternalStore(subscribeLayoutPrefs, getLayoutPrefs, () => DEFAULT_LAYOUT_PREFS);
}

/** ¿La página actual tiene tabla de contenido que se pueda restaurar? */
export function useTocPresent(): boolean {
  return useSyncExternalStore(subscribeTocPresent, getTocPresent, () => false);
}
