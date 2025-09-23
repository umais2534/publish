// types/clinic.ts
export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  manager: string;
  logoUrl: string;
  petCount: number;
  type: string;
  notes?: string;
}

export type ClinicFormValues = Omit<Clinic, 'id' | 'petCount'>;