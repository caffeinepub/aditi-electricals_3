import React, { useState } from 'react';
import { useGetAllAnnouncements, useAddAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from '../../hooks/useQueries';
import { Announcement } from '../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { formatTimestampFull } from '../../utils/dateUtils';

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({ open, onClose }: AnnouncementModalProps) {
  const { data: announcements = [] } = useGetAllAnnouncements();
  const addAnn = useAddAnnouncement();
  const updateAnn = useUpdateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const startAdd = () => { setTitle(''); setContent(''); setEditTarget(null); setShowForm(true); setError(''); };
  const startEdit = (ann: Announcement) => { setTitle(ann.title); setContent(ann.content); setEditTarget(ann); setShowForm(true); setError(''); };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { setError('Title and content are required.'); return; }
    setError('');
    try {
      if (editTarget) {
        await updateAnn.mutateAsync({ announcementId: editTarget.announcementId, title: title.trim(), content: content.trim() });
      } else {
        await addAnn.mutateAsync({ title: title.trim(), content: content.trim() });
      }
      setSuccess(true);
      setShowForm(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save.';
      setError(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAnn.mutateAsync(deleteTarget.announcementId);
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Announcements</span>
              <Button size="sm" onClick={startAdd} className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />New
              </Button>
            </DialogTitle>
          </DialogHeader>

          {showForm && (
            <div className="space-y-3 border border-blue-100 rounded-lg p-4 bg-blue-50">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Content</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Announcement content" rows={3} />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />{error}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={addAnn.isPending || updateAnn.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {(addAnn.isPending || updateAnn.isPending) ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4" />Announcement saved!
            </div>
          )}

          <div className="space-y-3 mt-2">
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No announcements yet</p>
            ) : (
              [...announcements].reverse().map(ann => (
                <div key={ann.announcementId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{ann.title}</p>
                      <p className="text-gray-600 text-sm mt-0.5">{ann.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimestampFull(ann.createdAt)}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => startEdit(ann)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => setDeleteTarget(ann)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteAnn.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
