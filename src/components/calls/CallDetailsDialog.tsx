import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Download, Share, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CallRecording } from "@/services/callService";

interface CallDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recording: CallRecording | null;
  audioPlaying: string | null;
  isTranscribing: boolean;
  isSummarizing: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onPlayAudio: (recordingId: string, audioUrl?: string) => void;
  onTranscribe: (recordingId: string) => void;
  onSummarize: (recordingId: string) => void;
  onApprove: (recordingId: string) => void;
  onReject: (recordingId: string) => void;
  onDelete: () => void;
}

const CallDetailsDialog = ({
  isOpen,
  onOpenChange,
  recording,
  audioPlaying,
  isTranscribing,
  isSummarizing,
  isApproving,
  isRejecting,
  onPlayAudio,
  onTranscribe,
  onSummarize,
  onApprove,
  onReject,
  onDelete,
}: CallDetailsDialogProps) => {
  if (!recording) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <h2 className="text-xl font-semibold">
            {recording.petName} - Owner Call
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(recording.date), "MMMM d, yyyy 'at' h:mm a")} •{" "}
            {formatDuration(recording.duration)}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recording.petName}`}
              />
              <AvatarFallback>
                {recording.petName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{recording.ownerName}</h3>
              <p className="text-sm text-muted-foreground">
                Owner of {recording.petName}
              </p>
            </div>
          </div>

          {recording.audioUrl && (
            <div className="p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Audio Recording</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onPlayAudio(recording.id, recording.audioUrl)}
                >
                  {audioPlaying === recording.id ? (
                    <Pause size={16} className="mr-2" />
                  ) : (
                    <Play size={16} className="mr-2" />
                  )}
                  {audioPlaying === recording.id ? "Pause" : "Play"}
                </Button>
                <Button variant="outline">
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Transcription</h3>
              {!recording.transcription && (
                <Button
                  onClick={() => onTranscribe(recording.id)}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? "Transcribing..." : "Transcribe"}
                </Button>
              )}
            </div>

            {recording.transcription ? (
              <div className="p-4 bg-card border rounded-md whitespace-pre-line">
                {recording.transcription}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-md text-center">
                <p className="text-muted-foreground">
                  {isTranscribing
                    ? "Transcribing audio..."
                    : "No transcription available. Click 'Transcribe' to generate one."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Summary</h3>
              {recording.transcription && !recording.summary && (
                <Button
                  onClick={() => onSummarize(recording.id)}
                  disabled={isSummarizing}
                >
                  {isSummarizing ? "Summarizing..." : "Summarize"}
                </Button>
              )}
            </div>

            {recording.summary ? (
              <div className="p-4 bg-card border rounded-md">
                {recording.summary}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-md text-center">
                <p className="text-muted-foreground">
                  {isSummarizing
                    ? "Generating summary..."
                    : recording.transcription
                    ? "No summary available. Click 'Summarize' to generate one."
                    : "Transcribe the audio first to generate a summary."}
                </p>
              </div>
            )}
          </div>

          {recording.transcription && (
            <div className="space-y-4 mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Transcription Status</h3>
                  <Badge
                    variant={
                      recording.status === "approved"
                        ? "default"
                        : recording.status === "rejected"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {recording.status === "approved"
                      ? "Approved"
                      : recording.status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                  </Badge>
                </div>

                {recording.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-2 border-green-500 text-green-500 hover:bg-green-50"
                      onClick={() => onApprove(recording.id)}
                      disabled={isApproving}
                    >
                      {isApproving ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => onReject(recording.id)}
                      disabled={isRejecting}
                    >
                      {isRejecting ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                )}

                {recording.status === "approved" && recording.approvedBy && (
                  <div className="text-sm text-muted-foreground">
                    Approved by {recording.approvedBy} on{" "}
                    {recording.approvedDate &&
                      format(
                        new Date(recording.approvedDate),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={onDelete}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button className="gap-2">
              <Share size={16} />
              Share
            </Button>
            <Button className="gap-2">
              <Printer size={16} />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default CallDetailsDialog;