import { describe, expect, it } from "vitest";
import { isSupportedDocumentContent } from "../src/services/uploadValidationService.js";

describe("isSupportedDocumentContent", () => {
  it("accepts content whose detected type, extension, and declared MIME match", async () => {
    const validPdf = Buffer.from("%PDF-1.7\n");
    const validJpeg = Buffer.from("ffd8ffe000104a46494600010100000100010000", "hex");
    const validPng = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");

    await expect(isSupportedDocumentContent("policy.pdf", "application/pdf", validPdf)).resolves.toBe(true);
    await expect(isSupportedDocumentContent("damage.jpg", "image/jpeg", validJpeg)).resolves.toBe(true);
    await expect(isSupportedDocumentContent("damage.png", "image/png", validPng)).resolves.toBe(true);
    await expect(isSupportedDocumentContent("policy.txt", "text/plain", Buffer.from("Policy text"))).resolves.toBe(true);
  });

  it("rejects content disguised with an allowed extension or MIME type", async () => {
    const plainText = Buffer.from("not a PDF");
    await expect(isSupportedDocumentContent("policy.pdf", "application/pdf", plainText)).resolves.toBe(false);
    await expect(isSupportedDocumentContent("policy.txt", "application/pdf", plainText)).resolves.toBe(false);
    await expect(isSupportedDocumentContent("policy.exe", "text/plain", plainText)).resolves.toBe(false);
  });

  it("rejects binary or malformed UTF-8 content labeled as text", async () => {
    await expect(isSupportedDocumentContent("notes.txt", "text/plain", Buffer.from([0, 1, 2]))).resolves.toBe(false);
    await expect(isSupportedDocumentContent("notes.txt", "text/plain", Buffer.from([0xff, 0xfe]))).resolves.toBe(false);
  });
});