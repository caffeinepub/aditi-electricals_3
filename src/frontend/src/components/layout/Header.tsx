import { LogOut, Menu, User } from "lucide-react";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  onMenuToggle?: () => void;
  onNavigate?: (page: string) => void;
}

export default function Header({ onMenuToggle, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const profilePhoto = user?.profilePhoto || null;

  return (
    <header
      style={{
        background: "#3B82F6",
        color: "#ffffff",
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Menu size={22} />
          </button>
        )}
        <span
          style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}
        >
          Aditi Electricals
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user && (
          <button
            type="button"
            onClick={() => onNavigate?.("profile")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: profilePhoto ? "4px 10px 4px 4px" : "6px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {/* Avatar: show profile photo if available, otherwise icon */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: profilePhoto
                  ? "transparent"
                  : "rgba(255,255,255,0.25)",
                flexShrink: 0,
                border: profilePhoto
                  ? "1.5px solid rgba(255,255,255,0.6)"
                  : "none",
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={15} color="#fff" />
              )}
            </div>
            {user.name}
          </button>
        )}
        <button
          type="button"
          onClick={logout}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
