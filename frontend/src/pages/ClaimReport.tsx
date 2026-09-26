import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, XCircle, CalendarClock, MessageSquareText, HelpCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { DisclaimerBanner } from "../components/DisclaimerBanner";
import type { Claim, ClaimIssue, EvidenceChecklistItem } from "../types";

const ISSUE_LABELS: Record<ClaimIssue["type"], string> = {
  missing_information: "Missing Information",
  document_inconsistency: "Document Inconsistency",
  important_requirement: "Important Requirement",
  date_deadline: "Date / Deadline",
  evidence_gap: "Evidence Gap",
  ambiguous_information: "Ambiguous Information",
};

const SEVERITY_STYLE: Record<ClaimIssue["severity"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical_review: "border-red-200 bg-red-50 text-red-800",
};

export function ClaimReport() {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [evidence, setEvidence] = useState<EvidenceChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ claim: Claim; evidenceChecklist: EvidenceChecklistItem[] }>(`/claims/${id}`)
      .then((data) => {
        setClaim(data.claim);
        setEvidence(data.evidenceChecklist);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load this claim."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="mx-auto max-w-4xl px-4 py-10 text-kp-ink/70">Loading your report…</p>;
  if (error) return <p className="mx-auto max-w-4xl px-4 py-10 text-red-700">{error}</p>;
  if (!claim) return null;

  const analysis = claim.analysis;

  if (!analysis) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-kp-ink/80">
          This claim hasn't been analyzed yet, or analysis is still in progress. Status: {claim.status}.
        </p>
      </div>
    );
  }

  const consistencyIssues = analysis.issues.filter((i) => i.type === "document_inconsistency");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-kp-green-900">Claim Readiness</h1>
        <Link to={`/claim/${claim.id}/chat`} className="btn-secondary">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" /> Ask Your Document
        </Link>
      </div>

      {/* Readiness score */}
      <section className="card mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-kp-ink/70">Documentation Readiness</p>
          <span className="text-2xl font-bold text-kp-green-900">{analysis.readiness.completeness}%</span>
        </div>
        <div
          className="mt-2 h-2 w-full rounded-full bg-kp-green-50"
          role="progressbar"
          aria-valuenow={analysis.readiness.completeness}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-2 rounded-full bg-kp-green-700" style={{ width: `${analysis.readiness.completeness}%` }} />
        </div>
        <p className="mt-2 text-xs text-kp-ink/60">Preparation completeness — not official eligibility.</p>
        <p className="mt-3 text-sm text-kp-ink/80">{analysis.summary}</p>
      </section>

      {/* Found / needs verification / missing */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <InfoList icon={CheckCircle2} color="text-kp-green-700" title="Information Found" items={analysis.informationFound} />
        <InfoList icon={AlertTriangle} color="text-amber-600" title="Needs Verification" items={analysis.needsVerification} />
        <InfoList icon={XCircle} color="text-red-600" title="Missing Information" items={analysis.missingInformation} />
      </div>

      {/* Important dates */}
      {analysis.deadlines.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-kp-green-900">
            <CalendarClock className="h-5 w-5" aria-hidden="true" /> Important Dates
          </h2>
          <div className="mt-3 space-y-2">
            {analysis.deadlines.map((d, i) => (
              <div key={i} className="card flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-kp-green-900">{d.date}</p>
                  <p className="text-sm text-kp-ink/70">{d.description}</p>
                </div>
                <p className="text-xs text-kp-ink/50">
                  Source: {d.source.document}
                  {d.source.page ? `, page ${d.source.page}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Claim Failure Simulator */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-kp-green-900">🔍 What Could Cause Problems With My Claim?</h2>
        {analysis.issues.length === 0 ? (
          <p className="mt-3 text-sm text-kp-ink/70">
            No potential issues were identified from the documents you supplied. This does not guarantee approval —
            please still confirm requirements with the relevant authority.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {analysis.issues.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
          </div>
        )}
      </section>

      {/* Document consistency engine (subset view) */}
      {consistencyIssues.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-kp-green-900">Document Consistency Check</h2>
          <p className="mt-1 text-sm text-kp-ink/70">
            Values that differ across your uploaded documents. KisanProof AI never decides which value is correct.
          </p>
          <div className="mt-3 space-y-3">
            {consistencyIssues.map((issue, i) => (
              <div key={i} className="card border-amber-200 bg-amber-50">
                <p className="font-medium text-amber-900">⚠️ {issue.title}</p>
                <p className="mt-1 text-sm text-amber-900/80">{issue.evidence}</p>
                <p className="mt-1 text-xs text-amber-900/60">Verify before submission.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evidence checklist */}
      {evidence.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-kp-green-900">Evidence Checklist</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {evidence.map((item) => (
              <li key={item.label} className="card flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <StatusPill status={item.status} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-kp-ink/60">
            Visible information may be relevant evidence, but official verification is required.
          </p>
        </section>
      )}

      {/* Questions for official/lawyer */}
      {analysis.questionsForProfessional.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-kp-green-900">
            <HelpCircle className="h-5 w-5" aria-hidden="true" /> Questions You May Want to Ask
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-kp-ink/80">
            {analysis.questionsForProfessional.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-10">
        <DisclaimerBanner />
      </div>
    </div>
  );
}

function InfoList({
  icon: Icon,
  color,
  title,
  items,
}: {
  icon: typeof CheckCircle2;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="card">
      <p className={`flex items-center gap-2 font-semibold ${color}`}>
        <Icon className="h-4 w-4" aria-hidden="true" /> {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-kp-ink/50">None noted.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-kp-ink/80">
          {items.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IssueCard({ issue }: { issue: ClaimIssue }) {
  return (
    <div className={`card border ${SEVERITY_STYLE[issue.severity]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{ISSUE_LABELS[issue.type]}</p>
      <p className="mt-1 font-semibold">⚠️ {issue.title}</p>
      <p className="mt-2 text-sm">
        <span className="font-medium">Why flagged: </span>
        {issue.explanation}
      </p>
      <p className="mt-1 text-sm">
        <span className="font-medium">Evidence: </span>
        {issue.evidence}
      </p>
      <p className="mt-1 text-sm">
        <span className="font-medium">What to verify: </span>
        {issue.recommendedVerification}
      </p>
      {issue.sources.length > 0 && (
        <p className="mt-2 text-xs opacity-70">
          Source: {issue.sources.map((s) => `${s.document}${s.page ? ` (p.${s.page})` : ""}`).join("; ")}
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: EvidenceChecklistItem["status"] }) {
  const map = {
    found: { label: "Found", cls: "bg-kp-green-50 text-kp-green-700" },
    not_verified: { label: "Not verified", cls: "bg-amber-50 text-amber-700" },
    missing: { label: "Missing", cls: "bg-red-50 text-red-700" },
  } as const;
  const { label, cls } = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
