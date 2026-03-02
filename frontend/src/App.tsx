import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';

// Pages
import Login from './pages/Login';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import WorkerManagement from './pages/owner/WorkerManagement';
import AttendanceManagement from './pages/owner/AttendanceManagement';
import SalaryManagement from './pages/owner/SalaryManagement';
import OwnerNotes from './pages/owner/OwnerNotes';
import Holidays from './pages/owner/Holidays';
import WorkerDetail from './pages/owner/WorkerDetail';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerAttendance from './pages/worker/WorkerAttendance';
import WorkerSalary from './pages/worker/WorkerSalary';
import WorkerNotes from './pages/worker/WorkerNotes';
import Profile from './pages/Profile';
import OwnerLayout from './components/layout/OwnerLayout';
import WorkerLayout from './components/layout/WorkerLayout';
import { Loader2 } from 'lucide-react';

export type OwnerPage =
  | 'dashboard'
  | 'attendance'
  | 'salary'
  | 'notes'
  | 'workers'
  | 'holidays'
  | 'profile'
  | 'workerDetail';

export type WorkerPage = 'dashboard' | 'attendance' | 'salary' | 'notes' | 'profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AppContent() {
  const { user, isAuthenticated, isOwner, logout } = useAuth();
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [ownerPage, setOwnerPage] = useState<OwnerPage>('dashboard');
  const [workerPage, setWorkerPage] = useState<WorkerPage>('dashboard');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [iiLoginAttempted, setIiLoginAttempted] = useState(false);
  const [ownerRegistered, setOwnerRegistered] = useState(false);
  const ownerRegisterRef = useRef(false);

  // When user logs in via PIN, trigger Internet Identity login so the actor
  // carries an authenticated principal that the backend can recognize as owner/user.
  useEffect(() => {
    if (isAuthenticated && !identity && !iiLoginAttempted && loginStatus === 'idle') {
      setIiLoginAttempted(true);
      try {
        login();
      } catch (err) {
        // Non-critical — log and continue
        console.warn('II login attempt error:', err);
      }
    }
  }, [isAuthenticated, identity, iiLoginAttempted, loginStatus, login]);

  // Reset state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setOwnerPage('dashboard');
      setWorkerPage('dashboard');
      setSelectedWorkerId('');
      setProfileSaved(false);
      setIiLoginAttempted(false);
      setOwnerRegistered(false);
      ownerRegisterRef.current = false;
    }
  }, [isAuthenticated]);

  // CRITICAL: Register owner principal in backend once actor + identity are ready.
  // This must happen before any owner-protected action is attempted.
  // The backend's registerOwner() is idempotent for the same principal — safe to call every session.
  useEffect(() => {
    if (
      !actor ||
      actorFetching ||
      !identity ||
      !isAuthenticated ||
      !isOwner ||
      ownerRegistered ||
      ownerRegisterRef.current
    ) {
      return;
    }

    ownerRegisterRef.current = true;

    const registerOwner = async () => {
      try {
        await actor.registerOwner();
        setOwnerRegistered(true);
      } catch (err: unknown) {
        // If "An owner is already registered" and it's a different principal, that's a real error.
        // But if it's the same principal re-registering, the backend accepts it silently.
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('already registered')) {
          // Another principal already claimed ownership — this is a conflict.
          // Still mark as done so we don't retry endlessly; the backend will reject protected calls.
          console.warn('Owner registration conflict:', msg);
        } else {
          console.warn('Owner registration error:', msg);
        }
        // Mark as done regardless to avoid infinite retry loops
        setOwnerRegistered(true);
      }
    };

    registerOwner();
  }, [actor, actorFetching, identity, isAuthenticated, isOwner, ownerRegistered]);

  // Save user profile to backend once actor and identity are ready
  useEffect(() => {
    if (!actor || actorFetching || !identity || !isAuthenticated || !user || profileSaved) {
      return;
    }

    // For owner: wait until owner is registered before saving profile
    if (isOwner && !ownerRegistered) {
      return;
    }

    const saveProfile = async () => {
      try {
        const existing = await actor.getCallerUserProfile();
        if (!existing) {
          await actor.saveCallerUserProfile({
            name: user.name,
            role: isOwner ? 'owner' : 'worker',
            workerId: user.workerId ?? undefined,
          });
        }
        setProfileSaved(true);
      } catch (err) {
        console.warn('Profile save error:', err);
        setProfileSaved(true); // Don't retry endlessly
      }
    };

    saveProfile();
  }, [actor, actorFetching, identity, isAuthenticated, user, isOwner, profileSaved, ownerRegistered]);

  const handleOwnerNavigate = (page: string, params?: Record<string, string>) => {
    setOwnerPage(page as OwnerPage);
    if (params?.workerId) setSelectedWorkerId(params.workerId);
  };

  const handleWorkerNavigate = (page: WorkerPage) => {
    setWorkerPage(page);
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  // Show loading while initializing Internet Identity
  if (isInitializing || actorFetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f9ff' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Show loading while Internet Identity session is being established
  if (isAuthenticated && (!identity || loginStatus === 'logging-in')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f9ff' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '16px' }}>Authenticating session...</p>
        </div>
      </div>
    );
  }

  // Show loading while owner principal is being registered in the backend
  if (isOwner && !ownerRegistered) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f9ff' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '16px' }}>Setting up owner access...</p>
        </div>
      </div>
    );
  }

  if (isOwner) {
    return (
      <OwnerLayout
        currentPage={ownerPage}
        onNavigate={(page) => setOwnerPage(page)}
        onLogout={handleLogout}
      >
        {ownerPage === 'dashboard' && <OwnerDashboard onNavigate={handleOwnerNavigate} />}
        {ownerPage === 'workers' && <WorkerManagement onNavigate={handleOwnerNavigate} />}
        {ownerPage === 'workerDetail' && (
          <WorkerDetail workerId={selectedWorkerId} onNavigate={handleOwnerNavigate} />
        )}
        {ownerPage === 'attendance' && <AttendanceManagement />}
        {ownerPage === 'salary' && <SalaryManagement />}
        {ownerPage === 'notes' && <OwnerNotes />}
        {ownerPage === 'holidays' && <Holidays />}
        {ownerPage === 'profile' && <Profile />}
      </OwnerLayout>
    );
  }

  return (
    <WorkerLayout
      currentPage={workerPage}
      onNavigate={handleWorkerNavigate}
      onLogout={handleLogout}
    >
      {workerPage === 'dashboard' && <WorkerDashboard />}
      {workerPage === 'attendance' && <WorkerAttendance />}
      {workerPage === 'salary' && <WorkerSalary />}
      {workerPage === 'notes' && <WorkerNotes />}
      {workerPage === 'profile' && <Profile />}
    </WorkerLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
