import { describe, it, expect } from "vitest";
import { claimAnalysisSchema, chatAnswerSchema, createClaimSchema } from "../src/validators/schemas.js";

describe("claimAnalysisSchema", () => {
  it("accepts a well-formed AI analysis response", () => {
    const valid = {
      summary: "ok",
      readiness: { status: "needs_verification", completeness: 78 },
      informationFound: ["Crop identified"],
      needsVerification: ["Area differs between documents"],
      missingInformation: [],
      issues: [
        {
          type: "document_inconsistency",
          title: "Farm area differs",
          severity: "warning",
          explanation: "Values differ across documents.",
          evidence: "2.5 ha vs 3.0 ha",
          sources: [{ document: "insurance.pdf", page: 2 }],
          recommendedVerification: "Confirm the correct area with the insurer.",
        },
      ],
      deadlines: [],
      questionsForProfessional: ["Which area value should be verified?"],
    };
    expect(() => claimAnalysisSchema.parse(valid)).not.toThrow();
  });

  it("rejects a response that invents an eligibility verdict field with the wrong severity enum", () => {
    const invalid = {
      summary: "ok",
      readiness: { status: "eligible", completeness: 78 }, // not a valid status — that's the point
      informationFound: [],
      needsVerification: [],
      missingInformation: [],
      issues: [],
      deadlines: [],
      questionsForProfessional: [],
    };
    expect(() => claimAnalysisSchema.parse(invalid)).toThrow();
  });

  it("rejects completeness values outside 0-100", () => {
    const invalid = {
      summary: "ok",
      readiness: { status: "on_track", completeness: 150 },
      informationFound: [],
      needsVerification: [],
      missingInformation: [],
      issues: [],
      deadlines: [],
      questionsForProfessional: [],
    };
    expect(() => claimAnalysisSchema.parse(invalid)).toThrow();
  });
});

describe("chatAnswerSchema", () => {
  it("requires foundInDocuments to be a boolean, not a string", () => {
    expect(() =>
      chatAnswerSchema.parse({ answer: "hi", sources: [], foundInDocuments: "true" })
    ).toThrow();
  });
});

describe("createClaimSchema", () => {
  it("rejects an unknown claim type", () => {
    expect(() =>
      createClaimSchema.parse({ claimType: "made_up_type", crop: "Cotton", location: "Nagpur" })
    ).toThrow();
  });

  it("accepts a valid minimal claim", () => {
    expect(() =>
      createClaimSchema.parse({ claimType: "crop_insurance", crop: "Cotton", location: "Nagpur" })
    ).not.toThrow();
  });
});
