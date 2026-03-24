import {
  AlertCircle,
  FileText,
  Loader2,
  Megaphone,
  Plus,
  Search,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { type Note, NoteType } from "../../backend";
import AddNoteModal from "../../components/notes/AddNoteModal";
import EditNoteModal from "../../components/notes/EditNoteModal";
import NoteCard from "../../components/notes/NoteCard";
import AnnouncementModal from "../../components/owner/AnnouncementModal";
import {
  useDeleteNote,
  useGetAllNotes,
  useGetAllWorkers,
} from "../../hooks/useQueries";

type TabType = "work" | "material" | "ownerInstruction" | "perWorker";

const TAB_NOTE_TYPE: Record<TabType, NoteType> = {
  work: NoteType.work,
  material: NoteType.material,
  ownerInstruction: NoteType.ownerInstruction,
  perWorker: NoteType.perWorker,
};

export default function OwnerNotes() {
  const [activeTab, setActiveTab] = useState<TabType>("work");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkerId, setFilterWorkerId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const { data: notes = [], isLoading, isError, error } = useGetAllNotes();
  const { data: workers = [] } = useGetAllWorkers();
  const deleteNote = useDeleteNote();

  const filteredNotes = useMemo(() => {
    if (!Array.isArray(notes)) return [];
    return notes.filter((note) => {
      if (note.noteType !== TAB_NOTE_TYPE[activeTab]) return false;
      if (filterWorkerId && note.workerId !== filterWorkerId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!note.content.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notes, activeTab, filterWorkerId, searchQuery]);

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote.mutateAsync(noteId);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: "work",
      label: "Work Notes",
      count: Array.isArray(notes)
        ? notes.filter((n) => n.noteType === NoteType.work).length
        : 0,
    },
    {
      key: "material",
      label: "Material",
      count: Array.isArray(notes)
        ? notes.filter((n) => n.noteType === NoteType.material).length
        : 0,
    },
    {
      key: "ownerInstruction",
      label: "Instructions",
      count: Array.isArray(notes)
        ? notes.filter((n) => n.noteType === NoteType.ownerInstruction).length
        : 0,
    },
    {
      key: "perWorker",
      label: "Per Worker",
      count: Array.isArray(notes)
        ? notes.filter((n) => n.noteType === NoteType.perWorker).length
        : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage work notes, materials, and instructions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Megaphone size={16} />
              Announcements
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add Note
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterWorkerId}
              onChange={(e) => setFilterWorkerId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.workerId} value={w.workerId}>
                  {w.workerId} — {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-gray-500 text-sm">Loading notes...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-red-600 font-medium">Failed to load notes</p>
                <p className="text-gray-500 text-sm">
                  {error instanceof Error
                    ? error.message
                    : "Please try again later."}
                </p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <FileText size={40} className="text-gray-300" />
                <p className="text-gray-500 font-medium">No notes found</p>
                <p className="text-gray-400 text-sm">
                  {searchQuery || filterWorkerId
                    ? "Try adjusting your filters"
                    : "Create your first note using the button above"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.noteId}
                    note={note}
                    workerName={
                      workers.find((w) => w.workerId === note.workerId)?.name
                    }
                    onEdit={() => setEditingNote(note)}
                    onDelete={() => handleDelete(note.noteId)}
                    isOwner={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddNoteModal
          workers={workers}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
        />
      )}
      {/* AnnouncementModal requires open prop */}
      <AnnouncementModal
        open={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
      />
    </div>
  );
}
