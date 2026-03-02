import React, { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
  onLogout?: () => void;
}

export default function Header({ onNavigate, currentPage, onLogout }: HeaderProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (page: string) => {
    if (onNavigate) onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full shadow-header"
      style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-fg)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo / App Name */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--header-fg)' }}>
            Aditi Electricals
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {user?.role === 'owner' && (
            <>
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigate('workers')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'workers'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Workers
              </button>
              <button
                onClick={() => handleNavigate('attendance')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'attendance'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => handleNavigate('salary')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'salary'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Salary
              </button>
              <button
                onClick={() => handleNavigate('notes')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'notes'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => handleNavigate('holidays')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'holidays'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Holidays
              </button>
            </>
          )}
          {user?.role === 'worker' && (
            <>
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigate('attendance')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'attendance'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => handleNavigate('salary')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'salary'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Salary
              </button>
              <button
                onClick={() => handleNavigate('notes')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPage === 'notes'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Notes
              </button>
            </>
          )}
        </nav>

        {/* Right side: user info + logout */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <User size={16} style={{ color: 'var(--header-fg)' }} className="opacity-80" />
              <span className="text-sm font-medium" style={{ color: 'var(--header-fg)' }}>
                {user.name}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-white/10"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Logout</span>
          </button>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--header-fg)' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-white/20 px-4 py-2 space-y-1"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          {user?.role === 'owner' && (
            <>
              {['dashboard', 'workers', 'attendance', 'salary', 'notes', 'holidays'].map((page) => (
                <button
                  key={page}
                  onClick={() => handleNavigate(page)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium capitalize transition-colors ${
                    currentPage === page
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
            </>
          )}
          {user?.role === 'worker' && (
            <>
              {['dashboard', 'attendance', 'salary', 'notes'].map((page) => (
                <button
                  key={page}
                  onClick={() => handleNavigate(page)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium capitalize transition-colors ${
                    currentPage === page
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
            </>
          )}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-white/20 mt-1">
              <User size={16} className="text-white/80" />
              <span className="text-sm text-white/80">{user.name}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
