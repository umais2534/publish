// components/EditTranscriptionDialog.tsx

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EditTranscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: any) => void;
  onSave: (updated: { title: string; text: string }) => void;
  transcription: {
    title: string;
    text: string;
  } | null;
}

const EditTranscriptionDialog: React.FC<EditTranscriptionDialogProps> = ({
  open,
  onClose,
  onSave,
  transcription,
}) => {
  const [title, setTitle] = useState(transcription?.title || "");
  const [text, setText] = useState(transcription?.text || "");

  const handleSave = () => {
    onSave({ title, text });
    onClose();
  };

  React.useEffect(() => {
    if (transcription) {
      setTitle(transcription.title);
      setText(transcription.text);
    }
  }, [transcription]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transcription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Text"
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTranscriptionDialog;
