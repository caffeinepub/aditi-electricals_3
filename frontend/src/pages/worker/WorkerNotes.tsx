import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetMyNotes, useDeleteNote } from '../../hooks/useQueries';
import { Note } from '../../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import NoteCard from '../../components/notes/NoteCard';
import AddNoteModal from '../../components/notes/AddNoteModal';
import EditNoteModal from '../../components/notes/EditNoteModal';

export default function WorkerNotes() {
  const { user } = useAuth();
  const { data: notes = [], isLoading } = useGetMyNotes();
  const deleteNote = useDeleteNote();

  const [addOpen, setAddOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);

  const workNotes = notes.filter(n => (n.noteType as unknown as string) === 'work');
  const materialNotes = notes.filter(n => (n.noteType as unknown as string) === 'material');
  const allNonInstruction = notes.filter(n => (n.noteType as unknown as string) !== 'ownerInstruction');

  const handleDelete = async (noteId: string) => {
    await deleteNote.mutateAsync(noteId);
  };

  const renderNotes = (noteList: Note[]) => {
    if (isLoading) return <p className="text-gray-400 text-sm text-center py-8">Loading...</p>;
    if (noteList.length === 0) return <p className="text-gray-400 text-sm text-center py-8">No notes found</p>;
    return (
      <div className="space-y-3">
        {noteList.map(note => (
          <NoteCard
            key={note.noteId}
            note={note}
            onEdit={setEditNote}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your work and material notes</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all">All ({allNonInstruction.length})</TabsTrigger>
          <TabsTrigger value="work">Work ({workNotes.length})</TabsTrigger>
          <TabsTrigger value="material">Material ({materialNotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderNotes(notes)}</TabsContent>
        <TabsContent value="work" className="mt-4">{renderNotes(workNotes)}</TabsContent>
        <TabsContent value="material" className="mt-4">{renderNotes(materialNotes)}</TabsContent>
      </Tabs>

      <AddNoteModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditNoteModal open={!!editNote} onClose={() => setEditNote(null)} note={editNote} />
    </div>
  );
}
