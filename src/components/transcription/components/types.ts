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

export interface VisitTypeTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
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

export interface VisitTypeTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
}


export type RecordingFormat = 'raw' | 'soap' | 'medical';

export interface TranscriptionResult {
  text: string;
  format: RecordingFormat;
  petId?: string;
  clinicId?: string;
  visitType?: string;
  templateId?: string;
}
interface RecordingInterfaceProps {
  format: RecordingFormat;
  onStart: () => void;
  onStop: () => void;
}