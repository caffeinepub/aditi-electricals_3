import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  id: string;
  name: string;
  role: 'owner' | 'worker';
  workerId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (id: string, pin: string, workers: WorkerEntry[]) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

interface WorkerEntry {
  workerId: string;
  name: string;
  pin: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const OWNER_ID = 'OWNER001';
const OWNER_PIN = '1234';
const SESSION_KEY = 'aditi_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure role is always 'owner' for OWNER001
        if (parsed.id === OWNER_ID) {
          parsed.role = 'owner';
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const login = (id: string, pin: string, workers: WorkerEntry[]): boolean => {
    // Owner login
    if (id === OWNER_ID && pin === OWNER_PIN) {
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
      (w) => w.workerId === id && w.pin === pin
    );
    if (worker) {
      const workerUser: AuthUser = {
        id: worker.workerId,
        name: worker.name,
        role: 'worker',
        workerId: worker.workerId,
      };
      setUser(workerUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(workerUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
