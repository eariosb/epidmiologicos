'use client';

import { useBlackboardContext } from '../lib/context';

export function useBlackboard() {
  const { state, dispatch } = useBlackboardContext();
  return { state, dispatch };
}
