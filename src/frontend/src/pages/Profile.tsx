import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Image, Loader2 } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../camera/useCamera";
import { useAuth } from "../contexts/AuthContext";
import { useGetWorker, useUpdateWorker } from "../hooks/useQueries";

export default function Profile() {
  const { user, updateUserName, language, toggleLanguage } = useAuth();
  const workerId = user?.workerId || "";
  const { data: worker } = useGetWorker(workerId);
  const updateWorker = useUpdateWorker();

  const [name, setName] = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);

  // PIN change
  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  const {
    videoRef,
    canvasRef,
    isActive,
    startCamera,
    stopCamera,
    capturePhoto,
    isLoading: camLoading,
  } = useCamera({ facingMode: "environment" });

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setNameSaving(true);
    try {
      if (user?.role === "worker" && worker) {
        await updateWorker.mutateAsync({
          workerId: worker.workerId,
          name: name.trim(),
          mobile: worker.mobile,
          monthlySalary: Number(worker.monthlySalary),
          pin: worker.pin,
          active: worker.active,
        });
      }
      updateUserName(name.trim());
      toast.success("Name updated successfully");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update name";
      toast.error(msg);
    } finally {
      setNameSaving(false);
    }
  };

  const handlePinChange = async () => {
    setPinError("");
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }

    if (user?.role === "worker" && worker) {
      const storedPin = worker.pin || "0000";
      if (currentPin !== storedPin) {
        setPinError("Current PIN is incorrect");
        return;
      }
      try {
        await updateWorker.mutateAsync({
          workerId: worker.workerId,
          name: worker.name,
          mobile: worker.mobile,
          monthlySalary: Number(worker.monthlySalary),
          pin: newPin,
          active: worker.active,
        });
        setPinSuccess(true);
        setTimeout(() => {
          setPinSuccess(false);
          setPinOpen(false);
          setCurrentPin("");
          setNewPin("");
          setConfirmPin("");
        }, 1500);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to change PIN";
        setPinError(msg);
      }
    } else if (user?.role === "owner") {
      setPinError("Owner PIN cannot be changed from this screen.");
    } else {
      setPinError("Worker profile not loaded yet. Please try again.");
    }
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    toast.success("Profile photo updated");
  };

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    stopCamera();
    setShowCamera(false);
    toast.success("Profile photo captured");
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          marginBottom: 20,
        }}
      >
        Profile
      </h2>

      {/* Profile Photo */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Profile Photo
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setShowCamera(true);
                startCamera();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                border: "1.5px solid #D1D5DB",
                borderRadius: 8,
                background: "#fff",
                fontSize: 13,
                cursor: "pointer",
                color: "#374151",
              }}
            >
              <Camera size={14} /> Camera
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                border: "1.5px solid #D1D5DB",
                borderRadius: 8,
                background: "#fff",
                fontSize: 13,
                cursor: "pointer",
                color: "#374151",
              }}
            >
              <Image size={14} /> Gallery
            </button>
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleGallery}
            />
          </div>
        </div>

        {showCamera && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                background: "#000",
                minHeight: 200,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "auto" }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!isActive || camLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: !isActive || camLoading ? "not-allowed" : "pointer",
                  opacity: !isActive || camLoading ? 0.6 : 1,
                }}
              >
                {camLoading ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                ) : (
                  <Camera size={14} />
                )}
                Capture
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                style={{
                  padding: "8px 14px",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 8,
                  background: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Display Name
        </h3>
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="profile-name"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1.5px solid #CFCFCF",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3B82F6";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#CFCFCF";
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSaveName}
          disabled={nameSaving || updateWorker.isPending}
          style={{
            padding: "10px 20px",
            background:
              nameSaving || updateWorker.isPending ? "#93C5FD" : "#3B82F6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor:
              nameSaving || updateWorker.isPending ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {(nameSaving || updateWorker.isPending) && (
            <Loader2
              size={14}
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          )}
          Save Name
        </button>
      </div>

      {/* Language */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Language / भाषा
        </h3>
        <div>
          <label
            htmlFor="language-select"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Select Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => {
              const newLang = e.target.value as "en" | "hi";
              if (newLang !== language) toggleLanguage();
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1.5px solid #CFCFCF",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              background: "#fff",
              color: "#1F2937",
            }}
          >
            <option value="en">English</option>
            <option value="hi">Hindi / हिंदी</option>
          </select>
          <p style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
            {language === "hi"
              ? "हिंदी भाषा निवडली आहे।"
              : "English language selected."}
          </p>
        </div>
      </div>

      {/* PIN Change */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 8,
          }}
        >
          Change PIN
        </h3>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>
          Update your login PIN (minimum 4 digits).
        </p>
        {user?.role === "owner" ? (
          <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>
            Owner PIN cannot be changed from this screen.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            style={{
              padding: "10px 20px",
              background: "#fff",
              color: "#374151",
              border: "1.5px solid #D1D5DB",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Change PIN
          </button>
        )}
      </div>

      {/* Account Info */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Account Info
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#6B7280" }}>Name</span>
            <span style={{ fontWeight: 600, color: "#1F2937" }}>
              {user?.name || "—"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#6B7280" }}>Role</span>
            <span
              style={{
                fontWeight: 600,
                color: "#1F2937",
                textTransform: "capitalize",
              }}
            >
              {user?.role || "—"}
            </span>
          </div>
          {user?.workerId && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#6B7280" }}>Worker ID</span>
              <span style={{ fontWeight: 600, color: "#1F2937" }}>
                {user.workerId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PIN Change Dialog */}
      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {pinSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-700 font-semibold">
                  PIN changed successfully!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Current PIN</Label>
                  <Input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Enter current PIN"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New PIN</Label>
                  <Input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN (min 4 digits)"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New PIN</Label>
                  <Input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Confirm new PIN"
                    maxLength={8}
                  />
                </div>
                {pinError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {pinError}
                  </p>
                )}
              </>
            )}
          </div>
          {!pinSuccess && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPinOpen(false);
                  setPinError("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePinChange}
                disabled={updateWorker.isPending}
              >
                {updateWorker.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Change PIN
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
