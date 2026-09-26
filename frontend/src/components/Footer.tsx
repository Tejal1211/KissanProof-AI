import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-kp-earth-100 bg-kp-green-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-kp-ink">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-semibold text-kp-green-900">KisanProof AI</p>
            <p className="mt-1 max-w-sm text-kp-ink/80">AI-powered document assistance for agricultural claims.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <Link className="hover:text-kp-green-700 focus-ring rounded" to="/#how-it-works">
              How it works
            </Link>
            <Link className="hover:text-kp-green-700 focus-ring rounded" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-kp-green-700 focus-ring rounded" to="/terms">
              Terms
            </Link>
            <Link className="hover:text-kp-green-700 focus-ring rounded" to="/terms#disclaimer">
              Disclaimer
            </Link>
          </nav>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-kp-ink/70">
          This tool provides general information and document assistance based on the information and documents
          provided by the user. It does not constitute legal advice, determine eligibility, approve or reject
          claims, or replace a qualified lawyer, insurer, government authority, or agricultural professional. Users
          should verify important requirements and decisions with the relevant authority. Not affiliated with, and
          does not use logos of, any government body.
        </p>
        <p className="mt-4 text-xs text-kp-ink/60">Built for PromptWars: Virtual (Exclusive Edition) — Hack2Skill</p>
      </div>
    </footer>
  );
}
