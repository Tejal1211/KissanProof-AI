export type ClaimType =
  | "crop_insurance"
  | "disaster_compensation"
  | "agricultural_subsidy"
  | "government_scheme"
  | "other";

export type Language = "en" | "hi" | "mr";

export interface SourceRef {
  document: string;
  page?: number;
  section?: string;
}

export interface ClaimIssue {
  type:
    | "missing_information"
    | "document_inconsistency"
    | "important_requirement"
    | "date_deadline"
    | "evidence_gap"
    | "ambiguous_information";
  title: string;
  severity: "info" | "warning" | "critical_review";
  explanation: string;
  evidence: string;
  sources: SourceRef[];
  recommendedVerification: string;
}

export interface ClaimDeadline {
  date: string;
  description: string;
  source: SourceRef;
}

export interface ClaimAnalysis {
  summary: string;
  readiness: { status: "on_track" | "needs_verification" | "incomplete"; completeness: number };
  informationFound: string[];
  needsVerification: string[];
  missingInformation: string[];
  issues: ClaimIssue[];
  deadlines: ClaimDeadline[];
  questionsForProfessional: string[];
  disclaimer: string;
}

export interface Claim {
  id: string;
  userId: string;
  claimType: ClaimType;
  crop: string;
  location: string;
  farmArea: string;
  eventDescription: string;
  eventDate: string;
  documentIds: string[];
  status: "draft" | "processing" | "analyzed" | "failed";
  analysis: ClaimAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDocument {
  id: string;
  userId: string;
  claimId: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: "uploaded" | "processing" | "processed" | "failed";
  error: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  claimId: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceRef[];
  language: Language;
  createdAt: string;
}

export interface EvidenceChecklistItem {
  label: string;
  status: "found" | "not_verified" | "missing";
}
