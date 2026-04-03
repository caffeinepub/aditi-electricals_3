import {
  Calendar,
  CalendarCheck,
  ChevronRight,
  DollarSign,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { t } from "../../lib/i18n";
import Header from "./Header";

interface OwnerLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function OwnerLayout({
  children,
  currentPage,
  onNavigate,
}: OwnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, language } = useAuth();

  const navItems = [
    { id: "dashboard", label: t(language, "dashboard"), icon: LayoutDashboard },
    { id: "workers", label: t(language, "workers"), icon: Users },
    { id: "attendance", label: t(language, "attendance"), icon: CalendarCheck },
    { id: "salary", label: t(language, "salary"), icon: DollarSign },
    { id: "notes", label: t(language, "notes"), icon: FileText },
    { id: "holidays", label: t(language, "holidays"), icon: Calendar },
    { id: "profile", label: t(language, "profile"), icon: Settings },
  ];

  const handleNav = (page: string) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  const displayName = user?.name || "Owner";
  const initial = displayName.charAt(0).toUpperCase();

  const ProfileAvatar = () => (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: user?.profilePhoto ? "transparent" : "#3B82F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #E5E7EB",
      }}
    >
      {user?.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt={displayName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
          {initial}
        </span>
      )}
    </div>
  );

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{ padding: "16px 16px 12px", borderBottom: "1px solid #E5E7EB" }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#6B7280",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 10,
          }}
        >
          {t(language, "ownerPanel")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ProfileAvatar />
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1F2937",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNav(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#3B82F6" : "#374151",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                marginBottom: 2,
                textAlign: "left",
              }}
            >
              <Icon size={18} />
              {item.label}
              {active && (
                <ChevronRight size={14} style={{ marginLeft: "auto" }} />
              )}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #E5E7EB",
          fontSize: 11,
          color: "#9CA3AF",
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()} Aditi Electricals
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F6F8",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={onNavigate}
      />

      <div style={{ display: "flex", flex: 1 }}>
        {/* Desktop Sidebar */}
        <aside
          style={{
            width: 220,
            background: "#ffffff",
            boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
            display: "none",
            flexDirection: "column",
            position: "sticky",
            top: 56,
            height: "calc(100vh - 56px)",
            overflowY: "auto",
          }}
          className="desktop-sidebar"
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.4)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "block",
              width: "100%",
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <div
              style={{
                width: 260,
                height: "100%",
                background: "#fff",
                boxShadow: "4px 0 16px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}
                >
                  {t(language, "menu")}
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6B7280",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </div>
          </button>
        )}

        {/* Main Content */}
        <main
          style={{ flex: 1, padding: "20px", overflowX: "hidden", minWidth: 0 }}
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
