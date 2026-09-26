import { describe, expect, it } from "vitest";
import type { StoredDocument } from "../src/types.js";
import { assertDocumentsClaimableByUser } from "../src/services/documentService.js";
import { createClaimSchema } from "../src/validators/schemas.js";

const ownerId = "user-1";
const documentId = "b6e79c4d-173e-48aa-8e4d-9484c1a44575";

function makeDocument(overrides: Partial<StoredDocument> = {}): StoredDocument {
  return {
    id: documentId,
    userId: ownerId,
    claimId: null,
    originalName: "policy.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    storagePath: "uploads/policy.pdf",
    extractedText: null,
    pages: null,
    status: "uploaded",
    error: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("claim document ownership", () => {
  it("allows the owner to attach an unclaimed document", () => {
    expect(() => assertDocumentsClaimableByUser([documentId], [makeDocument()], ownerId)).not.toThrow();
  });

  it("rejects documents owned by another user", () => {
    expect(() =>
      assertDocumentsClaimableByUser([documentId], [makeDocument({ userId: "user-2" })], ownerId)
    ).toThrow("One or more selected documents are unavailable.");
  });

  it("rejects missing documents and documents already attached to a claim", () => {
    expect(() => assertDocumentsClaimableByUser([documentId], [], ownerId)).toThrow(
      "One or more selected documents are unavailable."
    );
    expect(() =>
      assertDocumentsClaimableByUser(
        [documentId],
        [makeDocument({ claimId: "claim-1" })],
        ownerId
      )
    ).toThrow("One or more selected documents are unavailable.");
  });
});

describe("createClaimSchema document IDs", () => {
  const validClaim = {
    claimType: "crop_insurance",
    crop: "cotton",
    location: "Maharashtra",
  };

  it("defaults document IDs to an empty list and validates unique UUIDs", () => {
    expect(createClaimSchema.parse(validClaim).documentIds).toEqual([]);
    expect(createClaimSchema.parse({ ...validClaim, documentIds: [documentId] }).documentIds).toEqual([documentId]);
  });

  it("rejects malformed, duplicate, or excessive document IDs", () => {
    expect(createClaimSchema.safeParse({ ...validClaim, documentIds: ["not-a-uuid"] }).success).toBe(false);
    expect(createClaimSchema.safeParse({ ...validClaim, documentIds: [documentId, documentId] }).success).toBe(false);
    const tooMany = Array.from({ length: 9 }, (_, index) =>
      `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`
    );
    expect(createClaimSchema.safeParse({ ...validClaim, documentIds: tooMany }).success).toBe(false);
  });
});