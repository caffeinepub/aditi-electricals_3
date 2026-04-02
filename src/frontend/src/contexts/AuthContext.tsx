import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Language } from "../lib/i18n";
import { isSupabaseConfigured, localWorkers } from "../lib/localDb";
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
// Separate storage for profile photos (keyed by workerId)
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
          // Restore profile photo from persistent storage
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

      // Use localStorage fallback when Supabase is not configured
      if (!isSupabaseConfigured()) {
        const worker = localWorkers.getByIdForLogin(trimmedId);
        if (!worker) {
          return {
            success: false,
            error: "Employee ID not found. Please check your ID and try again.",
          };
        }
        if (!worker.active) {
          return {
            success: false,
            error: "Your account is inactive. Contact the owner.",
          };
        }
        if (worker.pin !== trimmedPin) {
          return {
            success: false,
            error: "Incorrect PIN. Please try again.",
          };
        }
        const role: UserRole =
          worker.role === "owner" ||
          trimmedId === "OWNER001" ||
          trimmedId === "OWNER1"
            ? "owner"
            : "worker";
        const photo = localStorage.getItem(
          getProfilePhotoKey(worker.worker_id as string),
        );
        const authUser: AuthUser = {
          workerId: worker.worker_id as string,
          name: worker.name as string,
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
      }

      // Supabase login
      const { data, error } = await supabase
        .from("workers")
        .select("worker_id, name, pin, role, active")
        .eq("worker_id", trimmedId)
        .single();

      if (error) {
        if (
          error.message?.includes("relation") ||
          error.message?.includes("does not exist") ||
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
          error: `Database error: ${
            (error as { message?: string }).message ?? "Unknown error"
          }`,
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

      const photo = localStorage.getItem(
        getProfilePhotoKey(data.worker_id as string),
      );
      const authUser: AuthUser = {
        workerId: data.worker_id as string,
        name: data.name as string,
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
    // Store photo separately (it's large, keep session data lean)
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
