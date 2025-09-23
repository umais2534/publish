import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, MoreVertical, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CallRecording } from "@/services/callService";

interface CallRecordingCardProps {
  recording: CallRecording;
  audioPlaying: string | null;
  onPlayAudio: (recordingId: string, audioUrl?: string) => void;
  onViewDetails: () => void;
  onDelete: () => void;
}

const CallRecordingCard = ({
  recording,
  audioPlaying,
  onPlayAudio,
  onViewDetails,
  onDelete,
}: CallRecordingCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">
              {recording.petName} - Owner Call
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(recording.date), "MMM d, yyyy 'at' h:mm a")} •{" "}
              {formatDuration(recording.duration)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <FileText className="mr-2" size={16} />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="mr-2" size={16} />
                Delete Recording
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar>
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recording.petName}`}
            />
            <AvatarFallback>
              {recording.petName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{recording.ownerName}</p>
            <p className="text-xs text-muted-foreground">Pet Owner</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="space-x-2">
            {recording.audioUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayAudio(recording.id, recording.audioUrl);
                }}
              >
                {audioPlaying === recording.id ? (
                  <Pause size={16} className="mr-2" />
                ) : (
                  <Play size={16} className="mr-2" />
                )}
                {audioPlaying === recording.id ? "Pause" : "Play"}
              </Button>
            )}
            {recording.transcription && (
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
            )}
          </div>
          <Button variant="ghost" onClick={onViewDetails}>
            View Details
          </Button>
        </div>

        {recording.transcription && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md">
            <p className="text-xs font-medium mb-1">Transcription Preview:</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {recording.transcription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default CallRecordingCard;