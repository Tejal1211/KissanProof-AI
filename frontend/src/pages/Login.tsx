import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, loginAsDemoOfficial } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoOfficial() {
    setError(null);
    try {
      await loginAsDemoOfficial();
      navigate("/review");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-kp-green-900">{mode === "login" ? "Log in" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-kp-ink/70">
        {mode === "login" ? "Welcome back to KisanProof AI." : "It takes less than a minute."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-kp-ink">
              Full name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-kp-earth-100 px-3 py-2"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-kp-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1 w-full rounded-md border border-kp-earth-100 px-3 py-2"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-kp-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring mt-1 w-full rounded-md border border-kp-earth-100 px-3 py-2"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <button
        className="mt-4 text-sm font-medium text-kp-green-700 hover:underline focus-ring rounded"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>

      <div className="mt-8 border-t border-kp-earth-100 pt-6">
        <p className="text-xs text-kp-ink/60">Evaluator / official reviewer demo:</p>
        <button className="btn-secondary mt-2 w-full" onClick={handleDemoOfficial}>
          Continue to Official Review Dashboard (demo)
        </button>
      </div>
    </div>
  );
}
