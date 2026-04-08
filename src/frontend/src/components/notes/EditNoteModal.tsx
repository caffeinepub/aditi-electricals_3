import { AlertCircle, Camera, Image, Loader2, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useUpdateNote } from "../../hooks/useQueries";
import { ExternalBlob, type Note } from "../../types/appTypes";

interface EditNoteModalProps {
  note: Note;
  onClose: () => void;
}

export default function EditNoteModal({ note, onClose }: EditNoteModalProps) {
  const [content, setContent] = useState(note.content || "");
  const [photoUrl, setPhotoUrl] = useState<ExternalBlob | null>(
    note.photoUrl instanceof ExternalBlob ? note.photoUrl : null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const updateNote = useUpdateNote();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      setPhotoUrl(blob);
    } catch (_err) {
      setUploadError("Failed to process photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitError("");
    try {
      await updateNote.mutateAsync({
        noteId: note.noteId,
        content: content.trim(),
        photoUrl,
      });
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to update note. Please try again.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40 border-none cursor-pointer"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit Note</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Content */}
          <div>
            <label
              htmlFor="edit-note-content"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Content
            </label>
            <textarea
              id="edit-note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="Write your note here..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Photo Upload – Camera & Gallery */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Attach Photo (optional)
            </span>
            <div className="flex gap-2">
              {/* Camera Button */}
              <label
                htmlFor="edit-note-camera"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors"
                style={{ userSelect: "none" }}
              >
                <Camera size={16} className="text-blue-500" />
                <span className="text-sm text-gray-600 font-medium">
                  Camera
                </span>
                <input
                  id="edit-note-camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {/* Gallery Button */}
              <label
                htmlFor="edit-note-gallery"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-400 transition-colors"
                style={{ userSelect: "none" }}
              >
                <Image size={16} className="text-green-500" />
                <span className="text-sm text-gray-600 font-medium">
                  Gallery
                </span>
                <input
                  id="edit-note-gallery"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            {photoUrl && (
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <Image size={12} /> Photo selected ✓
                </p>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            {isUploading && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={12} className="animate-spin" />
                  Uploading... {uploadProgress}%
                </div>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {uploadError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} />
                {uploadError}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateNote.isPending || isUploading || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateNote.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
