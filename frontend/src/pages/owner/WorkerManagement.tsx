import React, { useState } from 'react';
import { useGetAllWorkers, useAddWorker, useDeleteWorker } from '../../hooks/useQueries';
import { useActor } from '../../hooks/useActor';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Eye, Search, UserCheck, UserX, AlertCircle } from 'lucide-react';
import EditWorkerModal from '../../components/owner/EditWorkerModal';
import { Worker } from '../../backend';

interface WorkerManagementProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

// Extract a human-readable message from IC/backend errors
function extractErrorMessage(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    const err = e as Record<string, unknown>;
    if (typeof err.message === 'string') {
      const msg = err.message as string;
      const rejectMatch = msg.match(/Reject message:\s*(.+)/);
      if (rejectMatch) return rejectMatch[1].trim();
      const trapMatch = msg.match(/trapped explicitly:\s*(.+)/);
      if (trapMatch) return trapMatch[1].trim();
      return msg;
    }
    if (typeof err.errorMessage === 'string') return err.errorMessage as string;
  }
  return 'Failed to complete operation';
}

export default function WorkerManagement({ onNavigate }: WorkerManagementProps) {
  const { data: workers = [], isLoading } = useGetAllWorkers();
  const addWorker = useAddWorker();
  const deleteWorker = useDeleteWorker();
  const { actor, isFetching: actorFetching } = useActor();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [salary, setSalary] = useState('');
  const [addError, setAddError] = useState('');
  const [newWorkerId, setNewWorkerId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editWorker, setEditWorker] = useState<Worker | null>(null);

  const resetForm = () => {
    setName('');
    setMobile('');
    setSalary('');
    setAddError('');
    setNewWorkerId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const handleAdd = async () => {
    setAddError('');
    if (!name.trim()) {
      setAddError('Worker name is required');
      return;
    }
    if (!actor) {
      setAddError('System not ready. Please wait a moment and try again.');
      return;
    }
    const salaryNum = salary.trim() ? Number(salary) : 0;
    if (salary.trim() && (isNaN(salaryNum) || salaryNum < 0)) {
      setAddError('Please enter a valid salary amount');
      return;
    }
    try {
      const workerId = await addWorker.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        monthlySalary: salaryNum,
      });
      setNewWorkerId(workerId);
      toast.success(`Worker added! ID: ${workerId}`);
    } catch (e: unknown) {
      const msg = extractErrorMessage(e);
      setAddError(msg);
    }
  };

  const handleDelete = async (workerId: string) => {
    try {
      await deleteWorker.mutateAsync(workerId);
      toast.success('Worker deleted');
      setDeleteConfirm(null);
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e));
    }
  };

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.mobile.includes(searchQuery)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Worker Management</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>{workers.length} total workers</p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={actorFetching}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: actorFetching ? '#7dd3fc' : '#0EA5E9',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontWeight: '600', fontSize: '14px',
            cursor: actorFetching ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={16} /> Add Worker
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search workers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Workers List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9' }} />
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: '16px' }}>No workers found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredWorkers.map(worker => (
            <div key={worker.workerId} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#0EA5E9', fontSize: '16px' }}>
                  {worker.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{worker.name}</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>{worker.workerId} • {worker.mobile || 'No mobile'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: worker.active ? '#dcfce7' : '#fee2e2', color: worker.active ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                  {worker.active
                    ? <><UserCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />Active</>
                    : <><UserX size={12} style={{ display: 'inline', marginRight: '4px' }} />Inactive</>}
                </span>
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>₹{Number(worker.monthlySalary).toLocaleString()}/mo</span>
                <button
                  onClick={() => onNavigate('workerDetail', { workerId: worker.workerId })}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#475569', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Eye size={14} /> View
                </button>
                <button
                  onClick={() => setEditWorker(worker)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#475569', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(worker.workerId)}
                  style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Worker Modal */}
      <EditWorkerModal
        worker={editWorker}
        onClose={() => setEditWorker(null)}
      />

      {/* Add Worker Modal */}
      {addOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget && !addWorker.isPending) { setAddOpen(false); resetForm(); } }}
        >
          <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', width: '100%', maxWidth: '400px', margin: '0 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            {newWorkerId ? (
              /* Success state — show generated worker ID */
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <UserCheck size={28} color="#16a34a" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Worker Added!</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>The worker has been successfully added.</p>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Worker ID</p>
                  <p style={{ color: '#0EA5E9', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '0.05em' }}>{newWorkerId}</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>Default PIN: 0000</p>
                </div>
                <button
                  onClick={() => { setAddOpen(false); resetForm(); }}
                  style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', background: '#0EA5E9', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form state */
              <>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Add New Worker</h2>

                {/* Error banner */}
                {addError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px' }}>
                    <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{addError}</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter worker name"
                      value={name}
                      onChange={e => { setName(e.target.value); setAddError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${addError && !name.trim() ? '#fca5a5' : '#CFCFCF'}`, borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => { e.target.style.borderColor = addError && !name.trim() ? '#fca5a5' : '#CFCFCF'; }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #CFCFCF', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => { e.target.style.borderColor = '#CFCFCF'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Monthly Salary (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter monthly salary"
                      value={salary}
                      onChange={e => setSalary(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      min="0"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #CFCFCF', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                      onBlur={e => { e.target.style.borderColor = '#CFCFCF'; }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => { setAddOpen(false); resetForm(); }}
                    disabled={addWorker.isPending}
                    style={{ flex: 1, padding: '12px', border: '1px solid #CFCFCF', borderRadius: '6px', background: '#fff', color: '#374151', fontWeight: '600', cursor: addWorker.isPending ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: addWorker.isPending ? 0.6 : 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={addWorker.isPending || !actor}
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '6px', background: (addWorker.isPending || !actor) ? '#7dd3fc' : '#0EA5E9', color: '#fff', fontWeight: '600', cursor: (addWorker.isPending || !actor) ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {addWorker.isPending
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</>
                      : 'Add Worker'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '360px', margin: '0 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Delete Worker?</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>This action cannot be undone. All data for this worker will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteWorker.isPending}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '6px', background: '#dc2626', color: '#fff', fontWeight: '600', cursor: deleteWorker.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {deleteWorker.isPending
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...</>
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
