export interface CallRecording {
  id: string;
  petName: string;
  ownerName: string;
  date: string;
  duration: number;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  status?: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: string;
}

export const getCallRecordings = async (): Promise<CallRecording[]> => {
  return Promise.resolve([
    {
      id: "1",
      petName: "Max",
      ownerName: "John Smith",
      date: "2023-06-15T10:30:00Z",
      duration: 185,
      audioUrl: "/sample-audio.mp3",
      transcription: "This is a sample transcription of the call...",
      summary: "Discussed Max's recent checkup and vaccination schedule.",
      status: "approved",
      approvedBy: "Dr. Sarah Johnson",
      approvedDate: "2023-06-16T09:15:00Z",
    },
  ]);
};

export const transcribeCallRecording = async (id: string): Promise<CallRecording> => {
  return Promise.resolve({
    id,
    petName: "Max",
    ownerName: "John Smith",
    date: "2023-06-15T10:30:00Z",
    duration: 185,
    audioUrl: "/sample-audio.mp3",
    transcription: "This is a newly generated transcription...",
    status: "pending",
  });
};

export const summarizeTranscription = async (id: string): Promise<CallRecording> => {
  return Promise.resolve({
    id,
    petName: "Max",
    ownerName: "John Smith",
    date: "2023-06-15T10:30:00Z",
    duration: 185,
    audioUrl: "/sample-audio.mp3",
    transcription: "This is a sample transcription...",
    summary: "This is a newly generated summary of the call...",
    status: "pending",
  });
};

export const deleteCallRecording = async (id: string): Promise<void> => {
  return Promise.resolve();
};

export const approveTranscription = async (id: string): Promise<CallRecording> => {
  return Promise.resolve({
    id,
    petName: "Max",
    ownerName: "John Smith",
    date: "2023-06-15T10:30:00Z",
    duration: 185,
    audioUrl: "/sample-audio.mp3",
    transcription: "This is a sample transcription...",
    summary: "This is a sample summary...",
    status: "approved",
    approvedBy: "Current User",
    approvedDate: new Date().toISOString(),
  });
};

export const rejectTranscription = async (id: string): Promise<CallRecording> => {
  return Promise.resolve({
    id,
    petName: "Max",
    ownerName: "John Smith",
    date: "2023-06-15T10:30:00Z",
    duration: 185,
    audioUrl: "/sample-audio.mp3",
    transcription: "This is a sample transcription...",
    summary: "This is a sample summary...",
    status: "rejected",
  });
};