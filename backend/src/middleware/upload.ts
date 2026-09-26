import multer from "multer";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { config } from "../config.js";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "text/plain"]);
const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png", ".txt"]);

const storage = multer.diskStorage({
  destination: path.join(config.dataDir, "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    // Reject silently with a controlled error rather than executing/storing it.
    return cb(new Error("UNSUPPORTED_FILE_TYPE"));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
    files: config.maxFilesPerClaim,
  },
});
