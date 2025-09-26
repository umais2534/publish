// components/TranscriptionHistory/types.ts
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
  transcription?: string;
}

// src/types.ts
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age?: string;
  owner: string;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface Recording {
  id: string;
  text: string;
  format: 'raw' | 'soap' | 'medical';
  petId?: string;
  clinicId?: string;
  visitType?: string;
  templateId?: string;
  createdAt: Date;
}

// Response types for API calls
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Form types
export interface PetFormValues extends Omit<Pet, 'id'> {}
export interface ClinicFormValues extends Omit<Clinic, 'id'> {}

type RecordingFormat = "mp3" | "wav" | "ogg";

// Template types
export interface TemplateField {
  name: string;
  label: string;
  pattern: RegExp;
  value: string;
}

export interface VisitTypeTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  fields: TemplateField[];
  created_at?: string;
  updated_at?: string;
}

// Export all types
export * from './transcription';
