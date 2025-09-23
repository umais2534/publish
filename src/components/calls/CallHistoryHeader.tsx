import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NewCallDialog from "./NewCallDialog";

interface CallHistoryHeaderProps {
  onNewCall: () => void;
}

const CallHistoryHeader = ({ onNewCall }: CallHistoryHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-[#F0F4FF] to-[#E0ECFF] rounded-xl w-full p-0 sm:p-5 shadow-sm mb-8">
      <h1 className="text-3xl font-bold">Call History</h1>
      <Button className="flex items-center gap-2 self-start sm:self-auto" onClick={onNewCall}>
        <Plus size={16} />
        New Call
      </Button>
    </div>
  );
};

export default CallHistoryHeader;
