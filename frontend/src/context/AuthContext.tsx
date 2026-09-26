import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, getStoredToken } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "official";
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginAsDemoOfficial: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "kp_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const stored = localStorage.getItem(USER_KEY);
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  function persist(token: string, user: User) {
    setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
  }

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    persist(data.token, data.user);
  }

  async function signup(name: string, email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/auth/signup", { name, email, password });
    persist(data.token, data.user);
  }

  async function loginAsDemoOfficial() {
    const data = await api.post<{ token: string; user: User }>("/auth/demo-official-login");
    persist(data.token, data.user);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginAsDemoOfficial, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
