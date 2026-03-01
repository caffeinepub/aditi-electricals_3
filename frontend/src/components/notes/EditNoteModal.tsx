import React, { useState, useRef, useEffect } from 'react';
import { useUpdateNote } from '../../hooks/useQueries';
import { Note, ExternalBlob } from '../../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface EditNoteModalProps {
  open: boolean;
  onClose: () => void;
  note: Note | null;
}

export default function EditNoteModal({ open, onClose, note }: EditNoteModalProps) {
  const updateNote = useUpdateNote();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [keepExistingPhoto, setKeepExistingPhoto] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setPhotoPreview(note.photoUrl?.getDirectURL?.() || null);
      setKeepExistingPhoto(!!note.photoUrl);
    }
  }, [note]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setKeepExistingPhoto(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;
    setError('');

    let photoBlob: ExternalBlob | null = null;
    if (photoFile) {
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      photoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
    } else if (keepExistingPhoto && note.photoUrl) {
      photoBlob = note.photoUrl;
    }

    try {
      await updateNote.mutateAsync({ noteId: note.noteId, content: content.trim(), photoUrl: photoBlob });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update note.';
      setError(msg);
    }
  };

  const handleClose = () => {
    setError('');
    setPhotoFile(null);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
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
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); setKeepExistingPhoto(false); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Camera className="w-4 h-4" />
                Add Photo
              </Button>
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
            <Button type="submit" disabled={updateNote.isPending}>
              {updateNote.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
