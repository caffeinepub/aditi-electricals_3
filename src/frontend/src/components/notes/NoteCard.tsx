import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Edit2,
  Image,
  Megaphone,
  Package,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { type Note, NoteType } from "../../types/appTypes";
import { formatTimestamp } from "../../utils/dateUtils";

interface NoteCardProps {
  note: Note;
  workerName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner: boolean;
}

const noteTypeConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  work: {
    label: "Work Note",
    color: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: <Briefcase size={12} />,
  },
  material: {
    label: "Material Note",
    color: "bg-green-100 text-green-700 border border-green-200",
    icon: <Package size={12} />,
  },
  ownerInstruction: {
    label: "Owner Instruction",
    color: "bg-purple-100 text-purple-700 border border-purple-200",
    icon: <Megaphone size={12} />,
  },
  perWorker: {
    label: "Per Worker",
    color: "bg-orange-100 text-orange-700 border border-orange-200",
    icon: <Briefcase size={12} />,
  },
};

export default function NoteCard({
  note,
  workerName,
  onEdit,
  onDelete,
  isOwner,
}: NoteCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const noteTypeKey = note.noteType as unknown as string;
  const typeConfig = noteTypeConfig[noteTypeKey] || {
    label: noteTypeKey,
    color: "bg-gray-100 text-gray-700",
    icon: null,
  };
  const isPublicInstruction = noteTypeKey === "ownerInstruction";

  const hasPhoto = !!note.photoUrl;
  const photoUrl = note.photoUrl ? note.photoUrl.getDirectURL() : null;

  const createdAt = note.createdAt
    ? formatTimestamp(note.createdAt)
    : "Unknown date";
  const updatedAt = note.updatedAt ? formatTimestamp(note.updatedAt) : null;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
      style={{
        border: isPublicInstruction
          ? "1.5px solid #bbf7d0"
          : "1px solid #E5E7EB",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        marginBottom: 0,
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig.color}`}
          >
            {typeConfig.icon}
            {typeConfig.label}
          </span>
          {/* Public Notice green badge for owner instructions */}
          {isPublicInstruction && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
              <Megaphone size={10} />
              Public Notice
            </span>
          )}
          {workerName && (
            <span className="text-xs text-gray-500 font-medium">
              {workerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit note"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && isOwner && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete note"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {note.content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No content</p>
        )}
      </div>

      {/* Photo */}
      {hasPhoto && photoUrl && !photoError && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => setShowPhoto((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Image size={13} />
            {showPhoto ? "Hide photo" : "View photo"}
            {showPhoto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showPhoto && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={photoUrl}
                alt="Note attachment"
                className="w-full max-h-64 object-cover"
                onError={() => setPhotoError(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          By {note.createdBy === "OWNER" ? "Owner" : note.createdBy}
        </span>
        <div className="text-right">
          <span className="text-xs text-gray-400">{createdAt}</span>
          {updatedAt && (
            <span className="text-xs text-gray-400 block">
              Updated: {updatedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
