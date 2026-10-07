import type { RagRetriever } from './types';

let retriever: RagRetriever | null = null;

/**
 * Module-level retriever singleton: the course app builds a BM25 index at
 * runtime (corpus comes from a server route) and registers it here so the
 * package-level LLM hook can retrieve without importing app code.
 */
export function setRetriever(fn: RagRetriever | null): void {
  retriever = fn;
}

export function getRetriever(): RagRetriever | null {
  return retriever;
}
