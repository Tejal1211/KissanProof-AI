import { Link } from "react-router-dom";
import { FileSearch, ShieldCheck, Languages, MessageSquareText, Landmark, Sprout } from "lucide-react";
import { DisclaimerBanner } from "../components/DisclaimerBanner";

const FEATURES = [
  {
    icon: FileSearch,
    title: "Claim Failure Simulator",
    body: "See what could require verification before you submit — missing information, document inconsistencies, unclear dates — each with a source and a suggested next step.",
  },
  {
    icon: ShieldCheck,
    title: "Document consistency checks",
    body: "Compares farm area, dates, and other details across your uploaded documents and flags where they don't match.",
  },
  {
    icon: MessageSquareText,
    title: "Ask Your Document",
    body: "Ask questions in plain language and get answers grounded in your own documents, with page-level citations.",
  },
  {
    icon: Languages,
    title: "English, Hindi, Marathi",
    body: "Use the app and talk to the AI assistant in the language you're most comfortable with.",
  },
];

export function Landing() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-kp-green-50 px-3 py-1 text-xs font-medium text-kp-green-700">
            <Sprout className="h-3.5 w-3.5" aria-hidden="true" /> Prepare. Verify. Claim.
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-kp-green-900 md:text-5xl">
            Don't let paperwork become the reason your claim gets delayed.
          </h1>
          <p className="mt-5 text-base text-kp-ink/80 md:text-lg">
            KisanProof AI helps farmers understand claim requirements, identify missing information, compare
            documents, and prepare questions before submitting agriculture-related claims.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary px-6 py-3 text-base">
              Check My Claim
            </Link>
            <a href="#how-it-works" className="btn-secondary px-6 py-3 text-base">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-kp-green-900">How it works</h2>
        <ol className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-4">
          {[
            ["1. Select claim type", "Crop insurance, disaster compensation, subsidy, or scheme."],
            ["2. Upload documents", "Insurance policy, land record, application form, evidence."],
            ["3. Review your report", "See readiness, flagged issues, dates, and evidence gaps."],
            ["4. Ask & prepare", "Ask your documents questions and get ready before submission."],
          ].map(([title, body]) => (
            <li key={title} className="card">
              <p className="font-semibold text-kp-green-900">{title}</p>
              <p className="mt-1 text-sm text-kp-ink/80">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-kp-green-900">Key features</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card flex gap-4">
              <Icon className="h-6 w-6 flex-shrink-0 text-kp-green-700" aria-hidden="true" />
              <div>
                <p className="font-semibold text-kp-green-900">{title}</p>
                <p className="mt-1 text-sm text-kp-ink/80">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="card bg-kp-green-50/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kp-green-700">Submission-ready</p>
              <h2 className="mt-2 text-2xl font-bold text-kp-green-900">AI architecture and legal boundary are built in</h2>
            </div>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-kp-green-700 ring-1 ring-kp-green-200">
              Gemini + Claude fallback
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-kp-earth-200 bg-white p-4">
              <p className="font-semibold text-kp-green-900">GenAI used</p>
              <p className="mt-2 text-sm text-kp-ink/80">Google Gemini is the default model, with Anthropic Claude available as a fallback provider.</p>
            </div>
            <div className="rounded-xl border border-kp-earth-200 bg-white p-4">
              <p className="font-semibold text-kp-green-900">Where it is integrated</p>
              <p className="mt-2 text-sm text-kp-ink/80">Backend AI orchestration in the analysis and chat routes, with strict schema validation on every model response.</p>
            </div>
            <div className="rounded-xl border border-kp-earth-200 bg-white p-4">
              <p className="font-semibold text-kp-green-900">Safety guardrails</p>
              <p className="mt-2 text-sm text-kp-ink/80">The app never claims legal advice, never decides eligibility, and always points users to verification with a professional.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="card md:flex md:items-start md:gap-6">
          <Landmark className="h-6 w-6 flex-shrink-0 text-kp-green-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-bold text-kp-green-900">Why it matters</h2>
            <p className="mt-2 text-sm text-kp-ink/80">
              Many claim delays don't come from ineligibility — they come from paperwork issues discovered too late:
              a missing document, a date that doesn't match, an area figure that differs between forms. KisanProof
              AI surfaces these before submission, so farmers can verify them with the right authority ahead of
              time, and officials spend less time on back-and-forth clarification.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-kp-green-900">Frequently asked questions</h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          {[
            [
              "Does KisanProof AI decide if my claim will be approved?",
              "No. It never determines eligibility or approves/rejects claims. It only helps you prepare and identify things worth verifying.",
            ],
            [
              "Where do the answers come from?",
              "From the documents you upload. If something isn't in your documents, the assistant says so instead of guessing.",
            ],
            [
              "Is my data kept private?",
              "Your documents and claims are only visible to you (and, for the demo review dashboard, to the anonymized aggregate view). See our Privacy page for details.",
            ],
          ].map(([q, a]) => (
            <div key={q} className="card">
              <p className="font-semibold text-kp-green-900">{q}</p>
              <p className="mt-1 text-sm text-kp-ink/80">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <DisclaimerBanner />
      </section>
    </div>
  );
}
