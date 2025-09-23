export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: string;
  owner: string;
  imageUrl?: string;
  imageData?: string; 
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
  notes?: string;
  createdAt: string;
}