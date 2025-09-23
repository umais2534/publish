import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pet } from "./types/petTypes";
import CallOwner from "@/components/CallOwner";
import { Trash2, Edit } from "lucide-react";

interface ViewPetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet | null;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const ViewPetDialog = ({ isOpen, onOpenChange, pet, onEdit, onDelete }: ViewPetDialogProps) => {
  if (!pet) return null;

    async function saveCallRecording(
      audioBlob: Blob,
      { petId, petName, ownerName, duration }: { petId: string; petName: string; ownerName: string; duration: number; }
    ) {
      const formData = new FormData();
      formData.append("audio", audioBlob, `${petName}-call.webm`);
      formData.append("petId", petId);
      formData.append("petName", petName);
      formData.append("ownerName", ownerName);
      formData.append("duration", duration.toString());

      const response = await fetch("/api/call-recordings", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save call recording");
      }

      return await response.json();
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[400px] max-h-[90vh] sm:max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <div className=" gap-2 relative bg-[#272E3F] text-white text-center -mt-300 -pt-10 pb-0 rounded-b-[110px] overflow-hidden w-[40%] mx-auto -mt-6">
            <span className="text-xl font-semibold">{pet.name}</span>
            <span className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
              {pet.species}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pet.breed} • {pet.age}
          </p>
        </DialogHeader>
        
        <div className="grid md:grid-cols-[1fr_2fr] gap-6 py-4">
          <div>
            <div className="rounded-lg overflow-hidden mb-4">
              <img
                src={pet.imageUrl}
                alt={pet.name}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.name}`;
                }}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Owner Information</h4>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.owner}`}
                  />
                  <AvatarFallback>
                    {pet.owner.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{pet.owner}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground">
                {pet.notes || "No notes available for this pet."}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">Recent Transcriptions</h4>
              <p className="text-sm text-muted-foreground">
                No recent transcriptions found for this pet.
              </p>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Call Owner</h4>
              <CallOwner
                ownerName={pet.owner}
                petName={pet.name}
                onCallRecorded={(audioBlob, duration) => {
                  // Save the call recording
                  saveCallRecording(audioBlob, {
                    petId: pet.id,
                    petName: pet.name,
                    ownerName: pet.owner,
                    duration: duration,
                  })
                    .then((recording) => {
                      console.log("Call recording saved:", recording);
                    })
                    .catch((error) => {
                      console.error("Failed to save call recording:", error);
                    });
                }}
              />
            </div>
          </div>
        </div>
        
      <DialogFooter className="flex justify-between sm:justify-between dialog-footer-stack">
  <Button
    variant="outline"
    onClick={() => onDelete(pet.id)}
    className="gap-2 w-full"
  >
    <Trash2 size={16} />
    Delete Pet
  </Button>
  <div className="flex gap-2 w-full justify-end">
    <Button
      variant="outline"
      onClick={() => onOpenChange(false)}
      className="w-full "
    >
      Close
    </Button>
    <Button className="gap-2 w-full mb-5" onClick={onEdit}>
      <Edit size={16} />
      Edit Pet
    </Button>
  </div>
</DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default ViewPetDialog;