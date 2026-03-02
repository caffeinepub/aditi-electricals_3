import React from 'react';
import { Note, NoteType } from '../../backend';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { formatTimestamp } from '../../utils/dateUtils';

interface NoteCardProps {
  note: Note;
  workerName?: string;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  work: { label: 'Work Note', color: 'bg-blue-100 text-blue-700' },
  material: { label: 'Material Note', color: 'bg-purple-100 text-purple-700' },
  ownerInstruction: { label: 'Public Notice', color: 'bg-green-100 text-green-700' },
  perWorker: { label: 'Personal Note', color: 'bg-amber-100 text-amber-700' },
};

export default function NoteCard({ note, workerName, onEdit, onDelete }: NoteCardProps) {
  const { user } = useAuth();
  const noteTypeKey = note.noteType as unknown as string;
  const typeInfo = NOTE_TYPE_LABELS[noteTypeKey] || { label: noteTypeKey, color: 'bg-gray-100 text-gray-700' };
  const isOwnerInstruction = noteTypeKey === 'ownerInstruction';
  const isOwner = user?.role === 'owner';
  const isOwnNote = user?.role === 'worker' && note.createdBy === user.workerId;

  const canEdit = isOwner || (isOwnNote && !isOwnerInstruction);
  const canDelete = isOwner;

  const photoUrl = note.photoUrl?.getDirectURL?.();

  return (
    <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
              {isOwnerInstruction ? '📢 ' : ''}{typeInfo.label}
            </span>
            {workerName && isOwner && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{workerName}</span>
            )}
          </div>
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {canEdit && onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onEdit(note)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              )}
              {canDelete && onDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(note.noteId)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>

        {photoUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <img src={photoUrl} alt="Note attachment" className="w-full max-h-48 object-cover" />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{note.createdBy === 'OWNER' ? 'Owner' : (workerName || note.createdBy)}</span>
          <span>{formatTimestamp(note.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
