import React, { createContext, useContext, useState, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  role: 'owner' | 'worker';
  workerId?: string;
  pin?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (employeeId: string, pin: string, workers: WorkerData[]) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isOwner: boolean;
  updateUserName: (name: string) => void;
  updateUserPin: (pin: string) => void;
  language: 'en' | 'mr';
  setLanguage: (lang: 'en' | 'mr') => void;
}

interface WorkerData {
  workerId: string;
  name: string;
  pin: string;
  active: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const OWNER_ID = 'OWNER001';
const OWNER_PIN = '1234';
const SESSION_KEY = 'auth_user';
const LANG_KEY = 'aditi_language';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [language, setLanguageState] = useState<'en' | 'mr'>(() => {
    return (localStorage.getItem(LANG_KEY) as 'en' | 'mr') || 'en';
  });

  const login = useCallback(async (employeeId: string, pin: string, workers: WorkerData[]): Promise<boolean> => {
    const id = employeeId.trim().toUpperCase();
    const trimmedPin = pin.trim();

    // Owner login
    if (id === OWNER_ID && trimmedPin === OWNER_PIN) {
      const ownerUser: AuthUser = {
        id: OWNER_ID,
        name: 'Owner',
        role: 'owner',
      };
      setUser(ownerUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(ownerUser));
      return true;
    }

    // Worker login
    const worker = workers.find(
      (w) => w.workerId.toUpperCase() === id && w.active
    );

    if (worker) {
      const workerPin = worker.pin || '0000';
      if (trimmedPin === workerPin) {
        const workerUser: AuthUser = {
          id: worker.workerId,
          name: worker.name,
          role: 'worker',
          workerId: worker.workerId,
          pin: workerPin,
        };
        setUser(workerUser);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(workerUser));
        return true;
      }
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const updateUserName = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUserPin = useCallback((pin: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, pin };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'mr') => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isOwner: user?.role === 'owner',
    updateUserName,
    updateUserPin,
    language,
    setLanguage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
