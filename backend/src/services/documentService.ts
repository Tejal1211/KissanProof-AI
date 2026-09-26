import fs from "node:fs/promises";
// pdf-parse has no ESM types export; require via createRequire for reliability.
import { createRequire } from "node:module";
import { AppError } from "../middleware/errorHandler.js";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");

import type { DocumentPage, DocumentChunk, StoredDocument } from "../types.js";

const CHUNK_SIZE_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 150;

export function assertDocumentsClaimableByUser(documentIds: string[], documents: StoredDocument[], userId: string) {
  if (
    documentIds.length !== documents.length ||
    documents.some((document) => document.userId !== userId || document.claimId !== null)
  ) {
    throw new AppError("DOCUMENTS_NOT_AVAILABLE", "One or more selected documents are unavailable.", 404);
  }
}

/**
 * Extracts text from a document, preserving page numbers where the format
 * supports it (PDF). Images are not OCR'd in this build (see README
 * limitations) — they're still tracked so the evidence checklist can note
 * their presence.
 */
export async function extractText(doc: { storagePath: string; mimeType: string }): Promise<DocumentPage[]> {
  if (doc.mimeType === "application/pdf") {
    const buffer = await fs.readFile(doc.storagePath);
    const data = await pdfParse(buffer);
    const rawText: string = data.text ?? "";
    if (!rawText.trim()) {
      // Scanned PDF with no extractable text layer — a real, expected edge case.
      return [];
    }
    // pdf-parse doesn't give per-page text out of the box; split on its
    // form-feed page breaks when present, otherwise treat as one page.
    const pageTexts = rawText.split("\f").filter((p) => p.trim().length > 0);
    const pages = pageTexts.length > 0 ? pageTexts : [rawText];
    return pages.map((text, i) => ({ page: i + 1, text: text.trim() }));
  }

  if (doc.mimeType === "text/plain") {
    const text = (await fs.readFile(doc.storagePath, "utf-8")).trim();
    return text ? [{ page: 1, text }] : [];
  }

  if (doc.mimeType === "image/jpeg" || doc.mimeType === "image/png") {
    // No text extraction for images in this build; the Evidence Gap
    // Detector treats these as visual evidence rather than text sources.
    return [];
  }

  return [];
}

export function chunkDocument(doc: Pick<StoredDocument, "originalName">, pages: DocumentPage[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const page of pages) {
    let start = 0;
    while (start < page.text.length) {
      const end = Math.min(start + CHUNK_SIZE_CHARS, page.text.length);
      chunks.push({
        documentId: "", // filled in by caller once persisted
        documentName: doc.originalName,
        page: page.page,
        text: page.text.slice(start, end),
      });
      if (end === page.text.length) break;
      start = end - CHUNK_OVERLAP_CHARS;
    }
  }
  return chunks;
}
