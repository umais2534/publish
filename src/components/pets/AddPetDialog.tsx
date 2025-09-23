import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ui/image-uploader";
import { PetFormData as BasePetFormData } from "./types/petTypes";
import { useState } from "react";

// Extend the PetFormData interface to include imageData and imageType
interface PetFormData extends BasePetFormData {
  imageData?: string;
  imageType?: string;
}

interface AddPetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pet: PetFormData;
  onPetChange: (updatedFields: Partial<PetFormData>) => void;
  onAddPet: () => void;
}

const AddPetDialog = ({ isOpen, onOpenChange, pet, onPetChange, onAddPet }: AddPetDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] max-h-[90vh] md:max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <div className="relative -mt-6 bg-[#272E3F] text-white text-center pt-0 pb-0 rounded-b-[110px] overflow-hidden w-[40%] mx-auto">
            <h2 className="text-lg font-semibold z-10 relative">Add New Pet</h2>
            <svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 500 50"
              preserveAspectRatio="none"
            >
              <path d="M0,0 C125,50 375,50 500,0 L500,50 L0,50 Z" fill="#272E3F" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the details of the new pet to add to your records.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Pet Name*</Label>
              <Input
                id="name"
                value={pet.name || ''}
                onChange={(e) => onPetChange({ name: e.target.value })}
                placeholder="Max"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="species">Species*</Label>
              <Select
                value={pet.species || ''}
                onValueChange={(value) => onPetChange({ species: value })}
                required
              >
                <SelectTrigger id="species">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Rabbit">Rabbit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="breed">Breed*</Label>
              <Input
                id="breed"
                value={pet.breed || ''}
                onChange={(e) => onPetChange({ breed: e.target.value })}
                placeholder="Golden Retriever"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={pet.age || ''}
                onChange={(e) => onPetChange({ age: e.target.value })}
                placeholder="5 years"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="owner">Owner*</Label>
            <Input
              id="owner"
              value={pet.owner || ''}
              onChange={(e) => onPetChange({ owner: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Pet Image</Label>
            <ImageUploader
              imageUrl={pet.imageUrl || ''}
              onImageChange={(url) => onPetChange({ imageUrl: url })}
              onFileUpload={(fileData) => onPetChange(fileData)}
              placeholder="Upload a pet image or enter URL"
              disabled={isUploading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={pet.notes || ''}
              onChange={(e) => onPetChange({ notes: e.target.value })}
              placeholder="Any additional information about the pet"
              rows={3}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="fixed bottom-0 bg-background pt-4 pb-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={onAddPet}
            className="w-full sm:w-auto"
            disabled={!pet.name || !pet.species || !pet.breed || !pet.owner}
          >
            Add Pet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPetDialog;