import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "@/lib/api";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface AdminSession {
  access_token: string;
  user: AdminUser;
}

interface AuthValue {
  session: AdminSession | null;
  loading: boolean;
  user: AdminUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSession(null);
      setLoading(false);
      return;
    }
    try {
      const user = await api<AdminUser>("/api/auth/me");
      setSession({ access_token: token, user });
    } catch {
      setToken(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api<{ token: string; user: AdminUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setSession({ access_token: data.token, user: data.user });
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      user: session?.user ?? null,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
