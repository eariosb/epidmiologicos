import { useCallback, useState } from 'react';
import { runRCode, type RRunResult } from '@/lib/webr';
import { useWebRStatus } from '@/components/WebRProvider';

export type RunState = 'idle' | 'running' | 'done' | 'error';

interface UseRCellResult {
  /** Current state of execution */
  state: RunState;
  /** Last run result (text output, plots, error) */
  result: RRunResult | null;
  /** Global WebR boot status: idle | loading | ready | error */
  webRStatus: ReturnType<typeof useWebRStatus>['status'];
  webRError: string | null;
  /** Run the given code */
  run: (code: string) => Promise<void>;
}

/**
 * Hook used by <RCell> to execute an R snippet against the shared
 * WebR instance and expose a simple state machine for the UI.
 */
export function useRCell(): UseRCellResult {
  const { status, error, ensureStarted } = useWebRStatus();
  const [state, setState] = useState<RunState>('idle');
  const [result, setResult] = useState<RRunResult | null>(null);

  const run = useCallback(
    async (code: string) => {
      ensureStarted();
      setState('running');
      try {
        const res = await runRCode(code);
        setResult(res);
        setState(res.error ? 'error' : 'done');
      } catch (err) {
        setResult({ text: '', error: err instanceof Error ? err.message : String(err), plots: [] });
        setState('error');
      }
    },
    [ensureStarted]
  );

  return { state, result, webRStatus: status, webRError: error, run };
}
