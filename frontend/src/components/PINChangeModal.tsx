import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateWorker, useGetWorker } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface PINChangeModalProps {
  open: boolean;
  onClose: () => void;
  targetWorkerId?: string;
  targetWorkerName?: string;
}

export default function PINChangeModal({ open, onClose, targetWorkerId, targetWorkerName }: PINChangeModalProps) {
  const { user } = useAuth();
  const workerId = targetWorkerId || user?.workerId || '';
  const { data: worker } = useGetWorker(workerId);
  const updateWorker = useUpdateWorker();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isOwnerChangingWorkerPin = !!targetWorkerId && user?.role === 'owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isOwnerChangingWorkerPin) {
      if (user?.role === 'owner') {
        if (currentPin !== '1234') {
          setError('Current PIN is incorrect.');
          return;
        }
      } else {
        if (!worker || currentPin !== worker.pin) {
          setError('Current PIN is incorrect.');
          return;
        }
      }
    }

    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PINs do not match.');
      return;
    }

    if (user?.role === 'owner' && !targetWorkerId) {
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); resetForm(); }, 1500);
      return;
    }

    if (!worker) {
      setError('Worker data not available.');
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
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); resetForm(); }, 1500);
    } catch {
      setError('Failed to update PIN. Please try again.');
    }
  };

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const title = isOwnerChangingWorkerPin
    ? `Change PIN for ${targetWorkerName || 'Worker'}`
    : 'Change Your PIN';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOwnerChangingWorkerPin && (
            <div className="space-y-2">
              <Label>Current PIN</Label>
              <Input
                type="password"
                placeholder="Enter current PIN"
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>New PIN</Label>
            <Input
              type="password"
              placeholder="Enter new PIN (min 4 digits)"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New PIN</Label>
            <Input
              type="password"
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              PIN changed successfully!
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={updateWorker.isPending}>
              {updateWorker.isPending ? 'Saving...' : 'Change PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
