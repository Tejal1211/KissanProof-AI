# 🌾 KisanProof AI

**Prepare. Verify. Claim.**

Built for **PromptWars: Virtual (Exclusive Edition) — Hack2Skill**, problem statement: *AI for Legal Assistance & Access*.

## Problem

Farmers dealing with crop insurance claims, disaster compensation, agricultural subsidies, or government schemes
often struggle not with discovering a scheme, but with the paperwork itself: complicated requirements, confusing
documents, missing information, inconsistencies between forms, unclear deadlines, and government/legal
terminology — often across a language barrier.

## Solution

KisanProof AI helps farmers **prepare and understand their documentation before submitting** a claim. It never
decides eligibility, approves/rejects claims, or accuses anyone of anything. It identifies **"potential issues
that may require verification"** — with a plain-language explanation and a cited source — so the farmer can
resolve them with the right official, insurer, or legal-aid worker ahead of time.

## Innovation: the Claim Failure Simulator

The user uploads their documents and asks *"What could cause problems with my claim?"*. The system analyzes the
**actual extracted text** of the supplied documents (not a hardcoded rule for "cotton" or any other crop) and
surfaces missing information, document inconsistencies, unclear dates, evidence gaps, and ambiguous information —
each with a "why this was flagged," the evidence, a cited source (document + page), and a suggested verification
step.

## Legal boundary

KisanProof AI provides **general information and document assistance only**. It does not constitute legal
advice, determine eligibility, approve or reject claims, or replace a lawyer, insurer, government authority, or
agricultural professional. This disclaimer is shown on the landing page, every claim report, the chat interface,
and the footer.

## Challenge submission readiness

This project is built to satisfy the PromptWars evaluation requirements for a live GenAI prototype with clear
architectural visibility, legal safeguards, and demonstration flow.

For submission, provide a **public GitHub repository URL**. Confirm it opens without signing in and is under
10 MB before submitting. The platform permits at most **3 submissions**, so verify the repository URL and
public access before using a submission attempt.

| Requirement | Status in this repo | Evidence |
|---|---|---|
| Live URL | Not included | This submission requires a public GitHub repository link; deploy separately only if a live demo is requested |
| GitHub repo link | Pending publication | Publish this repository publicly and submit its URL; keep the uploaded repository under 10 MB |
| Project description | Included | Problem + solution + innovation sections above |
| GenAI architecture mapping | Included | Explicit architecture section below |
| Demo video | Ready to record | App supports live demo flow with no prefilled data |
| Legal boundary | Included | Disclaimer, boundary text, and APIs guarded by policy prompts |
| Safety / no fabricated legal advice | Included | All AI output is schema-validated and bounded by prompts |

### Project description (submission-ready summary)

KisanProof AI is an AI-powered document-preparation assistant for farmers dealing with crop insurance claims,
disaster compensation, subsidy applications, and related agricultural paperwork. It helps users upload their
supporting documents, compare extracted facts across forms, detect missing or conflicting information, and ask
questions grounded in the uploaded evidence before submitting a claim. The product reduces paperwork confusion,
helps users prepare questions for officials or legal aid workers, and improves the chance of a complete and
well-documented submission without pretending to replace legal advice.

### GenAI architecture mapping (explicit)

- Google Gemini — used as the default free-tier model for the backend AI generation flow.
  - Configured in `backend/src/config.ts`
  - Invoked in `backend/src/services/aiService.ts` via `callGemini()`
  - Used for structured claim analysis and document-grounded chat responses
- Anthropic Claude — retained as an alternative provider for compatibility.
  - Configured in `backend/src/config.ts`
  - Invoked in `backend/src/services/aiService.ts` via `callAnthropic()`
  - Used as fallback/alternative when `AI_PROVIDER=anthropic`
- Shared prompt logic — the legal safety rules and output schema are enforced in:
  - `backend/src/ai/prompts.ts`
  - `backend/src/validators/schemas.ts`

This is explicit integration, not an abstract claim: every AI-backed request goes through the backend service layer,
not the browser, and all outputs are constrained to JSON matching a strict schema.

### Demo walkthrough guidance

For the evaluation video, the recommended flow is:
1. Open landing page and explain the problem.
2. Sign up/log in.
3. Create a claim and upload 2-3 documents.
4. Trigger the analysis and show the generated readiness report.
5. Open the document Q&A and ask a question grounded in one uploaded document.
6. Call out the legal boundary and the fact that the AI is helping prepare information, not replacing professional advice.

This flow keeps the demo under 4 minutes and demonstrates the live GenAI output clearly.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + lucide-react icons |
| Backend | Node.js + Express + TypeScript |
| GenAI | **Google Gemini** by default, with optional Anthropic Claude support; called only from the backend |
| Storage (demo) | A local JSON file via `lowdb` — zero external infra needed to run this |
| Auth (demo) | JWT sessions (email/password, bcrypt-hashed) — see "Swapping in Firebase" below |
| Validation | `zod`, on both request bodies and **AI output** |
| Document parsing | `pdf-parse` for PDFs; plain read for `.txt`; images tracked but not OCR'd (see Limitations) |
| Testing | `vitest` (backend unit tests) |

## GenAI architecture

```
Frontend (React)
   |  fetch, Bearer JWT
   v
Backend API (Express)
   |
   +- Document Processing  -> pdf-parse extracts text per page, then chunked (1200 chars, 150 overlap)
   |
   +- Retrieval            -> keyword-ranked chunk scoring (services/retrievalService.ts), capped to a
   |                          char budget so a full document is never resent to the model per question.
   |                          (Swap point for real embeddings - see comment in that file.)
   |
  +- Claim Analysis        -> services/aiService.ts -> Google Gemini (or configured Anthropic Claude), with a system/task prompt
   |   (Failure Simulator,      (ai/prompts.ts) that forbids eligibility verdicts, fraud accusations,
   |    Consistency Engine,      and fabricated rules/deadlines, and requires a source citation for every
   |    Readiness Report)        document-grounded claim.
   |
   +- Document Q&A (RAG)    -> same aiService, given only the top retrieved chunks; if the answer isn't
   |                          in the retrieved text, the model is instructed to say so rather than guess.
   |
   +- Structured output     -> every AI call must return JSON matching a zod schema (validators/schemas.ts).
   |                          Invalid output triggers one retry with a stricter reminder, then a safe
   |                          AppError (never a raw crash) if it still doesn't validate.
   |
  +- Multilingual          -> the same prompts ask the configured model to respond in English/Hindi/Marathi based on a
                              language parameter - there is no hardcoded translation table for AI text.
```

**Where GenAI is integrated, exactly:**
- `backend/src/services/aiService.ts` — the only place that calls the Gemini or Anthropic API.
- `backend/src/ai/prompts.ts` — the system rules and task prompts sent with every call.
- Invoked from `POST /api/claims/:id/analyze` (Claim Readiness + Failure Simulator + Consistency Engine +
  Important Dates + Questions for Professional, all in one structured response) and `POST /api/chat` (RAG Q&A).

## Project structure

```
kisanproof-ai/
  backend/
    src/
      index.ts             Express app entry point
      config.ts             env var loading
      db.ts                 JSON-file storage adapter (swap point for Firestore)
      types.ts               shared TS types
      middleware/            auth (JWT), error handler, upload validation, rate limiting
      validators/            zod schemas for requests AND ai output
      services/               aiService, documentService, retrievalService, consistencyService
      ai/prompts.ts           GenAI system + task prompts
      routes/                 auth, documents, claims, chat
    tests/                    vitest unit tests (40 tests, all real assertions)
    .env.example
  frontend/
    src/
      pages/                  Landing, Login, Dashboard, NewClaim, ClaimReport, Chat, Documents, Review,
                               Privacy, Terms
      components/             Navbar, Footer, DisclaimerBanner, ProtectedRoute
      context/AuthContext.tsx
      i18n/                   English/Hindi/Marathi UI strings + language switcher
      lib/api.ts              fetch wrapper with Bearer token handling
  .gitignore
  README.md   (this file)
```

## Local setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set GEMINI_API_KEY (https://aistudio.google.com/app/apikey) or ANTHROPIC_API_KEY, then set JWT_SECRET (e.g. `openssl rand -hex 32`)
npm run dev        # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to localhost:4000
```

Open `http://localhost:5173`, sign up, start a claim, upload a document, and run analysis. Without
`GEMINI_API_KEY` or `ANTHROPIC_API_KEY` set, analysis and chat return a clear `AI_NOT_CONFIGURED` error instead of crashing or faking
a response — every other part of the app (auth, upload, document list) still works.

### Environment variables

See `backend/.env.example`:

```
AI_PROVIDER=gemini        # or anthropic
GEMINI_API_KEY=           # optional if using the free Google Gemini tier
GEMINI_MODEL=gemini-3.8-flash
ANTHROPIC_API_KEY=        # optional if using Anthropic instead
ANTHROPIC_MODEL=claude-sonnet-4-6
JWT_SECRET=               # required in production; random long string
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATA_DIR=./data
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_CLAIM=8
```

## Deploy to Google Cloud Run

The root `Dockerfile` builds the frontend and backend into one service, so the public web app and `/api` share
the same origin. Before deploying, enable billing for your Google Cloud project, enable Cloud Run, Cloud Build,
Artifact Registry, and Secret Manager APIs, rotate any previously exposed Gemini key, and create Secret Manager
versions named `GEMINI_API_KEY` and `JWT_SECRET`. The Cloud Run runtime service account needs
`roles/secretmanager.secretAccessor` on those secrets. Never put secret values in this repository or Docker image.

From the repository root, deploy with:

```powershell
gcloud run deploy kisanproof-ai --source . --region us-central1 --allow-unauthenticated --min 0 --max 1 --set-env-vars "NODE_ENV=production,AI_PROVIDER=gemini,GEMINI_MODEL=gemini-3.8-flash,DATA_DIR=/tmp/kisanproof-data" --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,JWT_SECRET=JWT_SECRET:latest"
```

Cloud Run prints the public service URL when deployment completes. Verify it by opening that URL and appending
`/api/health`. This demo stores accounts, claims, and uploads on the container's ephemeral filesystem; data can
be lost when Cloud Run replaces an instance. Do not use this deployment for real sensitive documents or
reliable long-term storage until the storage adapter is migrated to Firestore and Cloud Storage.

## API reference (summary)

All responses: `{ "success": true, "data": {...} }` or `{ "success": false, "error": { "code", "message" } }`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | - | Create account |
| POST | `/api/auth/login` | - | Log in |
| POST | `/api/documents/upload` | yes | Upload files (multipart) |
| POST | `/api/documents/process` | yes | Extract text from uploaded documents |
| GET/DELETE | `/api/documents[/:id]` | yes | List / delete documents |
| POST | `/api/claims` | yes | Create a claim |
| GET | `/api/claims` or `/api/claims/:id` | yes | List / fetch a claim (+ evidence checklist) |
| POST | `/api/claims/:id/analyze` | yes | Run GenAI analysis (rate-limited) |
| GET | `/api/claims/review/queue`, `/review/insights` | yes (official) | Demo review dashboard data |
| POST | `/api/chat` | yes | RAG question about a claim's documents (rate-limited) |
| GET | `/api/chat/:claimId` | yes | Chat history |

## Testing

```bash
cd backend
npm run lint     # tsc --noEmit
npm test         # vitest - 40 tests covering config security, chunking, retrieval capping, evidence-checklist logic,
                 # and AI-output schema validation (including that an invented "eligible" status is rejected)

cd ../frontend
npm run lint     # tsc --noEmit
npm run build    # production build
```

Both backend and frontend type checks pass; the backend test suite has 40 passing tests, and both production
builds complete successfully.

## Security

- Server-side-only API keys; nothing secret ships to the browser.
- JWT-based session auth; every claim/document/chat route checks `req.userId` ownership.
- Multer size/count and filename/header validation, followed by byte-signature or UTF-8 content checks before
  database insertion; content mismatches are deleted from temporary upload storage.
- Zod validation on every request body **and** on AI output (invalid AI JSON is retried once, then a controlled
  error — never a crash, never silently fabricated data).
- Rate limiting: 300 req/15 min generally, 12 req/min on the two AI-backed routes.
- Generic error messages to the client (`"Unable to process this document. Please try again."`); full detail
  logged server-side only, never in the HTTP response.
- CORS restricted to `CORS_ORIGIN`.

## Accessibility

Semantic headings and landmarks, labeled form fields, visible focus rings (`.focus-ring` utility used
throughout), `aria-live` on the chat log, `role="progressbar"` on the readiness meter, keyboard-operable file
picker and buttons, status/severity shown with both color *and* text/icon (not color alone), responsive layout
with no horizontal scroll from 320px up.

## Multilingual support

English, Hindi, and Marathi. The UI chrome (nav labels, dashboard cards, disclaimer) is translated via
`frontend/src/i18n`. AI-generated text (claim summaries, issue explanations, chat answers) is produced **directly
by the configured Gemini or Anthropic model** in the selected language via the prompt in `ai/prompts.ts` — there is no hardcoded/faked translation
table for AI output, per the spec.

## Voice input

Uses the browser's native `SpeechRecognition` API (Chrome/Edge) as a progressive enhancement on the "Event /
problem description" field in the New Claim wizard, with a text fallback and editable transcript. Not supported
in all browsers; the UI degrades to a clear message rather than failing silently.

## Known limitations

- **Retrieval is keyword-based, not semantic.** This keeps the app dependency-free to run, but a production
  version should add an embedding index (see the comment at the top of `retrievalService.ts` for the exact swap
  point — nothing else in the app needs to change).
- **Images are not OCR'd.** Uploaded photos are tracked for the Evidence Checklist ("Damage photo — Found") but
  their visual content isn't analyzed by the AI in this build.
- **PDF page splitting** relies on `pdf-parse`'s form-feed page breaks, which not all PDF producers emit; when
  absent, a PDF is treated as one page rather than mis-numbered pages.
- **Storage is a local JSON file**, intentionally, so the whole app runs with zero external infrastructure. See
  "Swapping in Firestore" below for the production path.
- **Auth is JWT/email-password**, not Firebase, for the same zero-infra reason. See "Swapping in Firebase" below.
- No PDF export of the claim report, and no automated frontend/E2E test suite — flagged as P2/stretch in the
  original spec and left as a follow-up rather than faked.
- Deployment configuration (below) is provided but this repo has not been deployed to a live URL from this
  environment — you'll need your own Anthropic API key and hosting accounts to do that.

### Swapping in Firestore

Every route/service only calls the functions exported from `backend/src/db.ts` (`saveClaim`, `getClaimById`,
etc.). To move to Firestore: reimplement those same function signatures using `firebase-admin`'s Firestore SDK,
with security rules restricting each collection (`users`, `claims`, `documents`, `chatSessions`) to
`request.auth.uid == resource.data.userId`. No route code changes.

### Swapping in Firebase Auth

`backend/src/middleware/auth.ts` documents this inline: replace the JWT `verify` call with
`admin.auth().verifyIdToken(token)` and set `req.userId` from the returned `uid`. The frontend would then use the
Firebase JS SDK's Google/email sign-in instead of `POST /api/auth/login`.

## Deployment

- **Frontend**: `npm run build` in `frontend/` → deploy `frontend/dist` to Vercel, Netlify, or Firebase Hosting.
- **Backend**: deploy `backend/` to Render, Railway, or Cloud Run. Set `ANTHROPIC_API_KEY`, `JWT_SECRET`, and
  `CORS_ORIGIN` (your deployed frontend URL) as environment variables on the host — never in source control.
- **Database**: the JSON-file store works for a single-instance demo deployment; for anything beyond that,
  complete the Firestore swap above so data survives redeploys/restarts and scales across instances.
- Point the frontend at your deployed backend URL in production instead of `localhost:4000` (update the Vite
  proxy or introduce a `VITE_API_BASE` env var and use it in `lib/api.ts`).

## Demo flow (~4 minutes)

1. Landing page → "Check My Claim."
2. New Claim → Crop Insurance → Cotton, Nagpur, heavy rainfall.
3. Upload a sample insurance policy and application form live (with a deliberately mismatched farm-area figure
   between the two, to demonstrate the Consistency Engine finding it from the actual text — not a hardcoded rule).
4. Run analysis → show Claim Readiness, Important Dates, and the Claim Failure Simulator.
5. Open "Ask Your Document," ask a question, show the cited answer.
6. Switch language to Marathi, ask the same question, show the localized AI answer.
7. Log out, use "Continue to Official Review Dashboard (demo)," show the anonymized queue and insights.
8. Point to the disclaimer in the footer/report.

## GitHub / submission checklist

- [ ] `.env` is **not** committed (only `.env.example`); confirm with `git status` before pushing.
- [ ] `backend/data/` (local JSON store + uploads) is gitignored — confirm it's empty or absent before committing.
- [ ] Run `du -sh .` after removing `node_modules`/`dist` to confirm the repo is under 10 MB.
- [ ] Set `ANTHROPIC_API_KEY` and `JWT_SECRET` on your deployment host, not in the repo.
- [ ] Update the deployed frontend/backend URLs into this README before submitting.
