import { z } from "zod";

export const claimTypeEnum = z.enum([
  "crop_insurance",
  "disaster_compensation",
  "agricultural_subsidy",
  "government_scheme",
  "other",
]);

export const languageEnum = z.enum(["en", "hi", "mr"]);

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const createClaimSchema = z.object({
  claimType: claimTypeEnum,
  crop: z.string().min(1).max(80),
  location: z.string().min(1).max(120),
  farmArea: z.string().max(40).optional().default(""),
  eventDescription: z.string().max(1000).optional().default(""),
  eventDate: z.string().max(40).optional().default(""),
  documentIds: z
    .array(z.string().uuid())
    .max(8)
    .refine((ids) => new Set(ids).size === ids.length, "Document IDs must be unique.")
    .default([]),
});

export const chatSchema = z.object({
  claimId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  language: languageEnum.optional().default("en"),
});

// --- Shape the GenAI service must return. Anything that doesn't match
//     this schema is rejected and retried/falls back safely (see aiService). ---
export const sourceRefSchema = z.object({
  document: z.string(),
  page: z.number().int().optional(),
  section: z.string().optional(),
});

export const claimIssueSchema = z.object({
  type: z.enum([
    "missing_information",
    "document_inconsistency",
    "important_requirement",
    "date_deadline",
    "evidence_gap",
    "ambiguous_information",
  ]),
  title: z.string(),
  severity: z.enum(["info", "warning", "critical_review"]),
  explanation: z.string(),
  evidence: z.string(),
  sources: z.array(sourceRefSchema).default([]),
  recommendedVerification: z.string(),
});

export const claimAnalysisSchema = z.object({
  summary: z.string(),
  readiness: z.object({
    status: z.enum(["on_track", "needs_verification", "incomplete"]),
    completeness: z.number().min(0).max(100),
  }),
  informationFound: z.array(z.string()).default([]),
  needsVerification: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  issues: z.array(claimIssueSchema).default([]),
  deadlines: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
        source: sourceRefSchema,
      })
    )
    .default([]),
  questionsForProfessional: z.array(z.string()).default([]),
});

export const chatAnswerSchema = z.object({
  answer: z.string(),
  sources: z.array(sourceRefSchema).default([]),
  foundInDocuments: z.boolean(),
});
