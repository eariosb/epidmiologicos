/** A retrievable document in the course corpus. */
export interface RagDoc {
  id: string;
  source: 'module' | 'bibliography' | 'quiz' | 'anexo' | 'note' | 'external';
  text: string;
  meta: Record<string, unknown>;
}

/** A fragment injected into the system prompt for one assistant turn. */
export interface RagFragment extends RagDoc {
  score: number;
}

/** Injected function signature: (query, k) → ranked fragments. */
export type RagRetriever = (query: string, k?: number) => RagFragment[];
