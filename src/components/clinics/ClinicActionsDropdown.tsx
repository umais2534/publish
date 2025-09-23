import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ClinicActionsDropdownProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ClinicActionsDropdown: React.FC<ClinicActionsDropdownProps> = ({
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2" size={16} />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2" size={16} />
          Edit Clinic
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>
          <Trash2 className="mr-2" size={16} />
          Delete Clinic
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClinicActionsDropdown;