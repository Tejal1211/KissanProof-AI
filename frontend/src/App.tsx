import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { NewClaim } from "./pages/NewClaim";
import { ClaimReport } from "./pages/ClaimReport";
import { Chat } from "./pages/Chat";
import { Documents } from "./pages/Documents";
import { Review } from "./pages/Review";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claim/new"
            element={
              <ProtectedRoute>
                <NewClaim />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claim/:id"
            element={
              <ProtectedRoute>
                <ClaimReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claim/:id/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review"
            element={
              <ProtectedRoute requireRole="official">
                <Review />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:id"
            element={
              <ProtectedRoute requireRole="official">
                <ClaimReport />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
