import type { Bm25Index } from './bm25';
import type { RagFragment } from './types';

/**
 * Two-pass retrieval: fragments from the active module first (boosted),
 * then global corpus, deduplicated by doc id.
 */
export function retrieveContext(
  query: string,
  moduleSlug: string,
  index: Bm25Index,
  k = 5,
): RagFragment[] {
  const global = index.search(query, k * 3);
  const inModule: RagFragment[] = [];
  const rest: RagFragment[] = [];
  for (const doc of global) {
    if (doc.meta.moduleSlug === moduleSlug) {
      inModule.push({ ...doc, score: doc.score * 1.5 });
    } else {
      rest.push(doc);
    }
  }
  return [...inModule, ...rest]
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
