import type { DocumentChunk, StoredDocument } from "../types.js";
import { chunkDocument } from "./documentService.js";

const documentChunkCache = new WeakMap<StoredDocument, DocumentChunk[]>();
const chunkTokenCache = new WeakMap<DocumentChunk, { tokens: Set<string>; length: number }>();

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

function scoreChunk(queryTokens: string[], chunk: DocumentChunk): number {
  let index = chunkTokenCache.get(chunk);
  if (!index) {
    const tokens = tokenize(chunk.text);
    index = { tokens: new Set(tokens), length: tokens.length };
    chunkTokenCache.set(chunk, index);
  }

  let score = 0;
  for (const qt of queryTokens) {
    if (index.tokens.has(qt)) score += 1;
  }
  return score / Math.max(1, Math.sqrt(index.length));
}

export function buildChunksForDocuments(documents: StoredDocument[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const doc of documents) {
    if (!doc.pages || doc.pages.length === 0) continue;
    let docChunks = documentChunkCache.get(doc);
    if (!docChunks) {
      docChunks = chunkDocument(doc, doc.pages).map((chunk) => ({ ...chunk, documentId: doc.id }));
      documentChunkCache.set(doc, docChunks);
    }
    chunks.push(...docChunks);
  }
  return chunks;
}

export function topChunks(query: string, chunks: DocumentChunk[], k = 6): DocumentChunk[] {
  const limit = Math.max(0, Math.floor(k));
  if (limit === 0 || chunks.length === 0) return [];

  const queryTokens = Array.from(new Set(tokenize(query)));
  if (queryTokens.length === 0) return chunks.slice(0, limit);

  const ranked: { chunk: DocumentChunk; score: number }[] = [];
  for (const chunk of chunks) {
    const candidate = { chunk, score: scoreChunk(queryTokens, chunk) };
    const insertionIndex = ranked.findIndex((item) => candidate.score > item.score);
    if (insertionIndex === -1) {
      if (ranked.length < limit) ranked.push(candidate);
      continue;
    }

    ranked.splice(insertionIndex, 0, candidate);
    if (ranked.length > limit) ranked.pop();
  }

  return ranked.map((item) => item.chunk);
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
