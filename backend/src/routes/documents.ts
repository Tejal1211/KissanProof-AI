import { Router } from "express";
import fs from "node:fs/promises";
import { v4 as uuid } from "uuid";
import { upload } from "../middleware/upload.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { saveDocument, updateDocument, getDocumentsByUser, deleteDocument, getDocumentsByIds } from "../db.js";
import { extractText } from "../services/documentService.js";
import { isSupportedDocumentContent } from "../services/uploadValidationService.js";
import type { StoredDocument } from "../types.js";

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

documentsRouter.post(
  "/upload",
  (req, res, next) => {
    upload.array("files")(req, res, (err) => {
      if (err) {
        const code = err.message === "UNSUPPORTED_FILE_TYPE" ? "UNSUPPORTED_FILE_TYPE" : "UPLOAD_FAILED";
        const message =
          code === "UNSUPPORTED_FILE_TYPE"
            ? "One of the files isn't a supported type (PDF, JPG, PNG, or TXT)."
            : "One of the files is too large or there are too many files.";
        return res.status(400).json({ success: false, error: { code, message } });
      }
      const files = (req.files as Express.Multer.File[]) ?? [];
      void (async () => {
        try {
          for (const file of files) {
            const content = await fs.readFile(file.path);
            if (!(await isSupportedDocumentContent(file.originalname, file.mimetype, content))) {
              throw new Error("UNSUPPORTED_FILE_TYPE");
            }
          }
          next();
        } catch {
          await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
          res.status(400).json({
            success: false,
            error: {
              code: "UNSUPPORTED_FILE_TYPE",
              message: "One of the files doesn't match its supported file type.",
            },
          });
        }
      })();
    });
  },
  asyncHandler(async (req: AuthedRequest, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      throw new AppError("NO_FILES", "Please attach at least one file.", 400);
    }
    const saved: StoredDocument[] = [];
    for (const file of files) {
      const doc: StoredDocument = {
        id: uuid(),
        userId: req.userId!,
        claimId: null,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath: file.path,
        extractedText: null,
        pages: null,
        status: "uploaded",
        error: null,
        createdAt: new Date().toISOString(),
      };
      await saveDocument(doc);
      saved.push(doc);
    }
    res.status(201).json({ success: true, data: { documents: saved } });
  })
);

documentsRouter.post(
  "/process",
  asyncHandler(async (req: AuthedRequest, res) => {
    const ids: string[] = req.body?.documentIds ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError("NO_DOCUMENT_IDS", "No documents specified for processing.", 400);
    }
    const docs = await getDocumentsByIds(ids);
    const results = [];
    for (const doc of docs) {
      if (doc.userId !== req.userId) continue; // never process another user's file
      await updateDocument(doc.id, { status: "processing" });
      try {
        const pages = await extractText(doc);
        const updated = await updateDocument(doc.id, {
          status: "processed",
          pages,
          extractedText: pages.map((p) => p.text).join("\n\n"),
        });
        results.push(updated);
      } catch (err) {
        console.error(`Document processing failed for ${doc.id}:`, err);
        const updated = await updateDocument(doc.id, {
          status: "failed",
          error: "EXTRACTION_FAILED",
        });
        results.push(updated);
      }
    }
    res.json({ success: true, data: { documents: results } });
  })
);

documentsRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const docs = await getDocumentsByUser(req.userId!);
    res.json({ success: true, data: { documents: docs } });
  })
);

documentsRouter.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const ok = await deleteDocument(req.params.id, req.userId!);
    if (!ok) throw new AppError("NOT_FOUND", "Document not found.", 404);
    res.json({ success: true, data: {} });
  })
);
