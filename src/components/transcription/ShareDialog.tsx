import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  transcriptionId: string | null;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  transcriptionId,
}) => {
  const shareableLink = transcriptionId
    ? `https://yourapp.com/transcriptions/${transcriptionId}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Transcription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={shareableLink} readOnly />
          <div className="flex justify-end">
            <Button onClick={handleCopy}>Copy Link</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
