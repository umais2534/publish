export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: string;
  owner: string;
  imageUrl?: string;
  imageData?: string; 
   phoneNumber?: string; 
  imageType?: string; 
  notes?: string;
  fileData:string
}

export interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  owner: string;
  imageUrl?: string;
   phoneNumber?: string; 
  notes?: string;
  createdAt: string;
}