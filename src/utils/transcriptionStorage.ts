// src/utils/transcriptionStorage.ts
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

const STORAGE_KEY = "vet_transcriptions";

export const saveTranscription = (transcription: Omit<Transcription, "id" | "date">): Transcription => {
  const savedTranscriptions = getTranscriptions();
  const newTranscription: Transcription = {
    ...transcription,
    id: Date.now().toString(),
    date: new Date(),
  };

  const updatedTranscriptions = [newTranscription, ...savedTranscriptions];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTranscriptions));
  return newTranscription;
};

export const getTranscriptions = (): Transcription[] => {
  if (typeof window === "undefined") return [];
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  
  try {
    const parsed = JSON.parse(saved);
    // Convert string dates back to Date objects
    return parsed.map((t: any) => ({
      ...t,
      date: new Date(t.date)
    }));
  } catch {
    return [];
  }
};

export const deleteTranscription = (id: string) => {
  const existing = getTranscriptions();
  const updated = existing.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
// src/utils/transcriptionStorage.ts
export const updateTranscription = (
  id: string,
  updates: Partial<Omit<Transcription, "id" | "date">>
): Transcription | null => {
  const existing = getTranscriptions();
  const index = existing.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  const updated = {
    ...existing[index],
    ...updates,
    date: new Date() // Update the modification date
  };
  
  const newTranscriptions = [...existing];
  newTranscriptions[index] = updated;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newTranscriptions));
  return updated;
};