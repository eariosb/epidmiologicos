import type { Capture, Question, Session } from './session-store';

/**
 * Session replay timeline: every thing that happened during the class —
 * sections visited, board pages shown, captures taken, questions asked —
 * merged into one chronological sequence. This is what turns "registro"
 * into "repetición".
 */
export type TimelineItem =
  | { kind: 'start'; timestamp: number }
  | { kind: 'end'; timestamp: number }
  | { kind: 'section'; timestamp: number; slug: string; title: string }
  | { kind: 'board'; timestamp: number; sceneId: string }
  | { kind: 'capture'; timestamp: number; capture: Capture }
  | { kind: 'question'; timestamp: number; question: Question };

/** Human label for a board scene id like `blackboard/{slug}/{ts}`. */
export function sceneLabel(sceneId: string): string {
  const parts = sceneId.split('/');
  const slug = parts.length > 1 ? parts[parts.length - 2] : undefined;
  return slug ? `Página del tablero · ${slug}` : 'Página del tablero';
}

export function buildSessionTimeline(session: Session, captures: Capture[]): TimelineItem[] {
  const items: TimelineItem[] = [{ kind: 'start', timestamp: session.startedAt }];
  for (const s of session.visitedSections) {
    items.push({ kind: 'section', timestamp: s.timestamp, slug: s.slug, title: s.title });
  }
  for (const v of session.sceneVisits ?? []) {
    items.push({ kind: 'board', timestamp: v.timestamp, sceneId: v.sceneId });
  }
  for (const c of captures) {
    items.push({ kind: 'capture', timestamp: c.timestamp, capture: c });
  }
  for (const q of session.questions) {
    items.push({ kind: 'question', timestamp: q.timestamp, question: q });
  }
  if (session.endedAt) items.push({ kind: 'end', timestamp: session.endedAt });
  return items.sort((a, b) => a.timestamp - b.timestamp);
}
