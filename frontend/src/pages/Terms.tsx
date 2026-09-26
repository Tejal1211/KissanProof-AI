import { DisclaimerBanner } from "../components/DisclaimerBanner";

export function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-kp-ink/80">
      <h1 className="text-2xl font-bold text-kp-green-900">Terms</h1>
      <p className="mt-4">
        KisanProof AI is provided as a hackathon prototype ("PromptWars: Virtual (Exclusive Edition) — Hack2Skill")
        for demonstration purposes. It is provided as-is, without warranty, and should not be relied upon as a
        substitute for professional legal, insurance, or governmental advice.
      </p>
      <h2 id="disclaimer" className="mt-8 text-lg font-semibold text-kp-green-900">
        Legal Disclaimer
      </h2>
      <div className="mt-3">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
