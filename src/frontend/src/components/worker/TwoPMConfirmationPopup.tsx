import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirmTwoPM, useGetMyConfirmation } from "../../hooks/useQueries";
import { getTodayString, isAfter2PM } from "../../utils/dateUtils";

export default function TwoPMConfirmationPopup() {
  const { user } = useAuth();
  const workerId = user?.workerId || "";
  const today = getTodayString();

  const { data: confirmation, isLoading } = useGetMyConfirmation(
    workerId,
    today,
  );
  const confirmMutation = useConfirmTwoPM();

  const [show, setShow] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!workerId) return;
    if (isLoading) return;

    if (confirmation?.confirmed) {
      setConfirmed(true);
      setShow(false);
      return;
    }

    const checkTime = () => {
      if (isAfter2PM() && !confirmed) {
        setShow(true);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [workerId, confirmation, isLoading, confirmed]);

  const handleConfirm = async () => {
    if (!workerId) return;
    try {
      await confirmMutation.mutateAsync(workerId);
      setConfirmed(true);
      setShow(false);
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
    } catch {
      setShow(false);
    }
  };

  if (!show || !workerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          2 PM Check-In
        </h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          It's 2:00 PM! Please confirm that you have resumed work after your
          lunch break.
        </p>
        <Button
          onClick={handleConfirm}
          disabled={confirmMutation.isPending}
          className="w-full h-14 text-lg font-bold"
        >
          {confirmMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Confirming...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-6 h-6" />I Resumed Work
            </span>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          This popup will reappear until you confirm.
        </p>
      </div>
    </div>
  );
}
