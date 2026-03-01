import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import Login from './pages/Login';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import WorkerManagement from './pages/owner/WorkerManagement';
import AttendanceManagement from './pages/owner/AttendanceManagement';
import SalaryManagement from './pages/owner/SalaryManagement';
import OwnerNotes from './pages/owner/OwnerNotes';
import WorkerDetail from './pages/owner/WorkerDetail';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerAttendance from './pages/worker/WorkerAttendance';
import WorkerSalary from './pages/worker/WorkerSalary';
import WorkerNotes from './pages/worker/WorkerNotes';
import Header from './components/layout/Header';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

type OwnerPage = 'dashboard' | 'workers' | 'attendance' | 'salary' | 'notes' | 'workerDetail';
type WorkerPage = 'dashboard' | 'attendance' | 'salary' | 'notes';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [ownerPage, setOwnerPage] = React.useState<OwnerPage>('dashboard');
  const [workerPage, setWorkerPage] = React.useState<WorkerPage>('dashboard');
  const [selectedWorkerId, setSelectedWorkerId] = React.useState<string | null>(null);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Owner view
  if (user?.role === 'owner') {
    const handleOwnerNavigate = (page: string, params?: { workerId?: string }) => {
      if (page === 'workerDetail' && params?.workerId) {
        setSelectedWorkerId(params.workerId);
      }
      setOwnerPage(page as OwnerPage);
    };

    return (
      <div className="min-h-screen bg-page flex flex-col">
        <Header
          role="owner"
          currentPage={ownerPage}
          onNavigate={(page) => setOwnerPage(page as OwnerPage)}
        />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          {ownerPage === 'dashboard' && (
            <OwnerDashboard onNavigate={handleOwnerNavigate} />
          )}
          {ownerPage === 'workers' && (
            <WorkerManagement onNavigate={handleOwnerNavigate} />
          )}
          {ownerPage === 'attendance' && <AttendanceManagement />}
          {ownerPage === 'salary' && <SalaryManagement />}
          {ownerPage === 'notes' && <OwnerNotes />}
          {ownerPage === 'workerDetail' && selectedWorkerId && (
            <WorkerDetail
              workerId={selectedWorkerId}
              onNavigate={handleOwnerNavigate}
            />
          )}
        </main>
        <AppFooter />
      </div>
    );
  }

  // Worker view
  if (user?.role === 'worker') {
    return (
      <div className="min-h-screen bg-page flex flex-col">
        <Header
          role="worker"
          currentPage={workerPage}
          onNavigate={(page) => setWorkerPage(page as WorkerPage)}
        />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          {workerPage === 'dashboard' && (
            <WorkerDashboard onNavigate={(page) => setWorkerPage(page as WorkerPage)} />
          )}
          {workerPage === 'attendance' && <WorkerAttendance />}
          {workerPage === 'salary' && <WorkerSalary />}
          {workerPage === 'notes' && <WorkerNotes />}
        </main>
        <AppFooter />
      </div>
    );
  }

  return <Login />;
}

function AppFooter() {
  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'aditi-electricals'
  );
  return (
    <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border bg-white">
      <p>
        © {new Date().getFullYear()} Aditi Electricals &nbsp;·&nbsp; Built with{' '}
        <span className="text-red-500">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
