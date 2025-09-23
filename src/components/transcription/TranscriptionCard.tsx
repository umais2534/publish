import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Edit,
  Trash2,
  Share,
  Phone,
  Mic,
} from "lucide-react";

interface TranscriptionCardProps {
  transcription: {
    id: string;
    title: string;
    text: string;
    createdAt: Date;
    type: "transcription" | "call";
   
  };
   item: any; 
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  icon: React.ReactNode;
  
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  transcription,
  onView,
  onEdit,
  onDelete,
  onShare,
  
}) => {
  return (
    <Card className="w-full cursor-pointer group transition-all duration-200 ease-in-out p-4 hover:shadow-md flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          {transcription.type === "transcription" ? (
            <Mic className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Phone className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {format(new Date(transcription.createdAt), "PPPp")}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            size="icon"
            variant="ghost"
          >
            <FileText className="w-4 h-4" />
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            size="icon"
            variant="ghost"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            size="icon"
            variant="ghost"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            size="icon"
            variant="ghost"
          >
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium line-clamp-1">{transcription.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {transcription.text}
        </p>
      </div>
    </Card>
  );
};

export default TranscriptionCard;
