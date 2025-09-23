import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  getCallRecordings,
  transcribeCallRecording,
  summarizeTranscription,
  deleteCallRecording,
  approveTranscription,
  rejectTranscription,
  CallRecording,
} from "@/services/callService";
import {
  Search,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Share,
  Printer,
  Download,
  FileText,
  Phone,
  Plus,
} from "lucide-react";
import CallHistoryHeader from "./CallHistoryHeader"
import CallHistorySearch from "./CallHistorySearch";
import CallRecordingCard from "./CallRecordingCard";
import CallDetailsDialog from "./CallDetailsDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import NewCallDialog from "./NewCallDialog";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";

const CallHistory = () => {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isNewCallDialogOpen, setIsNewCallDialogOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [selectedPet, setSelectedPet] = useState<{
    id: string;
    name: string;
    owner: string;
  } | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const data = await getCallRecordings();
      setRecordings(data);
    } catch (error) {
      console.error("Failed to load call recordings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async (recordingId: string) => {
    setIsTranscribing(true);
    try {
      const updatedRecording = await transcribeCallRecording(recordingId);
      setRecordings(recordings.map((rec) => (rec.id === recordingId ? updatedRecording : rec)));
      if (selectedRecording?.id === recordingId) {
        setSelectedRecording(updatedRecording);
      }
    } catch (error) {
      console.error("Failed to transcribe recording:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarize = async (recordingId: string) => {
    setIsSummarizing(true);
    try {
      const updatedRecording = await summarizeTranscription(recordingId);
      setRecordings(recordings.map((rec) => (rec.id === recordingId ? updatedRecording : rec)));
      if (selectedRecording?.id === recordingId) {
        setSelectedRecording(updatedRecording);
      }
    } catch (error) {
      console.error("Failed to summarize transcription:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleApprove = async (recordingId: string) => {
    setIsApproving(true);
    try {
      const updatedRecording = await approveTranscription(recordingId);
      setRecordings(recordings.map((rec) => (rec.id === recordingId ? updatedRecording : rec)));
      if (selectedRecording?.id === recordingId) {
        setSelectedRecording(updatedRecording);
      }
    } catch (error) {
      console.error("Failed to approve transcription:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (recordingId: string) => {
    setIsRejecting(true);
    try {
      const updatedRecording = await rejectTranscription(recordingId);
      setRecordings(recordings.map((rec) => (rec.id === recordingId ? updatedRecording : rec)));
      if (selectedRecording?.id === recordingId) {
        setSelectedRecording(updatedRecording);
      }
    } catch (error) {
      console.error("Failed to reject transcription:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecording) return;

    try {
      await deleteCallRecording(selectedRecording.id);
      setRecordings(recordings.filter((rec) => rec.id !== selectedRecording.id));
      setIsDetailsOpen(false);
      setIsDeleteDialogOpen(false);
      setSelectedRecording(null);
    } catch (error) {
      console.error("Failed to delete recording:", error);
    }
  };

  const toggleAudio = (recordingId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (audioPlaying === recordingId) {
      audioRef.current?.pause();
      setAudioPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setAudioPlaying(null);
      setAudioPlaying(recordingId);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredRecordings = recordings.filter((recording) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      recording.petName.toLowerCase().includes(searchLower) ||
      recording.ownerName.toLowerCase().includes(searchLower) ||
      (recording.transcription && recording.transcription.toLowerCase().includes(searchLower)) ||
      (recording.summary && recording.summary.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6 bg-gradient-to-b from-white to-primary-50 ">
      <CallHistoryHeader 
        onNewCall={() => setIsNewCallDialogOpen(true)}
      />
      
      <CallHistorySearch 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isLoading ? (
        <LoadingState />
      ) : filteredRecordings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <CallRecordingCard
              key={recording.id}
              recording={recording}
              audioPlaying={audioPlaying}
              onPlayAudio={toggleAudio}
              onViewDetails={() => {
                setSelectedRecording(recording);
                setIsDetailsOpen(true);
              }}
              onDelete={() => {
                setSelectedRecording(recording);
                setIsDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CallDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        recording={selectedRecording}
        audioPlaying={audioPlaying}
        isTranscribing={isTranscribing}
        isSummarizing={isSummarizing}
        isApproving={isApproving}
        isRejecting={isRejecting}
        onPlayAudio={toggleAudio}
        onTranscribe={handleTranscribe}
        onSummarize={handleSummarize}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        recording={selectedRecording}
        onDelete={handleDelete}
      />

      <NewCallDialog
        isOpen={isNewCallDialogOpen}
        onOpenChange={setIsNewCallDialogOpen}
        selectedPet={selectedPet}
        onSelectPet={setSelectedPet}
      />
    </div>
  );
};

export default CallHistory;