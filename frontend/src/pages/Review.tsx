import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface QueueItem {
  id: string;
  claimType: string;
  crop: string;
  readiness: { status: string; completeness: number } | null;
  issueCount: number;
  missingCount: number;
  status: string;
}

interface Insight {
  type: string;
  count: number;
  percent: number;
}

export function Review() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ queue: QueueItem[] }>("/claims/review/queue"),
      api.get<{ breakdown: Insight[] }>("/claims/review/insights"),
    ])
      .then(([q, i]) => {
        setQueue(q.queue);
        setInsights(i.breakdown);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-md bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
        Demonstration data — not real government records.
      </div>
      <h1 className="mt-4 text-2xl font-bold text-kp-green-900">Review Queue</h1>

      {loading && <p className="mt-4 text-kp-ink/70">Loading…</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-kp-earth-100 text-kp-ink/60">
              <th className="py-2 pr-4">Claim</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Readiness</th>
              <th className="py-2 pr-4">Issues</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id} className="border-b border-kp-earth-100/60">
                <td className="py-2 pr-4 font-mono text-xs">{item.id.slice(0, 8)}</td>
                <td className="py-2 pr-4">{item.crop || "—"}</td>
                <td className="py-2 pr-4">{item.readiness?.completeness ?? "—"}%</td>
                <td className="py-2 pr-4">{item.issueCount}</td>
                <td className="py-2 pr-4">
                  <span className="rounded-full bg-kp-green-50 px-2 py-0.5 text-xs font-medium text-kp-green-700">
                    {item.status}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <Link to={`/review/${item.id}`} className="font-medium text-kp-green-700 hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && queue.length === 0 && (
          <p className="mt-4 text-sm text-kp-ink/60">No analyzed claims yet in this demo environment.</p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-kp-green-900">Common Application Issues</h2>
      <div className="mt-3 space-y-2">
        {insights.map((i) => (
          <div key={i.type} className="flex items-center gap-3 text-sm">
            <span className="w-48 shrink-0">{i.type.replace(/_/g, " ")}</span>
            <div className="h-2 flex-1 rounded-full bg-kp-green-50">
              <div className="h-2 rounded-full bg-kp-green-700" style={{ width: `${i.percent}%` }} />
            </div>
            <span className="w-10 text-right">{i.percent}%</span>
          </div>
        ))}
        {insights.length === 0 && !loading && (
          <p className="text-sm text-kp-ink/60">Not enough analyzed claims yet to show a pattern.</p>
        )}
      </div>
      <p className="mt-4 rounded-md bg-kp-green-50 px-3 py-2 text-xs text-kp-ink/70">
        AI-generated operational insight requiring human review — not a finding about any individual claim.
      </p>
    </div>
  );
}
