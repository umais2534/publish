import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pet } from "../../types";


interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pet: Pet) => void;
}

export function AddPetDialog({ open, onOpenChange, onSave }: AddPetDialogProps) {
  const [newPet, setNewPet] = useState<Omit<Pet, 'id'>>({
    name: "",
    species: "",
    breed: "",
    owner: "",
  });

  const handleSave = () => {
    if (!newPet.name || !newPet.species || !newPet.breed || !newPet.owner) {
      alert("Please fill in all required fields");
      return;
    }

    onSave({
      id: `pet-${Date.now()}`,
      ...newPet
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="pet-name">Pet Name</Label>
              <Input
                id="pet-name"
                value={newPet.name}
                onChange={(e) =>
                  setNewPet({ ...newPet, name: e.target.value })
                }
                placeholder="Max"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="species">Species</Label>
              <Select
                value={newPet.species}
                onValueChange={(value) =>
                  setNewPet({ ...newPet, species: value })
                }
              >
                <SelectTrigger id="species">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={newPet.breed}
                onChange={(e) =>
                  setNewPet({ ...newPet, breed: e.target.value })
                }
                placeholder="Golden Retriever"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={newPet.owner}
                onChange={(e) =>
                  setNewPet({ ...newPet, owner: e.target.value })
                }
                placeholder="John Smith"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Pet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}