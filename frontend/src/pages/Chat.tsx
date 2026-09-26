import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useLang } from "../i18n";
import type { ChatMessage } from "../types";

const EXAMPLE_PROMPTS = [
  "What documents are required according to my uploaded policy?",
  "Why was this issue flagged?",
  "What deadline is mentioned?",
  "Summarize the claim procedure.",
];

export function Chat() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLang();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ messages: ChatMessage[] }>(`/chat/${id}`)
      .then((data) => setMessages(data.messages))
      .catch(() => null);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!id || !text.trim() || sending) return;
    setError(null);
    setSending(true);
    setInput("");
    // Optimistically show the user's message.
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, claimId: id, role: "user", content: text, sources: [], language: lang, createdAt: new Date().toISOString() },
    ]);
    try {
      const data = await api.post<{ message: ChatMessage; foundInDocuments: boolean }>("/chat", {
        claimId: id,
        message: text,
        language: lang,
      });
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't complete the analysis. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-3xl flex-col px-4 py-6">
      <h1 className="text-xl font-bold text-kp-green-900">Ask Your Document</h1>
      <p className="text-sm text-kp-ink/70">
        Answers are grounded in the documents you uploaded for this claim, with sources cited.
      </p>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button key={p} className="btn-secondary text-xs" onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div
        className="mt-4 flex-1 space-y-4 overflow-y-auto"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                m.role === "user" ? "bg-kp-green-700 text-white" : "bg-kp-green-50 text-kp-ink"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.sources.length > 0 && (
                <div className="mt-2 border-t border-white/30 pt-2 text-xs opacity-80">
                  <p className="font-medium">Sources</p>
                  <ul>
                    {m.sources.map((s, i) => (
                      <li key={i}>
                        {s.document}
                        {s.page ? `, page ${s.page}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {sending && <p className="sr-only" role="status">Preparing an answer from your documents</p>}

      {error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="chatInput" className="sr-only">
          Ask a question about your documents
        </label>
        <input
          id="chatInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents…"
          className="focus-ring flex-1 rounded-md border border-kp-earth-100 px-3 py-2"
        />
        <button type="submit" disabled={sending} className="btn-primary" aria-label="Send message">
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
