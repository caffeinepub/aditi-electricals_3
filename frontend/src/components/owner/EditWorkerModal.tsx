import React, { useState, useEffect } from 'react';
import { useUpdateWorker } from '../../hooks/useQueries';
import { Worker } from '../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface EditWorkerModalProps {
  worker: Worker | null;
  onClose: () => void;
}

export default function EditWorkerModal({ worker, onClose }: EditWorkerModalProps) {
  const updateWorker = useUpdateWorker();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [salary, setSalary] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setMobile(worker.mobile);
      setSalary(String(Number(worker.monthlySalary)));
      setActive(worker.active);
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!salary || isNaN(Number(salary)) || Number(salary) <= 0) { setError('Valid salary is required.'); return; }

    try {
      await updateWorker.mutateAsync({
        workerId: worker.workerId,
        name: name.trim(),
        mobile: mobile.trim(),
        monthlySalary: BigInt(Math.round(Number(salary))),
        pin: worker.pin,
        active,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update worker.');
    }
  };

  const handleClose = () => { setError(''); setSuccess(false); onClose(); };

  return (
    <Dialog open={!!worker} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Worker — {worker?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <Input value={mobile} onChange={e => setMobile(e.target.value)} type="tel" />
          </div>
          <div className="space-y-2">
            <Label>Monthly Salary (₹) <span className="text-red-500">*</span></Label>
            <Input value={salary} onChange={e => setSalary(e.target.value)} type="number" min="1" required />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Active Status</Label>
              <p className="text-xs text-gray-500">Inactive workers cannot log in</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Worker updated successfully!
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={updateWorker.isPending} className="bg-blue-600 hover:bg-blue-700">
              {updateWorker.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
