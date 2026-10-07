import type { RagDoc, RagFragment } from './types';

const STOPWORDS = new Set(
  (
    'el la los las un una unos unas de del en y o a ante con sin por para como ' +
    'que es son fue ser esta este estos estas eso ese esa lo su sus se al más ' +
    'muy ya no si mi tu pero también the a an and or of in on to is are was were ' +
    'be been it its for with as at by from that this these those not'
  ).split(/\s+/),
);

const SUFFIXES = ['aciones', 'ación', 'mente', 'idades', 'idad', 'es', 's'];

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function stem(token: string): string {
  if (token.length <= 4) return token;
  for (const suffix of SUFFIXES) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, token.length - suffix.length);
    }
  }
  return token;
}

export function tokenize(text: string): string[] {
  return stripDiacritics(text.toLowerCase())
    .replace(/[^a-z0-9áéíóúñü\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

/**
 * BM25 (Okapi) over the course corpus. Deterministic, dependency-free,
 * small enough for a browser index built once per session.
 */
export class Bm25Index {
  private readonly docs: RagDoc[] = [];
  private readonly docTerms: Map<string, number>[] = [];
  private readonly docLen: number[] = [];
  private readonly df = new Map<string, number>();
  private avgdl = 0;

  add(docs: RagDoc[]): void {
    for (const doc of docs) {
      const terms = tokenize(doc.text);
      const tf = new Map<string, number>();
      for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
      this.docs.push(doc);
      this.docTerms.push(tf);
      this.docLen.push(terms.length);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    }
    this.avgdl =
      this.docLen.reduce((a, b) => a + b, 0) / Math.max(1, this.docLen.length);
  }

  get size(): number {
    return this.docs.length;
  }

  search(query: string, k = 5, k1 = 1.5, b = 0.75): RagFragment[] {
    const terms = [...new Set(tokenize(query))];
    if (terms.length === 0 || this.docs.length === 0) return [];
    const n = this.docs.length;
    const scored = this.docs.map((doc, i) => {
      let score = 0;
      for (const t of terms) {
        const tf = this.docTerms[i].get(t) ?? 0;
        if (tf === 0) continue;
        const df = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        const denom = tf + k1 * (1 - b + (b * this.docLen[i]) / this.avgdl);
        score += idf * ((tf * (k1 + 1)) / denom);
      }
      return { ...doc, score };
    });
    return scored
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
