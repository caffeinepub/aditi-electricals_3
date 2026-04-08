import { AlertCircle, FileText, Loader2, Plus } from "lucide-react";
import React, { useState, useMemo } from "react";
import AddNoteModal from "../../components/notes/AddNoteModal";
import EditNoteModal from "../../components/notes/EditNoteModal";
import NoteCard from "../../components/notes/NoteCard";
import { useAuth } from "../../contexts/AuthContext";
import { useDeleteNote, useGetMyNotes } from "../../hooks/useQueries";
import { type Note, NoteType } from "../../types/appTypes";

type TabType = "all" | "work" | "material" | "ownerInstruction";

export default function WorkerNotes() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addNoteType, setAddNoteType] = useState<NoteType>(NoteType.work);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // AuthContext exposes `user`, not `currentUser`
  const { user } = useAuth();
  const { data: notes = [], isLoading, isError, error } = useGetMyNotes();
  const deleteNote = useDeleteNote();

  const filteredNotes = useMemo(() => {
    if (!Array.isArray(notes)) return [];
    return notes.filter((note) => {
      if (activeTab === "all") return true;
      if (activeTab === "work") return note.noteType === NoteType.work;
      if (activeTab === "material") return note.noteType === NoteType.material;
      if (activeTab === "ownerInstruction")
        return note.noteType === NoteType.ownerInstruction;
      return true;
    });
  }, [notes, activeTab]);

  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote.mutateAsync(noteId);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleAddNote = (type: NoteType) => {
    setAddNoteType(type);
    setShowAddModal(true);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "work", label: "Work Notes" },
    { key: "material", label: "Material" },
    { key: "ownerInstruction", label: "Instructions" },
  ];

  const workerId = user?.workerId || "";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
            <p className="text-gray-500 text-sm mt-1">
              Your work notes and materials
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddNote(NoteType.work)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} />
              Work Note
            </button>
            <button
              type="button"
              onClick={() => handleAddNote(NoteType.material)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus size={15} />
              Material
            </button>
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
                className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
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
                <p className="text-gray-500 font-medium">No notes yet</p>
                <p className="text-gray-400 text-sm">
                  {activeTab === "ownerInstruction"
                    ? "No instructions from the owner yet"
                    : "Create your first note using the buttons above"}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.noteId}
                    note={note}
                    onEdit={
                      note.noteType !== NoteType.ownerInstruction
                        ? () => setEditingNote(note)
                        : undefined
                    }
                    onDelete={
                      note.noteType !== NoteType.ownerInstruction
                        ? () => handleDelete(note.noteId)
                        : undefined
                    }
                    isOwner={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && workerId && (
        <AddNoteModal
          workers={[]}
          defaultWorkerId={workerId}
          defaultNoteType={addNoteType}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
        />
      )}
    </div>
  );
}
