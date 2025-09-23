import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface PetSearchFilterProps {
  searchTerm: string;
  selectedSpecies: string;
  onSearchChange: (value: string) => void;
  onSpeciesChange: (value: string) => void;
}

const PetSearchFilter = ({
  searchTerm,
  selectedSpecies,
  onSearchChange,
  onSpeciesChange,
}: PetSearchFilterProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1 relative max-w-md w-5/6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search pets by name, breed, or owner"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={selectedSpecies} onValueChange={onSpeciesChange}>
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <SelectValue placeholder="All Species" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Species</SelectItem>
          <SelectItem value="Dog">Dogs</SelectItem>
          <SelectItem value="Cat">Cats</SelectItem>
          <SelectItem value="Bird">Birds</SelectItem>
          <SelectItem value="Rabbit">Rabbits</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PetSearchFilter;