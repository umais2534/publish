import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PetManagementHeaderProps {
  onAddPet: () => void;
}

const PetManagementHeader = ({ onAddPet }: PetManagementHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 bg-gradient-to-r from-[#F0F4FF] to-[#E0ECFF] rounded-xl w-full p-0 sm:p-5 shadow-sm gap-4">
      <h1 className="text-2xl font-bold">Pet Management</h1>
      <Button className="flex items-center gap-2 self-center sm:self-auto" onClick={onAddPet}>
        <Plus size={16} />
        Add Pet
      </Button>
    </div>
  );
};

export default PetManagementHeader;
