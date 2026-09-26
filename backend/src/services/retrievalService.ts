import type { DocumentChunk, StoredDocument } from "../types.js";
import { chunkDocument } from "./documentService.js";

/**
 * Retrieval for the "Ask Your Document" RAG chat and for claim analysis
 * context limiting.
 *
 * This build uses fast, dependency-free TF-style keyword scoring rather
 * than a vector embedding index, so the whole app runs with zero extra
 * infra. To upgrade to semantic retrieval for production: embed each
 * chunk once at upload time (e.g. Voyage AI or OpenAI embeddings) and
 * store the vector alongside the chunk, then replace `scoreChunk` below
 * with a cosine-similarity lookup — nothing else in the app needs to
 * change, since callers only see `topChunks()`.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreChunk(queryTokens: string[], chunkText: string): number {
  const chunkTokens = tokenize(chunkText);
  const set = new Set(chunkTokens);
  let score = 0;
  for (const qt of queryTokens) {
    if (set.has(qt)) score += 1;
  }
  return score / Math.max(1, Math.sqrt(chunkTokens.length));
}

export function buildChunksForDocuments(documents: StoredDocument[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const doc of documents) {
    if (!doc.pages || doc.pages.length === 0) continue;
    const docChunks = chunkDocument(doc, doc.pages).map((c) => ({ ...c, documentId: doc.id }));
    chunks.push(...docChunks);
  }
  return chunks;
}

export function topChunks(query: string, chunks: DocumentChunk[], k = 6): DocumentChunk[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || chunks.length === 0) return chunks.slice(0, k);
  return chunks
    .map((c) => ({ chunk: c, score: scoreChunk(queryTokens, c.text) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.chunk);
}

/** Caps total context sent to the model so we never resend whole documents per question. */
export function capChunksByChars(chunks: DocumentChunk[], maxChars = 6000): DocumentChunk[] {
  const out: DocumentChunk[] = [];
  let total = 0;
  for (const c of chunks) {
    if (total + c.text.length > maxChars) break;
    out.push(c);
    total += c.text.length;
  }
  return out;
}
