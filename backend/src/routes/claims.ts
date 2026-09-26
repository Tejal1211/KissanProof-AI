import { Router } from "express";
import { v4 as uuid } from "uuid";
import { createClaimSchema, languageEnum } from "../validators/schemas.js";
import { requireAuth, requireOfficial, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import {
  saveClaim,
  updateClaim,
  getClaimById,
  getClaimsByUser,
  getAllClaims,
  getDocumentsByIds,
  updateDocument,
} from "../db.js";
import { analyzeClaim } from "../services/aiService.js";
import { assertDocumentsClaimableByUser } from "../services/documentService.js";
import { buildEvidenceChecklist } from "../services/consistencyService.js";
import type { Claim } from "../types.js";
export const claimsRouter = Router();
claimsRouter.use(requireAuth);

claimsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = createClaimSchema.parse(req.body);
    const documentIds = body.documentIds;
    const documents = await getDocumentsByIds(documentIds);
    assertDocumentsClaimableByUser(documentIds, documents, req.userId!);

    const claim: Claim = {
      id: uuid(),
      userId: req.userId!,
      claimType: body.claimType,
      crop: body.crop,
      location: body.location,
      farmArea: body.farmArea,
      eventDescription: body.eventDescription,
      eventDate: body.eventDate,
      documentIds,
      status: "draft",
      analysis: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveClaim(claim);

    // Link documents to this claim so ownership + retrieval scoping works later.
    for (const docId of documentIds) {
      await updateDocument(docId, { claimId: claim.id });
    }

    res.status(201).json({ success: true, data: { claim } });
  })
);

claimsRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const claims = await getClaimsByUser(req.userId!);
    res.json({ success: true, data: { claims } });
  })
);

claimsRouter.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const claim = await getClaimById(req.params.id);
    if (!claim || (claim.userId !== req.userId && req.userRole !== "official")) {
      throw new AppError("NOT_FOUND", "Claim not found.", 404);
    }
    // Cheap, deterministic — safe to compute on every read (no AI call).
    const docs = await getDocumentsByIds(claim.documentIds);
    res.json({ success: true, data: { claim, evidenceChecklist: buildEvidenceChecklist(docs) } });
  })
);

claimsRouter.post(
  "/:id/analyze",
  aiLimiter,
  asyncHandler(async (req: AuthedRequest, res) => {
    const claim = await getClaimById(req.params.id);
    if (!claim || claim.userId !== req.userId) {
      throw new AppError("NOT_FOUND", "Claim not found.", 404);
    }
    const language = languageEnum.parse(req.body?.language ?? "en");

    await updateClaim(claim.id, { status: "processing" });

    const docs = await getDocumentsByIds(claim.documentIds);
    const processedDocs = docs.filter((d) => d.status === "processed" && d.pages && d.pages.length > 0);

    try {
      const analysis = await analyzeClaim({
        claimType: claim.claimType,
        crop: claim.crop,
        location: claim.location,
        farmArea: claim.farmArea,
        eventDescription: claim.eventDescription,
        eventDate: claim.eventDate,
        documents: processedDocs.map((d) => ({ name: d.originalName, pages: d.pages ?? [] })),
        language,
      });
      const updated = await updateClaim(claim.id, { status: "analyzed", analysis });
      res.json({
        success: true,
        data: { claim: updated, evidenceChecklist: buildEvidenceChecklist(docs) },
      });
    } catch (err) {
      await updateClaim(claim.id, { status: "failed" });
      throw err;
    }
  })
);

/** Official review queue — demo/mock aggregate view over the same claim data. */
claimsRouter.get(
  "/review/queue",
  requireOfficial,
  asyncHandler(async (_req, res) => {
    const claims = await getAllClaims();
    const queue = claims
      .filter((c) => c.status === "analyzed")
      .map((c) => ({
        id: c.id,
        claimType: c.claimType,
        crop: c.crop,
        readiness: c.analysis?.readiness ?? null,
        issueCount: c.analysis?.issues.length ?? 0,
        missingCount: c.analysis?.missingInformation.length ?? 0,
        status:
          (c.analysis?.issues.length ?? 0) === 0
            ? "Ready for Human Review"
            : c.analysis?.missingInformation.length
            ? "Information Needed"
            : "Verification Required",
      }));
    res.json({ success: true, data: { queue, note: "Demonstration data — not real government records." } });
  })
);

claimsRouter.get(
  "/review/insights",
  requireOfficial,
  asyncHandler(async (_req, res) => {
    const claims = (await getAllClaims()).filter((c) => c.analysis);
    const counts: Record<string, number> = {};
    for (const c of claims) {
      for (const issue of c.analysis!.issues) {
        counts[issue.type] = (counts[issue.type] ?? 0) + 1;
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const breakdown = Object.entries(counts)
      .map(([type, count]) => ({ type, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
    res.json({
      success: true,
      data: {
        breakdown,
        note:
          "AI-generated operational insight from demonstration data, requiring human review — not a finding about any individual claim.",
      },
    });
  })
);
