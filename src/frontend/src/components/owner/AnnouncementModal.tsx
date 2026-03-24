import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { Announcement } from "../../backend";
import {
  useAddAnnouncement,
  useDeleteAnnouncement,
  useGetAllAnnouncements,
  useUpdateAnnouncement,
} from "../../hooks/useQueries";
import { formatTimestamp } from "../../utils/dateUtils";

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({
  open,
  onClose,
}: AnnouncementModalProps) {
  const { data: announcements = [] } = useGetAllAnnouncements();
  const addAnn = useAddAnnouncement();
  const updateAnn = useUpdateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const startAdd = () => {
    setTitle("");
    setContent("");
    setEditTarget(null);
    setShowForm(true);
    setError("");
  };
  const startEdit = (ann: Announcement) => {
    setTitle(ann.title);
    setContent(ann.content);
    setEditTarget(ann);
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setError("");
    try {
      if (editTarget) {
        await updateAnn.mutateAsync({
          announcementId: editTarget.announcementId,
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        await addAnn.mutateAsync({
          title: title.trim(),
          content: content.trim(),
        });
      }
      setSuccess(true);
      setShowForm(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save.";
      setError(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAnn.mutateAsync(deleteTarget.announcementId);
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Announcements</span>
              <Button size="sm" onClick={startAdd} className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                New
              </Button>
            </DialogTitle>
          </DialogHeader>

          {showForm && (
            <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement content"
                  rows={3}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={addAnn.isPending || updateAnn.isPending}
                  className="flex-1"
                >
                  {addAnn.isPending || updateAnn.isPending
                    ? "Saving..."
                    : "Save"}
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4" />
              Announcement saved!
            </div>
          )}

          <div className="space-y-3 mt-2">
            {announcements.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No announcements yet
              </p>
            ) : (
              [...announcements].reverse().map((ann) => (
                <div
                  key={ann.announcementId}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{ann.title}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {ann.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(ann.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(ann)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(ann)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
