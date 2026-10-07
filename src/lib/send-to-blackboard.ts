import type { BoardInsertOpts } from '@cursos/blackboard';

export interface SendToBlackboardDetail {
  dataUrl: string;
  opts?: BoardInsertOpts;
  handled?: boolean;
}

const pending: SendToBlackboardDetail[] = [];

/**
 * Sends an image to the blackboard canvas. If no listener handles it
 * synchronously (blackboard panel closed), the insert is queued and
 * drained when the panel next mounts.
 */
export function sendToBlackboard(detail: SendToBlackboardDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('send-to-blackboard', { detail }));
  if (!detail.handled) {
    pending.push(detail);
  }
}

export function drainPendingInserts(): SendToBlackboardDetail[] {
  return pending.splice(0);
}
