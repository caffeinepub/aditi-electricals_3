import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import OwnerLayout from "./components/layout/OwnerLayout";
import WorkerLayout from "./components/layout/WorkerLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AttendanceManagement from "./pages/owner/AttendanceManagement";
import Holidays from "./pages/owner/Holidays";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerNotes from "./pages/owner/OwnerNotes";
import SalaryManagement from "./pages/owner/SalaryManagement";
import WorkerManagement from "./pages/owner/WorkerManagement";
import WorkerAttendance from "./pages/worker/WorkerAttendance";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerNotes from "./pages/worker/WorkerNotes";
import WorkerSalary from "./pages/worker/WorkerSalary";
import { registerServiceWorker } from "./utils/registerServiceWorker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
    mutations: { retry: 0 },
  },
});

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleNavigate = (page: string, params?: Record<string, string>) => {
    setCurrentPage(page);
    setPageParams(params || {});
  };

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  if (user.role === "owner") {
    const renderOwnerPage = () => {
      switch (currentPage) {
        case "dashboard":
          return <OwnerDashboard onNavigate={handleNavigate} />;
        case "workers":
          return <WorkerManagement onNavigate={handleNavigate} />;
        case "attendance":
          return (
            <AttendanceManagement
              initialWorkerId={pageParams.workerId || null}
            />
          );
        case "salary":
          return (
            <SalaryManagement initialWorkerId={pageParams.workerId || ""} />
          );
        case "notes":
          return <OwnerNotes />;
        case "holidays":
          return <Holidays />;
        case "profile":
          return <Profile />;
        default:
          return <OwnerDashboard onNavigate={handleNavigate} />;
      }
    };
    return (
      <OwnerLayout currentPage={currentPage} onNavigate={handleNavigate}>
        {renderOwnerPage()}
      </OwnerLayout>
    );
  }

  // Worker UI
  const renderWorkerPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <WorkerDashboard />;
      case "attendance":
        return <WorkerAttendance />;
      case "salary":
        return <WorkerSalary />;
      case "notes":
        return <WorkerNotes />;
      case "profile":
        return <Profile />;
      default:
        return <WorkerDashboard />;
    }
  };

  return (
    <WorkerLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderWorkerPage()}
    </WorkerLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
