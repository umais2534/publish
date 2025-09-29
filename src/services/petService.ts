import { Pet } from "@/types/petTypes";

export const getPets = async (): Promise<Pet[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/pets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }
    
    const pets = await response.json();
    return pets.map((pet: any) => ({
      ...pet,
      // Ensure imageUrl is properly formatted
      imageUrl: pet.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.name}`
    }));
  } catch (error) {
    console.error('Error fetching pets:', error);
    throw error;
  }
};