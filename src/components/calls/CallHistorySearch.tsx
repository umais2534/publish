import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CallHistorySearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const CallHistorySearch = ({ searchQuery, onSearchChange }: CallHistorySearchProps) => {
  return (
    <div className="relative max-w-md w-5/6">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        size={18}
      />
      <Input
        placeholder="Search calls by pet name, owner, or content..."
        className="pl-10"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default CallHistorySearch;