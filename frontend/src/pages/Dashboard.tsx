import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useLang } from "../i18n";
import type { Claim } from "../types";

export function Dashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { t } = useLang();

  useEffect(() => {
    api
      .get<{ claims: Claim[] }>("/claims")
      .then((data) => setClaims(data.claims))
      .catch(() => setLoadError("Unable to load your claims. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const issueCount = claims.reduce((sum, c) => sum + (c.analysis?.issues.length ?? 0), 0);
  const readyCount = claims.filter((c) => c.analysis && c.analysis.issues.length === 0).length;
  const docCount = claims.reduce((sum, c) => sum + c.documentIds.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-kp-green-900">{t("dashboard")}</h1>
        <Link to="/claim/new" className="btn-primary">
          {t("startNewClaim")}
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("activeClaims")} value={claims.length} />
        <StatCard label={t("documents")} value={docCount} />
        <StatCard label={t("potentialIssues")} value={issueCount} />
        <StatCard label={t("readyToSubmit")} value={readyCount} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-kp-green-900">Recent claims</h2>
        {loading && <p className="mt-4 text-sm text-kp-ink/70">Loading your claims…</p>}
        {loadError && <p className="mt-4 text-sm text-red-700">{loadError}</p>}
        {!loading && !loadError && claims.length === 0 && (
          <p className="mt-4 text-sm text-kp-ink/70">
            You haven't started a claim yet.{" "}
            <Link to="/claim/new" className="font-medium text-kp-green-700 hover:underline">
              Start your first one
            </Link>
            .
          </p>
        )}
        <div className="mt-4 space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-kp-green-900">
                  {formatClaimType(claim.claimType)} — {claim.crop || "Unspecified crop"}
                </p>
                <p className="text-xs text-kp-ink/60">
                  Created {new Date(claim.createdAt).toLocaleDateString()} · {claim.status}
                  {claim.analysis ? ` · ${claim.analysis.issues.length} issue(s) to verify` : ""}
                </p>
              </div>
              <Link to={`/claim/${claim.id}`} className="btn-secondary self-start sm:self-auto">
                View Report
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-3xl font-bold text-kp-green-900">{value}</p>
      <p className="mt-1 text-sm text-kp-ink/70">{label}</p>
    </div>
  );
}

function formatClaimType(type: Claim["claimType"]) {
  return (
    {
      crop_insurance: "Crop Insurance",
      disaster_compensation: "Disaster Compensation",
      agricultural_subsidy: "Agricultural Subsidy",
      government_scheme: "Government Scheme",
      other: "Other Claim",
    } as const
  )[type];
}
