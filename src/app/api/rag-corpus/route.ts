import { NextResponse } from 'next/server';
import { buildCorpus } from '@/lib/rag/corpus';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rag-corpus → serialized RagDoc[] for the client-side BM25 index.
 * Server-only: module sources live on the filesystem.
 */
export async function GET() {
  return NextResponse.json({ docs: buildCorpus() });
}
