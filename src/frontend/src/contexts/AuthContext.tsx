import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

export type UserRole = "owner" | "worker";

export interface AuthUser {
  workerId: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  actorReady: boolean;
  login: (
    workerId: string,
    pin: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserName: (name: string) => void;
  language: "en" | "hi";
  toggleLanguage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "aditi_auth_user_v4";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === "owner" || parsed.role === "worker")) {
          setUser(parsed);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const login = async (
    workerId: string,
    pin: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      if (
        !supabaseUrl ||
        supabaseUrl === "undefined" ||
        supabaseUrl.includes("placeholder") ||
        !supabaseKey ||
        supabaseKey === "undefined" ||
        supabaseKey === "placeholder"
      ) {
        return {
          success: false,
          error:
            "Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.",
        };
      }

      const trimmedId = workerId.trim().toUpperCase();
      const trimmedPin = pin.trim();

      const { data, error } = await supabase
        .from("workers")
        .select("worker_id, name, pin, role, active")
        .eq("worker_id", trimmedId)
        .single();

      if (error) {
        if (
          error.message?.includes("relation") ||
          error.message?.includes("does not exist") ||
          error.code === "PGRST116" ||
          error.code === "42P01"
        ) {
          return {
            success: false,
            error:
              "Database tables not found. Please run the SQL setup script in your Supabase project (see SUPABASE_SETUP.md).",
          };
        }
        if (error.code === "PGRST116" || !data) {
          return {
            success: false,
            error: "Employee ID not found. Please check your ID and try again.",
          };
        }
        return {
          success: false,
          error: `Database error: ${(error as { message?: string }).message ?? "Unknown error"}`,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "Employee ID not found. Please check your ID and try again.",
        };
      }

      if (!data.active) {
        return {
          success: false,
          error: "Your account is inactive. Contact the owner.",
        };
      }

      if (data.pin !== trimmedPin) {
        return { success: false, error: "Incorrect PIN. Please try again." };
      }

      const role: UserRole =
        data.role === "owner" ||
        data.worker_id === "OWNER1" ||
        data.worker_id === "OWNER001"
          ? "owner"
          : "worker";

      const authUser: AuthUser = {
        workerId: data.worker_id,
        name: data.name,
        role,
      };

      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { success: true };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Connection error. Please check your internet connection and Supabase configuration.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUserName = (name: string) => {
    if (!user) return;
    const updated = { ...user, name };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleLanguage = () => {
    setLanguage((l) => (l === "en" ? "hi" : "en"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        actorReady: true,
        login,
        logout,
        updateUserName,
        language,
        toggleLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
