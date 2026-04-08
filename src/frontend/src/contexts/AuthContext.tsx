import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Language } from "../lib/i18n";

import { supabase } from "../lib/supabase";

export type { Language };
export type UserRole = "owner" | "worker";

export interface AuthUser {
  workerId: string;
  name: string;
  role: UserRole;
  profilePhoto?: string | null;
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
  updateProfilePhoto: (photoBase64: string | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "aditi_auth_user_v4";
const LANG_STORAGE_KEY = "app_language";
const PROFILE_PHOTO_KEY_PREFIX = "aditi_profile_photo_";

export function getProfilePhotoKey(workerId: string): string {
  return PROFILE_PHOTO_KEY_PREFIX + workerId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "hi" || saved === "mr") return saved;
    return "en";
  });

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === "owner" || parsed.role === "worker")) {
          const photo = localStorage.getItem(
            getProfilePhotoKey(parsed.workerId),
          );
          setUser({ ...parsed, profilePhoto: photo || null });
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : language === "hi" ? "mr" : "en");
  };

  const login = async (
    workerId: string,
    pin: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedId = workerId.trim().toUpperCase();
      const trimmedPin = pin.trim();

      // Query workers table using select('*') to avoid missing column errors
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("worker_id", trimmedId)
        .maybeSingle();

      if (error) {
        // Table doesn't exist in this Supabase project
        if (
          error.code === "42P01" ||
          error.message?.includes("relation") ||
          error.message?.includes("does not exist")
        ) {
          return {
            success: false,
            error:
              "Workers table not found in Supabase. Please run the SQL setup script.",
          };
        }
        // PGRST116 = no rows returned (treat as not found)
        if (error.code === "PGRST116") {
          return {
            success: false,
            error: "Employee ID not found. Please check your ID and try again.",
          };
        }
        // Any other error — show actual error for debugging
        return {
          success: false,
          error: `Database error (${error.code || "unknown"}): ${error.message}`,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "Employee ID not found. Please check your ID and try again.",
        };
      }

      const workerData = data as Record<string, unknown>;

      // active field may not exist — default to true (don't block login)
      const isActive =
        workerData.active === undefined || workerData.active === null
          ? true
          : workerData.active !== false;
      if (!isActive) {
        return {
          success: false,
          error: "Your account is inactive. Contact the owner.",
        };
      }

      const storedPin = (workerData.pin as string) || "";
      if (storedPin !== trimmedPin) {
        return { success: false, error: "Incorrect PIN. Please try again." };
      }

      const rawRole = (workerData.role as string) || "";
      const role: UserRole =
        rawRole === "owner" ||
        trimmedId === "OWNER1" ||
        trimmedId === "OWNER001"
          ? "owner"
          : "worker";

      const photo = localStorage.getItem(getProfilePhotoKey(trimmedId));
      const authUser: AuthUser = {
        workerId: trimmedId,
        name: (workerData.name as string) || trimmedId,
        role,
        profilePhoto: photo || null,
      };

      setUser(authUser);
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          workerId: authUser.workerId,
          name: authUser.name,
          role: authUser.role,
        }),
      );
      return { success: true };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Connection error. Please check your internet connection and try again.";
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
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        workerId: updated.workerId,
        name: updated.name,
        role: updated.role,
      }),
    );
  };

  const updateProfilePhoto = (photoBase64: string | null) => {
    if (!user) return;
    const updated = { ...user, profilePhoto: photoBase64 };
    setUser(updated);
    if (photoBase64) {
      localStorage.setItem(getProfilePhotoKey(user.workerId), photoBase64);
    } else {
      localStorage.removeItem(getProfilePhotoKey(user.workerId));
    }
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
        updateProfilePhoto,
        language,
        setLanguage,
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
