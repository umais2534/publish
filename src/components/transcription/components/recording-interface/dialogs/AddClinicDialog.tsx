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
import { Clinic } from "../../types";

interface AddClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (clinic: Clinic) => void;
}

export function AddClinicDialog({ open, onOpenChange, onSave }: AddClinicDialogProps) {
  const [newClinic, setNewClinic] = useState<Omit<Clinic, 'id'>>({
    name: "",
    address: "",
    city: "",
    state: "",
  });

  const handleSave = () => {
    if (!newClinic.name) {
      alert("Please enter a clinic name");
      return;
    }

    onSave({
      id: `clinic-${Date.now()}`,
      ...newClinic
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Clinic</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="clinic-name">Clinic Name</Label>
            <Input
              id="clinic-name"
              value={newClinic.name}
              onChange={(e) =>
                setNewClinic({ ...newClinic, name: e.target.value })
              }
              placeholder="Main Street Veterinary Clinic"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newClinic.address}
                onChange={(e) =>
                  setNewClinic({ ...newClinic, address: e.target.value })
                }
                placeholder="123 Main St"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={newClinic.city}
                onChange={(e) =>
                  setNewClinic({ ...newClinic, city: e.target.value })
                }
                placeholder="Springfield"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={newClinic.state}
              onChange={(e) =>
                setNewClinic({ ...newClinic, state: e.target.value })
              }
              placeholder="IL"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Clinic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}