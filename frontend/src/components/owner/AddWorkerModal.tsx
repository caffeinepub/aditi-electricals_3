import React, { useState } from 'react';
import { useAddWorker } from '../../hooks/useQueries';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
        monthlySalary: Math.round(Number(salary)),
      });
      setSuccess(`Worker added! ID: ${workerId}`);
      setTimeout(() => { setSuccess(''); onClose(); resetForm(); }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add worker.');
    }
  };

  const resetForm = () => { setName(''); setMobile(''); setSalary(''); setError(''); setSuccess(''); };
  const handleClose = () => { resetForm(); onClose(); };

  if (!open) return null;

  return (
    /* Overlay: rgba(0,0,0,0.4) — no blur, just a dark dim */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Modal box: solid white, no transparency, no glass effect */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          width: '90%',
          maxWidth: '420px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div style={{ width: 24 }} />
          <h2
            style={{
              color: '#111827',
              fontSize: '16px',
              fontWeight: 700,
              margin: 0,
              textAlign: 'center',
              flex: 1,
            }}
          >
            Add New Worker
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#E5E7EB', marginBottom: '16px' }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '6px',
              }}
            >
              Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Shiva Kumar"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CFCFCF',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none',
              }}
              onFocus={e => {
                e.target.style.border = '2px solid #0EA5E9';
              }}
              onBlur={e => {
                e.target.style.border = '1px solid #CFCFCF';
              }}
            />
          </div>

          {/* Mobile */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '6px',
              }}
            >
              Mobile{' '}
              <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CFCFCF',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none',
              }}
              onFocus={e => {
                e.target.style.border = '2px solid #0EA5E9';
              }}
              onBlur={e => {
                e.target.style.border = '1px solid #CFCFCF';
              }}
            />
          </div>

          {/* Monthly Salary */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '6px',
              }}
            >
              Monthly Salary (₹) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              min="1"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CFCFCF',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none',
              }}
              onFocus={e => {
                e.target.style.border = '2px solid #0EA5E9';
              }}
              onBlur={e => {
                e.target.style.border = '1px solid #CFCFCF';
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#DC2626',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '13px',
                marginBottom: '14px',
              }}
            >
              <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#15803D',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '13px',
                marginBottom: '14px',
              }}
            >
              <CheckCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {success}
            </div>
          )}

          {/* Primary: Add Worker Button */}
          <button
            type="submit"
            disabled={addWorker.isPending}
            style={{
              width: '100%',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: addWorker.isPending ? '#7DD3FC' : '#0EA5E9',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: addWorker.isPending ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
              marginBottom: '10px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!addWorker.isPending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0284C7';
              }
            }}
            onMouseLeave={e => {
              if (!addWorker.isPending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0EA5E9';
              }
            }}
          >
            {addWorker.isPending && <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />}
            {addWorker.isPending ? 'Adding...' : 'Add Worker'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={addWorker.isPending}
            style={{
              width: '100%',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontSize: '15px',
              fontWeight: 500,
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              cursor: addWorker.isPending ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
              transition: 'background-color 0.15s ease',
              opacity: addWorker.isPending ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!addWorker.isPending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseLeave={e => {
              if (!addWorker.isPending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
              }
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
