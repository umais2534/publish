import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface NewCallDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPet: { id: string; name: string; owner: string } | null;
  onSelectPet: (pet: { id: string; name: string; owner: string } | null) => void;
}

const pets = [
  {
    id: "1",
    name: "Max",
    breed: "Golden Retriever",
    owner: "John Smith",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  },
  {
    id: "2",
    name: "Bella",
    breed: "Siamese Cat",
    owner: "Emily Johnson",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
  },
  {
    id: "3",
    name: "Charlie",
    breed: "Beagle",
    owner: "Michael Williams",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
  {
    id: "4",
    name: "Luna",
    breed: "Maine Coon",
    owner: "Sophia Brown",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  },
];

const NewCallDialog = ({
  isOpen,
  onOpenChange,
  selectedPet,
  onSelectPet,
}: NewCallDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] md:max-w-[600px]  p-0 rounded-t-[20px] max-h-[90vh] overflow-y-auto">
        <div className="relative bg-[#272E3F] text-white text-center pt-0 pb-0 rounded-b-[110px] overflow-hidden w-[40%] mx-auto">
          <h2 className="text-lg font-semibold z-10 relative">Select a Pet to Call</h2>
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 500 50"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C125,50 375,50 500,0 L500,50 L0,50 Z" fill="#272E3F" />
          </svg>
        </div>

        <div className="text-center mt-4 px-4 text-muted-foreground text-sm">
          Choose a pet to make a call to their owner.
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 px-4">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPet?.id === pet.id
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-primary/50"
              }`}
              onClick={() =>
                onSelectPet({
                  id: pet.id,
                  name: pet.name,
                  owner: pet.owner,
                })
              }
            >
              <div className="flex items-center gap-3">
                {selectedPet?.id === pet.id ? (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 0.6 }}
                  >
                    <Avatar>
                      <AvatarImage src={pet.imageUrl} />
                      <AvatarFallback>
                        {pet.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ) : (
                  <Avatar>
                    <AvatarImage src={pet.imageUrl} />
                    <AvatarFallback>
                      {pet.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pet.breed} • Owner: {pet.owner}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              if (selectedPet) {
                alert(
                  `Starting call with ${selectedPet.owner} about ${selectedPet.name}`
                );
              }
            }}
            disabled={!selectedPet}
          >
            Start Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCallDialog;