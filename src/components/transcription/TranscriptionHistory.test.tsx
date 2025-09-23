import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  SortDesc,
  SortAsc,
  Calendar,
  FileText,
  Edit,
  Trash2,
  Share,
  Printer,
  ChevronDown,
  Copy,
  Check,
  Phone,
  Mic,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  getCallRecordings,
  CallRecording,
  transcribeCallRecording,
  summarizeTranscription,
} from "@/services/callService";

interface Transcription {
  id: string;
  title: string;
  content: string;
  date: Date;
  format: "SOAP" | "Medical Notes" | "Raw Text" | "Call Recording";
  petName?: string;
  clinicName?: string;
  ownerName?: string;
  duration?: number;
  audioUrl?: string;
  summary?: string;
  isCallRecording?: boolean;
  transcription?: string;
  visitType?: string;
}

const TranscriptionHistory: React.FC = () => {
  const [showInput, setShowInput] = useState(false); 
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("https://purrscribe.ai/share/sample");
  const [linkCopied, setLinkCopied] = useState(false);
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  useEffect(() => {
    const loadCallRecordings = async () => {
      try {
        const recordings = await getCallRecordings();
        setCallRecordings(recordings);
      } catch (error) {
        console.error("Failed to load call recordings:", error);
      }
    };

    loadCallRecordings();
  }, []);
  const callRecordingTranscriptions: Transcription[] = callRecordings.map(
    (recording) => ({
      id: recording.id,
      title: `${recording.petName} - Owner Call`,
      content: recording.transcription || "Transcription pending...",
      date: recording.date,
      format: "Call Recording",
      petName: recording.petName,
      ownerName: recording.ownerName,
      duration: recording.duration,
      audioUrl: recording.audioUrl,
      summary: recording.summary,
      isCallRecording: true,
    })
  );

  const localStorageTranscriptions: Transcription[] = JSON.parse(
    localStorage.getItem('transcriptions') || '[]'
  ).map(t => ({
    ...t,
    date: new Date(t.date) 
  }));
  const allTranscriptions = [
    ...localStorageTranscriptions,
    ...callRecordingTranscriptions
  ];
  const filteredTranscriptions = allTranscriptions
    .filter((transcription) => {
      const matchesSearch =
        transcription.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.clinicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.visitType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      const matchesFormat =
        formatFilter === "all" || 
        (formatFilter === "Soap" && transcription.format === "SOAP") ||
        (formatFilter === "Medical Notes" && transcription.format === "Medical Notes") ||
        (formatFilter === "Raw Text" && transcription.format === "Raw Text") ||
        (formatFilter === "Call Recordings" && transcription.format === "Call Recording") ||
        (formatFilter === "Others" && 
          !["SOAP", "Medical Notes", "Raw Text", "Call Recording"].includes(transcription.format));

      return matchesSearch && matchesFormat;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.date.getTime() - b.date.getTime();
      } else {
        return b.date.getTime() - a.date.getTime();
      }
    });

  const handleTranscriptionClick = (transcription: Transcription) => {
    setSelectedTranscription(transcription);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteClick = () => {
    if (!selectedTranscription) return;
    const existingTranscriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]');
    const updatedTranscriptions = existingTranscriptions.filter(
      (t: Transcription) => t.id !== selectedTranscription.id
    );
    localStorage.setItem('transcriptions', JSON.stringify(updatedTranscriptions));
  
    setIsDeleteDialogOpen(false);
    setIsDetailDialogOpen(false);
  };

  const handleShareClick = () => {
    setShareLink(
      "https://vet-transcribe.app/share/" +
        (selectedTranscription?.id || "sample")
    );
    setIsShareDialogOpen(true);
  };

  const handlePrintClick = () => {
    if (selectedTranscription) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${selectedTranscription.title} - Print View</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
                .meta { color: #666; margin-bottom: 20px; }
                .content { line-height: 1.6; }
              </style>
            </head>
            <body>
              <h1>${selectedTranscription.title}</h1>
              <div class="meta">
                <p>Date: ${format(selectedTranscription.date, "MMMM d, yyyy")}</p>
                <p>Format: ${selectedTranscription.format}</p>
                ${selectedTranscription.petName ? `<p>Pet: ${selectedTranscription.petName}</p>` : ""}
                ${selectedTranscription.clinicName ? `<p>Clinic: ${selectedTranscription.clinicName}</p>` : ""}
                ${selectedTranscription.visitType ? `<p>Visit Type: ${selectedTranscription.visitType}</p>` : ""}
              </div>
              <div class="content">
                ${selectedTranscription.content.replace(/\n/g, "<br>")}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
      });
  };

  const toggleAudioPlayback = () => {
    if (!selectedTranscription?.audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(selectedTranscription.audioUrl);
      audio.onended = () => setIsAudioPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsAudioPlaying(true);
    } else {
      if (isAudioPlaying) {
        audioElement.pause();
        setIsAudioPlaying(false);
      } else {
        audioElement.play();
        setIsAudioPlaying(true);
      }
    }
  };
  useEffect(() => {
    if (!isDetailDialogOpen && audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsAudioPlaying(false);
    }
  }, [isDetailDialogOpen, audioElement]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case "SOAP":
        return "bg-blue-100 text-blue-800";
      case "Medical Notes":
        return "bg-green-100 text-green-800";
      case "Raw Text":
        return "bg-purple-100 text-purple-800";
      case "Call Recording":
        return "bg-purrscribe-blue/20 text-purrscribe-blue";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-background min-h-screen p-0 sm:p-4 bg-gradient-to-b from-white to-primary-50">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="bg-gradient-to-r from-[#F0F4FF] to-[#E0ECFF] rounded-xl w-[100%] p-6 shadow-sm mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-2xl font-bold"
            >
              Transcription History
            </motion.h1>
          </div>
          <div className="flex justify-between items-center w-full flex-wrap gap-4 relative">
            <Tabs defaultValue="all" onValueChange={setFormatFilter}>
              <div className="hidden sm:flex">
                <TabsList className="flex flex-wrap gap-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="Soap">SOAP</TabsTrigger>
                  <TabsTrigger value="Medical Notes">Medical Notes</TabsTrigger>
                  <TabsTrigger value="Raw Text">Raw Text</TabsTrigger>
                  <TabsTrigger value="Call Recordings">Call Recordings</TabsTrigger>
                  <TabsTrigger value="Others">Others</TabsTrigger>
                </TabsList>
              </div>
              <div className="sm:hidden relative z-10">
                <TabsList>
                  <details className="relative">
                    <summary className="cursor-pointer border px-4 py-2 rounded bg-white shadow flex items-center justify-between w-[200px]">
                      <span>Filter Options</span>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </summary>
                    <div
                      className="absolute w-[200px] left-0 z-20 rounded border bg-white shadow flex flex-col 
                                 max-[450px]:bottom-full max-[450px]:mb-2 
                                 sm:top-full sm:mt-1"
                    >
                      <TabsTrigger value="all" className="text-left px-4 py-2 hover:bg-gray-100">All</TabsTrigger>
                      <TabsTrigger value="Soap" className="text-left px-4 py-2 hover:bg-gray-100">SOAP</TabsTrigger>
                      <TabsTrigger value="Medical Notes" className="text-left px-4 py-2 hover:bg-gray-100">Medical Notes</TabsTrigger>
                      <TabsTrigger value="Raw Text" className="text-left px-4 py-2 hover:bg-gray-100">Raw Text</TabsTrigger>
                      <TabsTrigger value="Call Recordings" className="text-left px-4 py-2 hover:bg-gray-100">Call Recordings</TabsTrigger>
                      <TabsTrigger value="Others" className="text-left px-4 py-2 hover:bg-gray-100">Others</TabsTrigger>
                    </div>
                  </details>
                </TabsList>
              </div>
            </Tabs>

            <div className="relative z-20 sm:ml-auto w-full sm:w-auto">
    
              <Search
                onClick={() => setShowInput(!showInput)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:hidden z-30"
                size={18}
              />
              <Input
                placeholder="Search transcriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`transition-all duration-300 pl-10 ${
                  showInput ? "w-full sm:w-72" : "w-10 sm:w-72"
                }`}
                style={{
                  paddingLeft: "2.5rem",
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-[-2rem]"> 
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2"
          >
            {sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </Button>
        </div>
        <div className="grid gap-4">
          {filteredTranscriptions.length > 0 ? (
            filteredTranscriptions.map((transcription) => (
              <motion.div
                key={transcription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Card
                  onClick={() => handleTranscriptionClick(transcription)}
                  className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] shadow-xl border border-gray-200 rounded-xl bg-white"
                >
                  <CardContent className="p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {transcription.title}
                          {transcription.isCallRecording && (
                            <Phone
                              size={16}
                              className="inline-block ml-2 text-purrscribe-blue"
                            />
                          )}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{format(transcription.date, "MMM d, yyyy")}</span>
                          </div>

                          <Badge className={getFormatBadgeColor(transcription.format)}>
                            {transcription.format === "Call Recording" ? (
                              <div className="flex items-center gap-1">
                                <Phone size={12} />
                                <span>Call Recording</span>
                              </div>
                            ) : (
                              transcription.format
                            )}
                          </Badge>

                          {transcription.duration && (
                            <span className="text-xs text-gray-400">
                              {formatTime(transcription.duration)}
                            </span>
                          )}
                        </div>

                        {(transcription.petName ||
                          transcription.clinicName ||
                          transcription.ownerName ||
                          transcription.visitType) && (
                          <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                            {transcription.petName && <span>Pet: {transcription.petName}</span>}
                            {transcription.petName &&
                              (transcription.clinicName || transcription.ownerName || transcription.visitType) && (
                                <span>•</span>
                              )}
                            {transcription.clinicName && (
                              <span>Clinic: {transcription.clinicName}</span>
                            )}
                            {transcription.clinicName && transcription.ownerName && (
                              <span>•</span>
                            )}
                            {transcription.ownerName && (
                              <span>Owner: {transcription.ownerName}</span>
                            )}
                            {transcription.ownerName && transcription.visitType && (
                              <span>•</span>
                            )}
                            {transcription.visitType && (
                              <span>Visit: {transcription.visitType}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 mt-1">
                        {transcription.isCallRecording ? (
                          <Mic size={20} className="text-purrscribe-blue" />
                        ) : (
                          <FileText size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    <p className="mt-4 text-gray-600 text-sm line-clamp-2">
                      {transcription.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">No transcriptions found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl bg-[#F1F5F9] transition-opacity">
          <DialogHeader>
            <DialogTitle>{selectedTranscription?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Calendar size={14} />
            <span>
              {selectedTranscription &&
                format(selectedTranscription.date, "MMMM d, yyyy")}
            </span>
            {selectedTranscription && (
              <Badge
                className={getFormatBadgeColor(selectedTranscription.format)}
              >
                {selectedTranscription.format}
              </Badge>
            )}
          </div>
          {selectedTranscription &&
            (selectedTranscription.petName ||
              selectedTranscription.clinicName ||
              selectedTranscription.ownerName ||
              selectedTranscription.visitType) && (
              <div className="flex gap-2 mt-1 text-sm text-gray-500">
                {selectedTranscription.petName && (
                  <span>Pet: {selectedTranscription.petName}</span>
                )}
                {selectedTranscription.petName &&
                  (selectedTranscription.clinicName ||
                    selectedTranscription.ownerName ||
                    selectedTranscription.visitType) && <span>•</span>}
                {selectedTranscription.clinicName && (
                  <span>Clinic: {selectedTranscription.clinicName}</span>
                )}
                {selectedTranscription.clinicName &&
                  selectedTranscription.ownerName && <span>•</span>}
                {selectedTranscription.ownerName && (
                  <span>Owner: {selectedTranscription.ownerName}</span>
                )}
                {selectedTranscription.ownerName &&
                  selectedTranscription.visitType && <span>•</span>}
                {selectedTranscription.visitType && (
                  <span>Visit: {selectedTranscription.visitType}</span>
                )}
              </div>
            )}
          <Separator className="my-4" />

          {selectedTranscription?.isCallRecording &&
            selectedTranscription?.audioUrl && (
              <div className="mb-4 p-3 bg-purrscribe-blue/5 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleAudioPlayback}
                    variant="outline"
                    size="sm"
                    className="bg-purrscribe-blue text-white hover:bg-purrscribe-blue/90"
                  >
                    {isAudioPlaying ? "Pause" : "Play"} Audio
                  </Button>
                  {selectedTranscription.duration && (
                    <span className="text-sm text-gray-600">
                      Duration: {formatTime(selectedTranscription.duration)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!selectedTranscription.transcription && (
                    <Button
                      onClick={() => {
                        transcribeCallRecording(selectedTranscription.id)
                          .then((updatedRecording) => {
                            setSelectedTranscription({
                              ...selectedTranscription,
                              transcription: updatedRecording.transcription,
                            });
                            const updatedCallRecordings = callRecordings.map(
                              (recording) =>
                                recording.id === updatedRecording.id
                                  ? updatedRecording
                                  : recording,
                            );
                            setCallRecordings(updatedCallRecordings);
                          })
                          .catch((error) => {
                            console.error(
                              "Failed to transcribe recording:",
                              error
                            );
                          });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Transcribe
                    </Button>
                  )}
                  {selectedTranscription.transcription &&
                    !selectedTranscription.summary && (
                      <Button
                        onClick={() => {
                          summarizeTranscription(selectedTranscription.id)
                            .then((updatedRecording) => {
                              setSelectedTranscription({
                                ...selectedTranscription,
                                summary: updatedRecording.summary,
                              });
                              const updatedCallRecordings = callRecordings.map(
                                (recording) =>
                                  recording.id === updatedRecording.id
                                    ? updatedRecording
                                    : recording,
                              );
                              setCallRecordings(updatedCallRecordings);
                            })
                            .catch((error) => {
                              console.error(
                                "Failed to summarize transcription:",
                                error
                              );
                            });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Summarize
                      </Button>
                    )}
                </div>
              </div>
            )}

          {selectedTranscription?.isCallRecording &&
            selectedTranscription?.summary && (
              <div className="mb-4 p-3 bg-purrscribe-blue/5 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Phone size={16} className="text-purrscribe-blue" />
                  Call Summary
                </h4>
                <p className="text-sm">{selectedTranscription.summary}</p>
              </div>
            )}

          <div className="max-h-96 overflow-y-auto">
            <p className="whitespace-pre-line">
              {selectedTranscription?.content}
            </p>
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit size={16} />
                Edit
              </Button>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the transcription.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClick}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleShareClick}
              >
                <Share size={16} />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handlePrintClick}
              >
                <Printer size={16} />
                Print
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Transcription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-title"
                defaultValue={selectedTranscription?.title}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-content" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="edit-content"
                defaultValue={selectedTranscription?.content}
                className="w-full min-h-[200px] p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-pet" className="text-sm font-medium">
                  Pet Name
                </label>
                <Input
                  id="edit-pet"
                  defaultValue={selectedTranscription?.petName}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-clinic" className="text-sm font-medium">
                  Clinic Name
                </label>
                <Input
                  id="edit-clinic"
                  defaultValue={selectedTranscription?.clinicName}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-visit-type" className="text-sm font-medium">
                Visit Type
              </label>
              <Input
                id="edit-visit-type"
                defaultValue={selectedTranscription?.visitType}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedTranscription) return;
                const existingTranscriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]');

                const updatedTranscriptions = existingTranscriptions.map((t: Transcription) => 
                  t.id === selectedTranscription.id ? {
                    ...t,
                    title: (document.getElementById('edit-title') as HTMLInputElement).value,
                    content: (document.getElementById('edit-content') as HTMLTextAreaElement).value,
                    petName: (document.getElementById('edit-pet') as HTMLInputElement).value || undefined,
                    clinicName: (document.getElementById('edit-clinic') as HTMLInputElement).value || undefined,
                    visitType: (document.getElementById('edit-visit-type') as HTMLInputElement).value || undefined
                  } : t
                );
                
                // Save back to localStorage
                localStorage.setItem('transcriptions', JSON.stringify(updatedTranscriptions));
                
                // Update state
                setSelectedTranscription({
                  ...selectedTranscription,
                  title: (document.getElementById('edit-title') as HTMLInputElement).value,
                  content: (document.getElementById('edit-content') as HTMLTextAreaElement).value,
                  petName: (document.getElementById('edit-pet') as HTMLInputElement).value || undefined,
                  clinicName: (document.getElementById('edit-clinic') as HTMLInputElement).value || undefined,
                  visitType: (document.getElementById('edit-visit-type') as HTMLInputElement).value || undefined
                });
                
                setIsEditDialogOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Transcription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with others to give them access to this
              transcription:
            </p>
            <div className="flex items-center space-x-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            {linkCopied && (
              <p className="text-sm text-green-600">
                Link copied to clipboard!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranscriptionHistory;