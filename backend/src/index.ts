import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { documentsRouter } from "./routes/documents.js";
import { claimsRouter } from "./routes/claims.js";
import { chatRouter } from "./routes/chat.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// Generic rate limiting; AI-backed routes get a tighter limit below.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);
// AI-backed endpoints (analyze, chat) get the tighter limiter; it's applied
// inside claims.ts/chat.ts per-route so the rest of the router isn't throttled.
app.use("/api/claims", claimsRouter);
app.use("/api/chat", chatRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`KisanProof AI backend listening on port ${config.port}`);
});
