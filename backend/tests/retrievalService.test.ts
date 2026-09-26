import { describe, it, expect } from "vitest";
import { topChunks, capChunksByChars } from "../src/services/retrievalService.js";
import type { DocumentChunk } from "../src/types.js";

const chunks: DocumentChunk[] = [
  { documentId: "1", documentName: "insurance.pdf", page: 1, text: "The claim deadline is 30 days after the event." },
  { documentId: "1", documentName: "insurance.pdf", page: 2, text: "Farm area recorded as 2.5 hectares of cotton." },
  { documentId: "2", documentName: "application.pdf", page: 1, text: "Unrelated administrative boilerplate text." },
];

describe("topChunks", () => {
  it("ranks chunks containing query keywords above unrelated ones", () => {
    const result = topChunks("what is the deadline for the claim", chunks, 2);
    expect(result[0].text).toContain("deadline");
  });

  it("falls back to returning chunks when the query has no meaningful tokens", () => {
    const result = topChunks("??", chunks, 2);
    expect(result).toHaveLength(2);
  });

  it("keeps only the highest-scoring chunks and preserves input order for ties", () => {
    const input = [
      { ...chunks[2], text: "administrative" },
      { ...chunks[0], text: "deadline" },
      { ...chunks[1], text: "claim" },
    ];
    const result = topChunks("deadline claim", input, 2);

    expect(result).toEqual(input.slice(1));
    expect(input[0].text).toBe("administrative");
  });

  it("handles zero and negative result limits", () => {
    expect(topChunks("deadline", chunks, 0)).toEqual([]);
    expect(topChunks("deadline", chunks, -2)).toEqual([]);
  });
});

describe("capChunksByChars", () => {
  it("never exceeds the character budget, so full documents are never resent to the model", () => {
    const bigChunks: DocumentChunk[] = Array.from({ length: 20 }, (_, i) => ({
      documentId: "1",
      documentName: "doc.pdf",
      page: i + 1,
      text: "x".repeat(1000),
    }));
    const capped = capChunksByChars(bigChunks, 3500);
    const total = capped.reduce((sum, c) => sum + c.text.length, 0);
    expect(total).toBeLessThanOrEqual(3500);
  });

  it("stops before adding a chunk that would exceed the budget", () => {
    const result = capChunksByChars(chunks, chunks[0].text.length + 1);
    expect(result).toEqual([chunks[0]]);
  });
});
