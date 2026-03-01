import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAddNote } from '../../hooks/useQueries';
import { NoteType, ExternalBlob, Worker } from '../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  workers?: Worker[];
  defaultWorkerId?: string;
  defaultType?: string;
}

export default function AddNoteModal({ open, onClose, workers, defaultWorkerId, defaultType }: AddNoteModalProps) {
  const { user } = useAuth();
  const addNote = useAddNote();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [noteType, setNoteType] = useState(defaultType || 'work');
  const [workerId, setWorkerId] = useState(defaultWorkerId || user?.workerId || '');
  const [content, setContent] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const isOwner = user?.role === 'owner';

  const ownerTypes = [
    { value: 'work', label: 'Work Note' },
    { value: 'material', label: 'Material Note' },
    { value: 'ownerInstruction', label: 'Owner Instruction (Public)' },
    { value: 'perWorker', label: 'Per Worker Note' },
  ];

  const workerTypes = [
    { value: 'work', label: 'Work Note' },
    { value: 'material', label: 'Material Note' },
  ];

  const noteTypes = isOwner ? ownerTypes : workerTypes;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter note content.');
      return;
    }

    const targetWorkerId = isOwner ? workerId : (user?.workerId || '');
    if (!targetWorkerId) {
      setError('Please select a worker.');
      return;
    }

    let photoBlob: ExternalBlob | null = null;
    if (photoFile) {
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      photoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
    }

    try {
      const typeMap: Record<string, NoteType> = {
        work: NoteType.work,
        material: NoteType.material,
        ownerInstruction: NoteType.ownerInstruction,
        perWorker: NoteType.perWorker,
      };

      await addNote.mutateAsync({
        workerId: targetWorkerId,
        noteType: typeMap[noteType],
        content: content.trim(),
        photoUrl: photoBlob,
      });

      resetForm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add note.';
      setError(msg);
    }
  };

  const resetForm = () => {
    setContent('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadProgress(0);
    setError('');
    setNoteType(defaultType || 'work');
    setWorkerId(defaultWorkerId || user?.workerId || '');
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Note Type</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOwner && workers && (noteType === 'work' || noteType === 'material' || noteType === 'perWorker') && (
            <div className="space-y-2">
              <Label>Worker</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.filter(w => w.active).map(w => (
                    <SelectItem key={w.workerId} value={w.workerId}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isOwner && noteType === 'ownerInstruction' && workers && workers.length > 0 && (
            <div className="space-y-2">
              <Label>Worker (for reference)</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.filter(w => w.active).map(w => (
                    <SelectItem key={w.workerId} value={w.workerId}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              placeholder="Write your note here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full max-h-40 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Camera / Gallery
                </Button>
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="h-1.5" />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={addNote.isPending}>
              {addNote.isPending ? 'Saving...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
