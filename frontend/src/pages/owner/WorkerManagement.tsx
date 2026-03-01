import React, { useState } from 'react';
import { useGetAllWorkers, useDeleteWorker } from '../../hooks/useQueries';
import { Worker } from '../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Eye, Phone, IndianRupee, UserCheck, UserX } from 'lucide-react';
import AddWorkerModal from '../../components/owner/AddWorkerModal';
import EditWorkerModal from '../../components/owner/EditWorkerModal';
import PINChangeModal from '../../components/PINChangeModal';

interface WorkerManagementProps {
  onNavigate: (page: string, params?: { workerId?: string }) => void;
}

export default function WorkerManagement({ onNavigate }: WorkerManagementProps) {
  const { data: workers = [], isLoading } = useGetAllWorkers();
  const deleteWorker = useDeleteWorker();

  const [addOpen, setAddOpen] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [pinWorker, setPinWorker] = useState<Worker | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteWorker.mutateAsync(deleteTarget.workerId);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Worker Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{workers.length} workers registered</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Worker
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : workers.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-500">No workers yet. Add your first worker!</p>
            <Button onClick={() => setAddOpen(true)} className="mt-4">
              Add Worker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workers.map(worker => (
            <Card key={worker.workerId} className={`shadow-card border-0 transition-all ${!worker.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${worker.active ? 'bg-primary' : 'bg-gray-400'}`}>
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800 text-base">{worker.name}</h3>
                        <Badge variant={worker.active ? 'default' : 'secondary'} className={worker.active ? 'bg-green-100 text-green-700 border-green-200' : ''}>
                          {worker.active
                            ? <><UserCheck className="w-3 h-3 mr-1" />Active</>
                            : <><UserX className="w-3 h-3 mr-1" />Inactive</>}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {worker.mobile && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />{worker.mobile}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <IndianRupee className="w-3 h-3" />₹{Number(worker.monthlySalary).toLocaleString('en-IN')}/month
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('workerDetail', { workerId: worker.workerId })}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditWorker(worker)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPinWorker(worker)}
                      className="gap-1.5 text-xs h-8"
                    >
                      PIN
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(worker)}
                      className="gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddWorkerModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditWorkerModal worker={editWorker} onClose={() => setEditWorker(null)} />
      <PINChangeModal
        open={!!pinWorker}
        onClose={() => setPinWorker(null)}
        targetWorkerId={pinWorker?.workerId}
        targetWorkerName={pinWorker?.name}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteWorker.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
