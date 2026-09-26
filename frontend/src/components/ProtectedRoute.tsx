import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: JSX.Element;
  requireRole?: "farmer" | "official";
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-kp-ink/70" role="status">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/dashboard" replace />;

  return children;
}
