import React, { useState } from 'react';
import { useAddWorker } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AddWorkerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddWorkerModal({ open, onClose }: AddWorkerModalProps) {
  const addWorker = useAddWorker();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [salary, setSalary] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!salary || isNaN(Number(salary)) || Number(salary) <= 0) { setError('Valid salary is required.'); return; }

    try {
      const workerId = await addWorker.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        monthlySalary: BigInt(Math.round(Number(salary))),
      });
      setSuccess(`Worker added successfully! ID: ${workerId}`);
      setTimeout(() => { setSuccess(''); onClose(); resetForm(); }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add worker.');
    }
  };

  const resetForm = () => { setName(''); setMobile(''); setSalary(''); setError(''); setSuccess(''); };
  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. Shiva Kumar" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Mobile Number (optional)</Label>
            <Input placeholder="e.g. 9876543210" value={mobile} onChange={e => setMobile(e.target.value)} type="tel" />
          </div>
          <div className="space-y-2">
            <Label>Monthly Salary (₹) <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. 15000" value={salary} onChange={e => setSalary(e.target.value)} type="number" min="1" required />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <strong>Default PIN:</strong> 0000 — Worker can change after login
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={addWorker.isPending} className="bg-blue-600 hover:bg-blue-700">
              {addWorker.isPending ? 'Adding...' : 'Add Worker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
