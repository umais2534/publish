// src/types/transcription.ts
export interface Transcription {
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
}