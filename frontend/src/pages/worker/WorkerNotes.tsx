import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetMyNotes, useAddNote, useUpdateNote, useDeleteNote } from '../../hooks/useQueries';
import { NoteType, Note } from '../../backend';
import { ExternalBlob } from '../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Camera, Image, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimestamp } from '../../utils/dateUtils';
import { useCamera } from '../../camera/useCamera';

function WorkerNoteCard({ note, onEdit, onDelete, currentWorkerId }: {
  note: Note; onEdit: (n: Note) => void; onDelete: (id: string) => void; currentWorkerId: string;
}) {
  const isInstruction = note.noteType === NoteType.ownerInstruction;
  const isOwnNote = note.createdBy === currentWorkerId;
  const canEdit = isOwnNote && !isInstruction;
  const canDelete = isOwnNote && !isInstruction;

  return (
    <Card className="card-shadow border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            {isInstruction && <Badge className="bg-green-600 text-white text-xs">📢 Public Notice</Badge>}
            {!isInstruction && (
              <Badge variant="outline" className="text-xs capitalize">{String(note.noteType)}</Badge>
            )}
          </div>
          {(canEdit || canDelete) && (
            <div className="flex gap-1 shrink-0">
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(note)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onDelete(note.noteId)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-foreground mb-2">{note.content}</p>
        {note.photoUrl && (
          <img src={note.photoUrl.getDirectURL()} alt="Note" className="rounded-lg max-h-48 object-cover w-full mt-2" />
        )}
        <p className="text-xs text-muted-foreground mt-2">{formatTimestamp(note.createdAt)}</p>
      </CardContent>
    </Card>
  );
}

function NoteForm({ onClose, editNote, workerId }: {
  onClose: () => void; editNote?: Note | null; workerId: string;
}) {
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const [content, setContent] = useState(editNote?.content || '');
  const [noteType, setNoteType] = useState<NoteType>(editNote?.noteType || NoteType.work);
  const [photoBlob, setPhotoBlob] = useState<ExternalBlob | null>(editNote?.photoUrl || null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  const { videoRef, canvasRef, isActive, startCamera, stopCamera, capturePhoto, isLoading: camLoading } = useCamera({ facingMode: 'environment' });

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arr = new Uint8Array(ev.target?.result as ArrayBuffer);
      setPhotoBlob(ExternalBlob.fromBytes(arr));
      setPhotoPreview(URL.createObjectURL(new Blob([arr])));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (!file) return;
    const arr = new Uint8Array(await file.arrayBuffer());
    setPhotoBlob(ExternalBlob.fromBytes(arr));
    setPhotoPreview(URL.createObjectURL(new Blob([arr])));
    stopCamera();
    setShowCamera(false);
  };

  const handleSave = async () => {
    if (!content.trim()) { toast.error('Enter note content'); return; }
    try {
      if (editNote) {
        await updateNote.mutateAsync({ noteId: editNote.noteId, content: content.trim(), photoUrl: photoBlob });
        toast.success('Note updated');
      } else {
        await addNote.mutateAsync({ workerId, noteType, content: content.trim(), photoUrl: photoBlob });
        toast.success('Note added');
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save note');
    }
  };

  return (
    <div className="space-y-4">
      {!editNote && (
        <div className="space-y-2">
          <Label>Note Type</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={noteType === NoteType.work ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNoteType(NoteType.work)}
            >Work Note</Button>
            <Button
              type="button"
              variant={noteType === NoteType.material ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNoteType(NoteType.material)}
            >Material Note</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write your note..." />
      </div>

      <div className="space-y-2">
        <Label>Photo (optional)</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { setShowCamera(true); startCamera(); }}>
            <Camera className="w-4 h-4 mr-1" /> Camera
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => galleryRef.current?.click()}>
            <Image className="w-4 h-4 mr-1" /> Gallery
          </Button>
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />
        </div>
        {showCamera && (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: 200 }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleCapture} disabled={!isActive || camLoading}>
                {camLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Camera className="w-4 h-4 mr-1" />} Capture
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { stopCamera(); setShowCamera(false); }}>Cancel</Button>
            </div>
          </div>
        )}
        {photoPreview && (
          <div className="relative inline-block">
            <img src={photoPreview} alt="Preview" className="rounded-lg max-h-32 object-cover" />
            <button onClick={() => { setPhotoBlob(null); setPhotoPreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={addNote.isPending || updateNote.isPending}>
          {(addNote.isPending || updateNote.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {editNote ? 'Update' : 'Add Note'}
        </Button>
      </div>
    </div>
  );
}

export default function WorkerNotes() {
  const { user } = useAuth();
  const workerId = user?.workerId || '';
  const { data: notes = [], isLoading } = useGetMyNotes();
  const deleteNote = useDeleteNote();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<NoteType>(NoteType.work);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filtered = notes.filter(n => {
    if (search && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'work' && n.noteType !== NoteType.work) return false;
    if (activeTab === 'material' && n.noteType !== NoteType.material) return false;
    if (activeTab === 'instructions' && n.noteType !== NoteType.ownerInstruction) return false;
    return true;
  });

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success('Note deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const openAdd = (type: NoteType) => {
    setAddType(type);
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Notes</h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => openAdd(NoteType.work)}>
          <Plus className="w-4 h-4 mr-1" /> Work Note
        </Button>
        <Button size="sm" variant="outline" onClick={() => openAdd(NoteType.material)}>
          <Plus className="w-4 h-4 mr-1" /> Material Note
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="work">Work Notes</TabsTrigger>
          <TabsTrigger value="material">Material Notes</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notes found.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(n => (
                <WorkerNoteCard
                  key={n.noteId}
                  note={n}
                  onEdit={setEditNote}
                  onDelete={handleDelete}
                  currentWorkerId={workerId}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
          <NoteForm onClose={() => setAddOpen(false)} workerId={workerId} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editNote} onOpenChange={v => !v && setEditNote(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Note</DialogTitle></DialogHeader>
          {editNote && <NoteForm onClose={() => setEditNote(null)} editNote={editNote} workerId={workerId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
