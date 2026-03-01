import React, { useState, useMemo } from 'react';
import { useGetAllNotes, useDeleteNote, useGetAllWorkers } from '../../hooks/useQueries';
import { Note, NoteType } from '../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Megaphone } from 'lucide-react';
import NoteCard from '../../components/notes/NoteCard';
import AddNoteModal from '../../components/notes/AddNoteModal';
import EditNoteModal from '../../components/notes/EditNoteModal';
import AnnouncementModal from '../../components/owner/AnnouncementModal';

export default function OwnerNotes() {
  const { data: notes = [], isLoading } = useGetAllNotes();
  const { data: workers = [] } = useGetAllWorkers();
  const deleteNote = useDeleteNote();

  const [addOpen, setAddOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [searchWorker, setSearchWorker] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const workerMap = Object.fromEntries(workers.map(w => [w.workerId, w.name]));

  const filterNotes = (noteList: Note[]) => {
    return noteList.filter(n => {
      if (searchDate && !n.createdAt.toString().includes(searchDate)) {
        // Compare by formatted date
        const ms = Number(n.createdAt) / 1_000_000;
        const dateStr = new Date(ms).toISOString().split('T')[0];
        if (!dateStr.includes(searchDate)) return false;
      }
      if (searchWorker) {
        const name = workerMap[n.workerId] || '';
        if (!name.toLowerCase().includes(searchWorker.toLowerCase())) return false;
      }
      if (searchKeyword && !n.content.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
      return true;
    });
  };

  const workNotes = filterNotes(notes.filter(n => (n.noteType as unknown as string) === 'work'));
  const materialNotes = filterNotes(notes.filter(n => (n.noteType as unknown as string) === 'material'));
  const ownerInstructions = filterNotes(notes.filter(n => (n.noteType as unknown as string) === 'ownerInstruction'));
  const perWorkerNotes = filterNotes(notes.filter(n => (n.noteType as unknown as string) === 'perWorker'));

  const handleDelete = async (noteId: string) => {
    await deleteNote.mutateAsync(noteId);
  };

  const renderNotes = (noteList: Note[]) => {
    if (noteList.length === 0) {
      return <p className="text-gray-400 text-sm text-center py-8">No notes found</p>;
    }
    return (
      <div className="space-y-3">
        {noteList.map(note => (
          <NoteCard
            key={note.noteId}
            note={note}
            workerName={workerMap[note.workerId]}
            onEdit={setEditNote}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all worker notes and instructions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAnnouncementOpen(true)} variant="outline" className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
            <Megaphone className="w-4 h-4" />
            Announcement
          </Button>
          <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by date (YYYY-MM-DD)"
                value={searchDate}
                onChange={e => setSearchDate(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by worker name"
                value={searchWorker}
                onChange={e => setSearchWorker(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by keyword"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="work">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="work">Work ({workNotes.length})</TabsTrigger>
          <TabsTrigger value="material">Material ({materialNotes.length})</TabsTrigger>
          <TabsTrigger value="instructions">Instructions ({ownerInstructions.length})</TabsTrigger>
          <TabsTrigger value="perworker">Per Worker ({perWorkerNotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="work" className="mt-4">{renderNotes(workNotes)}</TabsContent>
        <TabsContent value="material" className="mt-4">{renderNotes(materialNotes)}</TabsContent>
        <TabsContent value="instructions" className="mt-4">{renderNotes(ownerInstructions)}</TabsContent>
        <TabsContent value="perworker" className="mt-4">{renderNotes(perWorkerNotes)}</TabsContent>
      </Tabs>

      <AddNoteModal open={addOpen} onClose={() => setAddOpen(false)} workers={workers} />
      <EditNoteModal open={!!editNote} onClose={() => setEditNote(null)} note={editNote} />
      <AnnouncementModal open={announcementOpen} onClose={() => setAnnouncementOpen(false)} />
    </div>
  );
}
