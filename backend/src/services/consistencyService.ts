import type { StoredDocument } from "../types.js";

export interface EvidenceChecklistItem {
  label: string;
  status: "found" | "not_verified" | "missing";
}

/**
 * The Claim Failure Simulator's document-inconsistency and evidence-gap
 * findings come from the GenAI analysis (aiService), which reasons over
 * actual extracted text — nothing here is hardcoded per claim type.
 *
 * This helper adds one deterministic, cheap layer on top: it looks at
 * *which kinds of files were actually uploaded* to build the "Evidence
 * checklist" UI shown in the Evidence Gap Detector, since that's a simple
 * presence check that doesn't need a model call.
 */
export function buildEvidenceChecklist(documents: StoredDocument[]): EvidenceChecklistItem[] {
  const hasImage = documents.some((d) => d.mimeType.startsWith("image/"));
  const hasPdfOrText = documents.some((d) => d.mimeType === "application/pdf" || d.mimeType === "text/plain");
  const hasExtractedDate = documents.some((d) => d.pages?.some((p) => /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(p.text)));

  return [
    { label: "Damage photo", status: hasImage ? "found" : "missing" },
    { label: "Date", status: hasExtractedDate ? "not_verified" : "missing" },
    { label: "Location", status: "not_verified" },
    { label: "Supporting document", status: hasPdfOrText ? "found" : "missing" },
  ];
}
