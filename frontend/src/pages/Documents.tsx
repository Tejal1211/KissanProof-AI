import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { StoredDocument } from "../types";

export function Documents() {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .get<{ documents: StoredDocument[] }>("/documents")
      .then((data) => setDocs(data.documents))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load documents."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    try {
      await api.del(`/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete this document.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-kp-green-900">Documents</h1>
      {loading && <p className="mt-4 text-kp-ink/70">Loading…</p>}
      {error && <p className="mt-4 text-red-700">{error}</p>}
      <div className="mt-6 space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-kp-green-900">{doc.originalName}</p>
              <p className="text-xs text-kp-ink/60">
                {(doc.sizeBytes / 1024).toFixed(0)} KB · {doc.status}
              </p>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              className="focus-ring rounded p-2 text-red-600 hover:bg-red-50"
              aria-label={`Delete ${doc.originalName}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {!loading && docs.length === 0 && <p className="text-sm text-kp-ink/60">No documents uploaded yet.</p>}
      </div>
    </div>
  );
}
