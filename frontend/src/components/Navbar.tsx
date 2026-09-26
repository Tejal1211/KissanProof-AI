import { Link, useNavigate } from "react-router-dom";
import { Sprout, Languages } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang, LANG_LABELS, type Lang } from "../i18n";

export function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();

  return (
    <header className="border-b border-kp-earth-100 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Primary">
        <Link to="/" className="flex items-center gap-2 font-semibold text-kp-green-900 focus-ring rounded">
          <Sprout className="h-6 w-6 text-kp-green-700" aria-hidden="true" />
          <span>KisanProof AI</span>
        </Link>

        {user && (
          <ul className="hidden items-center gap-6 text-sm font-medium text-kp-ink md:flex">
            <li>
              <Link className="hover:text-kp-green-700 focus-ring rounded" to="/dashboard">
                {t("dashboard")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-kp-green-700 focus-ring rounded" to="/documents">
                {t("documents")}
              </Link>
            </li>
            {user.role === "official" && (
              <li>
                <Link className="hover:text-kp-green-700 focus-ring rounded" to="/review">
                  Review Dashboard
                </Link>
              </li>
            )}
          </ul>
        )}

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center gap-1 text-sm text-kp-green-700">
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Choose language</span>
            <select
              className="focus-ring rounded border border-kp-earth-100 bg-white px-2 py-1 text-sm"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Select language"
            >
              {Object.entries(LANG_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {user ? (
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className="btn-primary">
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
