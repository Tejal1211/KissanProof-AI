import path from "node:path";
import { fileTypeFromBuffer } from "file-type";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".txt": "text/plain",
};

export async function isSupportedDocumentContent(
  originalName: string,
  declaredMimeType: string,
  content: Uint8Array
): Promise<boolean> {
  const extension = path.extname(originalName).toLowerCase();
  const expectedMimeType = MIME_BY_EXTENSION[extension];
  if (!expectedMimeType || declaredMimeType !== expectedMimeType) return false;

  if (expectedMimeType === "text/plain") {
    if (content.includes(0)) return false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(content);
      return true;
    } catch {
      return false;
    }
  }

  const detected = await fileTypeFromBuffer(content);
  return detected?.mime === expectedMimeType;
}