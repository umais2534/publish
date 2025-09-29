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
    phoneNumber?: string;
  }

  const [newPet, setNewPet] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    age: "",
    owner: "",
    phoneNumber: "",
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
    phoneNumber: "",
    imageUrl: "",
    notes: ""
  });

  // Fetch pets from API
  useEffect(() => {
// Fix the fetchPets function in useEffect
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
      console.log("Fetched pets data:", petsData); // Debug log
      
      // Ensure phoneNumber field is properly mapped
      const petsWithPhone = petsData.map((pet: any) => ({
        ...pet,
        phoneNumber: pet.phoneNumber || '' // Use the phoneNumber from API response
      }));
      
      setPets(petsWithPhone);
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
    if (newPet.name && newPet.species && newPet.breed && newPet.owner && newPet.phoneNumber) {
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
          phoneNumber: newPet.phoneNumber,
          notes: newPet.notes
        };

        // Handle image data
        if (newPet.imageData && newPet.imageType) {
          petData.imageData = newPet.imageData;
          petData.imageType = newPet.imageType;
        } else if (newPet.imageUrl) {
          petData.imageUrl = newPet.imageUrl;
        }

        console.log("Sending pet data:", petData);

        const response = await fetch("/api/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(petData),
        });
        
        const responseClone = response.clone();
        
        if (response.ok) {
          const addedPet = await response.json();
          setPets([...pets, addedPet.pet]);
          setNewPet({
            name: "",
            species: "",
            breed: "",
            age: "",
            owner: "",
            phoneNumber: "",
            imageUrl: "",
            imageData: "",
            imageType: "",
            notes: ""
          });
          setIsAddPetDialogOpen(false);
        } else {
          try {
            const errorData = await responseClone.json();
            console.error("Server error response:", errorData);
            alert("Failed to add pet: " + (errorData.error || "Unknown error"));
          } catch (jsonError) {
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
    // editFormData کو pet کے ڈیٹا سے fill کریں
    setEditFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age || "",
      owner: pet.owner,
      phoneNumber: pet.phoneNumber || "", // یہاں phoneNumber شامل کریں
      imageUrl: pet.imageUrl || "",
      notes: pet.notes || ""
    });
    setIsEditPetDialogOpen(true);
  };

// EditPetDialog.tsx میں saveEditedPet فنکشن کو اپ ڈیٹ کریں
const saveEditedPet = async () => {
  if (
    selectedPet &&
    editFormData.name &&
    editFormData.species &&
    editFormData.breed &&
    editFormData.owner &&
    editFormData.phoneNumber
  ) {
    try {
      setIsSaving(true);
      const token = getToken();
      
      // Prepare the data to send - use consistent field names
      const petData: any = {
        name: editFormData.name,
        species: editFormData.species,
        breed: editFormData.breed,
        age: editFormData.age,
        owner: editFormData.owner,
        phoneNumber: editFormData.phoneNumber.replace(/\D/g, ''), // Clean phone number
        notes: editFormData.notes
      };

      // Handle image data
      if (editFormData.imageData && editFormData.imageType) {
        petData.imageData = editFormData.imageData;
        petData.imageType = editFormData.imageType;
      } else if (editFormData.imageUrl) {
        petData.imageUrl = editFormData.imageUrl;
      }

      console.log("Updating pet with data:", petData);

      const response = await fetch(`/api/pets/${selectedPet.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(petData),
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
          phoneNumber: "",
          imageUrl: "",
          notes: ""
        });
        
        alert("Pet updated successfully!");
      } else {
        console.error("Failed to update pet");
        const errorText = await response.text();
        console.error("Error response:", errorText);
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
      imageData: updatedFields.imageData !== undefined ? updatedFields.imageData : prev.imageData,
      imageType: updatedFields.imageType !== undefined ? updatedFields.imageType : prev.imageType
    }));
  };

  const handleEditFormChange = (updatedFields: Partial<PetFormData>) => {
    setEditFormData((prev) => ({ ...prev, ...updatedFields }));
  };

  // WhatsApp کال کا ہینڈلر
  const handleCallOwner = (pet: Pet) => {
    if (!pet.phoneNumber) {
      alert(`Phone number not available for ${pet.name}'s owner`);
      return;
    }

    const formattedNumber = pet.phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedNumber}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
        onCallOwner={handleCallOwner}
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