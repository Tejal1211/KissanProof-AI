import { describe, it, expect } from "vitest";
import { buildEvidenceChecklist } from "../src/services/consistencyService.js";
import type { StoredDocument } from "../src/types.js";

function doc(overrides: Partial<StoredDocument>): StoredDocument {
  return {
    id: "d1",
    userId: "u1",
    claimId: null,
    originalName: "doc",
    mimeType: "application/pdf",
    sizeBytes: 100,
    storagePath: "/tmp/doc",
    extractedText: null,
    pages: null,
    status: "processed",
    error: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildEvidenceChecklist", () => {
  it("marks damage photo as missing when no image was uploaded", () => {
    const checklist = buildEvidenceChecklist([doc({ mimeType: "application/pdf" })]);
    expect(checklist.find((i) => i.label === "Damage photo")?.status).toBe("missing");
  });

  it("marks damage photo as found when an image was uploaded", () => {
    const checklist = buildEvidenceChecklist([doc({ mimeType: "image/jpeg" })]);
    expect(checklist.find((i) => i.label === "Damage photo")?.status).toBe("found");
  });

  it("detects a date-like pattern in extracted text", () => {
    const checklist = buildEvidenceChecklist([doc({ pages: [{ page: 1, text: "Filed on 12/04/2024" }] })]);
    expect(checklist.find((i) => i.label === "Date")?.status).toBe("not_verified");
  });

  it("marks date as missing when no date pattern is found anywhere", () => {
    const checklist = buildEvidenceChecklist([doc({ pages: [{ page: 1, text: "no dates here at all" }] })]);
    expect(checklist.find((i) => i.label === "Date")?.status).toBe("missing");
  });
});
