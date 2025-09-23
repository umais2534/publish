import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PetManagementHeader from "./PetManagementHeader";
import PetSearchFilter from "./PetSearchFilter";
import PetsGrid from "./PetsGrid";
import AddPetDialog from "./AddPetDialog";
import ViewPetDialog from "./ViewPetDialog";
import EditPetDialog from "./EditPetDialog";
import DeletePetDialog from "./DeletePetDialog";

import { useAuth } from "@/context/AuthContext";
import { Pet, PetFormData as BasePetFormData } from "./types/petTypes";
const PetManagement = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const { getToken, logout } = useAuth(); 
  const [isAddPetDialogOpen, setIsAddPetDialogOpen] = useState(false);
  const [isViewPetDialogOpen, setIsViewPetDialogOpen] = useState(false);
  const [isEditPetDialogOpen, setIsEditPetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  interface PetFormData extends BasePetFormData {
  imageData?: string;
  imageType?: string;
}

  const [newPet, setNewPet] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    age: "",
    owner: "",
    imageUrl: "",
    imageData: "",
    imageType: "",
    notes: "",
  });
  
  const [editFormData, setEditFormData] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    age: "",
    owner: "",
    imageUrl: "",
    notes: ""
  });

  // Fetch pets from API
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsLoading(true);
        const token = getToken();
        const response = await fetch("/api/pets", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const petsData = await response.json();
          setPets(petsData);
        } else {
          console.error("Failed to fetch pets");
        }
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, []);

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.owner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecies =
      selectedSpecies === "all" || pet.species === selectedSpecies;

    return matchesSearch && matchesSpecies;
  });

const handleAddPet = async () => {
  if (newPet.name && newPet.species && newPet.breed && newPet.owner) {
    try {
      const token = getToken();
      
      if (!token) {
        alert("Please login first");
        logout();
        return;
      }

      // Prepare the data to send
      const petData: any = {
        name: newPet.name,
        species: newPet.species,
        breed: newPet.breed,
        age: newPet.age,
        owner: newPet.owner,
        notes: newPet.notes
      };

      // Handle image data - use either URL or base64, not both
      if (newPet.imageData && newPet.imageType) {
        petData.imageData = newPet.imageData;
        petData.imageType = newPet.imageType;
      } else if (newPet.imageUrl) {
        petData.imageUrl = newPet.imageUrl;
      }

      console.log("Sending pet data:", { 
        ...petData, 
        imageData: petData.imageData ? "BASE64_DATA" : null,
        imageUrl: petData.imageUrl 
      });

      const response = await fetch("/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(petData),
      });
      
      // Clone the response to read it multiple times if needed
      const responseClone = response.clone();
      
      // First check if response is OK
      if (response.ok) {
        const addedPet = await response.json();
        setPets([...pets, addedPet.pet]);
        setNewPet({
          name: "",
          species: "",
          breed: "",
          age: "",
          owner: "",
          imageUrl: "",
          imageData: "",
          imageType: "",
          notes: ""
        });
        setIsAddPetDialogOpen(false);
      } else {
        // If not OK, try to read error message
        try {
          const errorData = await responseClone.json();
          console.error("Server error response:", errorData);
          alert("Failed to add pet: " + (errorData.error || "Unknown error"));
        } catch (jsonError) {
          // If JSON parsing fails, read as text
          const text = await responseClone.text();
          console.error("Server error response (text):", text);
          alert("Failed to add pet: " + text.substring(0, 100));
        }
      }
    } catch (error) {
      console.error("Error adding pet:", error);
      alert("Error adding pet: " + (error as Error).message);
    }
  } else {
    alert("Please fill all required fields (*)");
  }
};
  const handleViewPet = (pet: Pet) => {
    setSelectedPet(pet);
    setIsViewPetDialogOpen(true);
  };

  const handleDeletePet = async () => {
    if (selectedPet) {
      try {
        const token = getToken();
        const response = await fetch(`/api/pets/${selectedPet.id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          setPets(pets.filter((pet) => pet.id !== selectedPet.id));
          setIsViewPetDialogOpen(false);
          setIsDeleteDialogOpen(false);
        } else {
          console.error("Failed to delete pet");
        }
      } catch (error) {
        console.error("Error deleting pet:", error);
      }
    }
  };

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setEditFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age || "",
      owner: pet.owner,
      imageUrl: pet.imageUrl || "",
      notes: pet.notes || ""
    });
    setIsEditPetDialogOpen(true);
  };

  const saveEditedPet = async () => {
    if (
      selectedPet &&
      editFormData.name &&
      editFormData.species &&
      editFormData.breed &&
      editFormData.owner
    ) {
      try {
        setIsSaving(true);
        const token = getToken();
        
        const response = await fetch(`/api/pets/${selectedPet.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editFormData.name,
            species: editFormData.species,
            breed: editFormData.breed,
            age: editFormData.age,
            owner: editFormData.owner,
            imageUrl: editFormData.imageUrl,
            notes: editFormData.notes
          }),
        });
        
        if (response.ok) {
          const updatedPet = await response.json();
          const updatedPets = pets.map((pet) => {
            if (pet.id === selectedPet.id) {
              return updatedPet.pet;
            }
            return pet;
          });
          
          setPets(updatedPets);
          setIsEditPetDialogOpen(false);
          setEditFormData({
            name: "",
            species: "",
            breed: "",
            age: "",
            owner: "",
            imageUrl: "",
            notes: ""
          });
        } else {
          console.error("Failed to update pet");
          alert("Failed to update pet. Please try again.");
        }
      } catch (error) {
        console.error("Error updating pet:", error);
        alert("Error updating pet. Please check your connection.");
      } finally {
        setIsSaving(false);
      }
    } else {
      alert("Please fill all required fields (*)");
    }
  };

  const handleNewPetChange = (updatedFields: Partial<PetFormData>) => {
    setNewPet((prev) => ({ 
      ...prev, 
      ...updatedFields,
      // Ensure we don't lose imageData/imageType when other fields change
      imageData: updatedFields.imageData !== undefined ? updatedFields.imageData : prev.imageData,
      imageType: updatedFields.imageType !== undefined ? updatedFields.imageType : prev.imageType
    }));
  };

  const handleEditFormChange = (updatedFields: Partial<PetFormData>) => {
    setEditFormData((prev) => ({ ...prev, ...updatedFields }));
  };

  if (isLoading) {
    return <div className="p-6">Loading pets...</div>;
  }

  return (
    <div className="bg-background p-6 rounded-lg w-full">
      <PetManagementHeader onAddPet={() => setIsAddPetDialogOpen(true)} />

      <PetSearchFilter
        searchTerm={searchTerm}
        selectedSpecies={selectedSpecies}
        onSearchChange={setSearchTerm}
        onSpeciesChange={setSelectedSpecies}
      />
      
      <PetsGrid
        pets={filteredPets}
        onViewPet={handleViewPet}
        onEditPet={handleEditPet}
        onDeletePet={(id) => {
          setSelectedPet(pets.find((p) => p.id === id) || null);
          setIsDeleteDialogOpen(true);
        }}
        onCallOwner={handleViewPet}
      />

      <AddPetDialog
        isOpen={isAddPetDialogOpen}
        onOpenChange={setIsAddPetDialogOpen}
        pet={newPet}
        onPetChange={handleNewPetChange}
        onAddPet={handleAddPet}
      />

      <ViewPetDialog
        isOpen={isViewPetDialogOpen}
        onOpenChange={setIsViewPetDialogOpen}
        pet={selectedPet}
        onEdit={() => {
          if (selectedPet) {
            handleEditPet(selectedPet);
          }
        }}
        onDelete={(id) => {
          setSelectedPet(pets.find((p) => p.id === id) || null);
          setIsDeleteDialogOpen(true);
        }}
      />

      <EditPetDialog
        isOpen={isEditPetDialogOpen}
        onOpenChange={setIsEditPetDialogOpen}
        pet={editFormData}
        onPetChange={handleEditFormChange}
        onSave={saveEditedPet}
        isSaving={isSaving}
      />

      <DeletePetDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        pet={selectedPet}
        onDelete={handleDeletePet}
      />
    </div>
  );
};

export default PetManagement;