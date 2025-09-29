import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Pet } from "@/types/petTypes";
import { RefreshCw, Phone } from "lucide-react";

interface NewCallDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPet: { id: string | number; name: string; owner: string } | null;
  onSelectPet: (pet: { id: string | number; name: string; owner: string } | null) => void;
  pets: Pet[];
  isLoading: boolean;
  petsError: string | null;
  onRetryPets: () => void;
  onStartCall: () => void;
}

const NewCallDialog = ({
  isOpen,
  onOpenChange,
  selectedPet,
  onSelectPet,
  pets,
  isLoading,
  petsError,
  onRetryPets,
  onStartCall,
}: NewCallDialogProps) => {
  
  // WhatsApp call handler function
  const handleWhatsAppCall = () => {
    if (!selectedPet) {
      alert("Please select a pet first");
      return;
    }

    // Find the complete pet object from pets array to get phoneNumber
    const completePet = pets.find(pet => pet.id === selectedPet.id);
    
    if (!completePet) {
      alert("Pet information not found");
      return;
    }

    if (!completePet.phoneNumber) {
      alert(`Phone number not available for ${completePet.name}'s owner`);
      return;
    }

    // Format phone number and create WhatsApp URL
    const formattedNumber = completePet.phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedNumber}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Close the dialog
    onOpenChange(false);
    
    // Call the original onStartCall prop if needed
    onStartCall();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] md:max-w-[600px] p-0 rounded-t-[20px] max-h-[90vh] overflow-y-auto">
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

        {petsError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-red-500 mb-4 text-center">
              <p className="font-medium">Failed to load pets</p>
              <p className="text-sm mt-1">{petsError}</p>
            </div>
            <Button onClick={onRetryPets} variant="outline" className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading pets...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-6 px-4">
            {pets.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No pets found. Please add pets first in the Pet Management section.
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/pet-management'}
                  >
                    Go to Pet Management
                  </Button>
                </div>
              </div>
            ) : (
              pets.map((pet) => (
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
                          {pet.imageUrl ? (
                            <AvatarImage src={pet.imageUrl} alt={pet.name} />
                          ) : (
                            <AvatarFallback>
                              {pet.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </motion.div>
                    ) : (
                      <Avatar>
                        {pet.imageUrl ? (
                          <AvatarImage src={pet.imageUrl} alt={pet.name} />
                        ) : (
                          <AvatarFallback>
                            {pet.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div className="text-left">
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pet.species} • {pet.breed} • Owner: {pet.owner}
                      </p>
                      {pet.phoneNumber && (
                        <p className="text-xs text-green-600 mt-1">
                          📞 {pet.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleWhatsAppCall} 
            disabled={!selectedPet || !!petsError}
            className="flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Start WhatsApp Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCallDialog;