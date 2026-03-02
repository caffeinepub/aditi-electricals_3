import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WorkerPage } from '../../App';

interface WorkerLayoutProps {
  currentPage: WorkerPage;
  onNavigate: (page: WorkerPage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems: { page: WorkerPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { page: 'attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
  { page: 'salary', label: 'Salary', icon: <DollarSign size={18} /> },
  { page: 'notes', label: 'Notes', icon: <FileText size={18} /> },
];

export default function WorkerLayout({ currentPage, onNavigate, onLogout, children }: WorkerLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: WorkerPage) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 w-full shadow-header"
        style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-fg)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              className="md:hidden p-1.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: 'var(--header-fg)' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--header-fg)' }}>
              Aditi Electricals
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User size={16} style={{ color: 'var(--header-fg)' }} className="opacity-80" />
              <span className="text-sm font-medium" style={{ color: 'var(--header-fg)' }}>
                {user?.name || 'Worker'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: 'var(--header-fg)' }}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-40 w-64 pt-16 flex flex-col
            transform transition-transform duration-200 ease-in-out
            md:static md:translate-x-0 md:pt-0 md:z-auto md:h-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{
            backgroundColor: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
          }}
        >
          {/* Sidebar Header - desktop only */}
          <div
            className="hidden md:flex items-center gap-2 px-4 py-4 border-b"
            style={{ borderColor: 'var(--sidebar-border)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {(user?.name || 'W').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: 'var(--sidebar-fg)' }}>
                {user?.name || 'Worker'}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Worker
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavigate(item.page)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${isActive ? 'text-white' : 'hover:bg-accent'}
                  `}
                  style={isActive ? {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  } : {
                    color: 'var(--sidebar-fg)',
                  }}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div
            className="px-3 py-4 border-t"
            style={{ borderColor: 'var(--sidebar-border)' }}
          >
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-destructive/10"
              style={{ color: 'var(--destructive)' }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto" style={{ backgroundColor: 'var(--background)' }}>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
