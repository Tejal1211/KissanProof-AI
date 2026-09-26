import { Router } from "express";
import { v4 as uuid } from "uuid";
import { chatSchema } from "../validators/schemas.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { getClaimById, getDocumentsByIds, saveChatMessage, getChatHistory } from "../db.js";
import { buildChunksForDocuments, topChunks, capChunksByChars } from "../services/retrievalService.js";
import { answerFromDocuments } from "../services/aiService.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);

chatRouter.post(
  "/",
  aiLimiter,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = chatSchema.parse(req.body);
    const claim = await getClaimById(body.claimId);
    if (!claim || claim.userId !== req.userId) {
      throw new AppError("NOT_FOUND", "Claim not found.", 404);
    }

    const docs = await getDocumentsByIds(claim.documentIds);
    const allChunks = buildChunksForDocuments(docs);
    const relevant = capChunksByChars(topChunks(body.message, allChunks, 6));

    const result = await answerFromDocuments({
      question: body.message,
      chunks: relevant,
      language: body.language,
    });

    await saveChatMessage({
      id: uuid(),
      claimId: claim.id,
      role: "user",
      content: body.message,
      sources: [],
      language: body.language,
      createdAt: new Date().toISOString(),
    });
    const assistantMsg = await saveChatMessage({
      id: uuid(),
      claimId: claim.id,
      role: "assistant",
      content: result.answer,
      sources: result.sources ?? [],
      language: body.language,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, data: { message: assistantMsg, foundInDocuments: result.foundInDocuments } });
  })
);

chatRouter.get(
  "/:claimId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const claim = await getClaimById(req.params.claimId);
    if (!claim || claim.userId !== req.userId) {
      throw new AppError("NOT_FOUND", "Claim not found.", 404);
    }
    const history = await getChatHistory(claim.id);
    res.json({ success: true, data: { messages: history } });
  })
);
