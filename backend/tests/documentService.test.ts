import { describe, it, expect } from "vitest";
import { chunkDocument } from "../src/services/documentService.js";

describe("chunkDocument", () => {
  it("splits long page text into overlapping chunks", () => {
    const longText = "word ".repeat(500); // ~2500 chars
    const chunks = chunkDocument({ originalName: "test.pdf" }, [{ page: 1, text: longText }]);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].page).toBe(1);
    expect(chunks[0].documentName).toBe("test.pdf");
  });

  it("returns a single chunk for short text", () => {
    const chunks = chunkDocument({ originalName: "short.txt" }, [{ page: 1, text: "hello world" }]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("hello world");
  });

  it("returns no chunks for a page with no text (e.g. scanned PDF)", () => {
    const chunks = chunkDocument({ originalName: "scan.pdf" }, []);
    expect(chunks).toHaveLength(0);
  });

  it("preserves page numbers across multiple pages", () => {
    const chunks = chunkDocument({ originalName: "multi.pdf" }, [
      { page: 1, text: "first page text" },
      { page: 2, text: "second page text" },
    ]);
    expect(chunks.map((c) => c.page)).toEqual([1, 2]);
  });
});
