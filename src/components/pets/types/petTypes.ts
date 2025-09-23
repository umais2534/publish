export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  owner: string;
  imageUrl: string;
  notes?: string;
}
export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: string;
  owner: string;
  imageUrl?: string;
  notes?: string;
}

