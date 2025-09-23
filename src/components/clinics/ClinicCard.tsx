// components/clinics/ClinicCard.tsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ClinicActionsDropdown from "./ClinicActionsDropdown";

interface ClinicCardProps {
  clinic: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    logoUrl: string;
    petCount: number;
    type: string;
  };
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onView, onEdit, onDelete }) => {
  return (
    <Card className="overflow-hidden transition-transform duration-300 hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.2)] h-full flex flex-col justify-between">
      <div className="p-4 sm:p-6 flex flex-col gap-4 flex-grow">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="rounded-full"
          >
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-transparent hover:ring-blue-400 transition duration-300">
              <AvatarImage src={clinic.logoUrl} alt={clinic.name} />
              <AvatarFallback>
                {clinic.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <ClinicActionsDropdown onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>

        <div className="flex-grow space-y-2">
          <h3 className="font-semibold text-base sm:text-lg">{clinic.name}</h3>
          <Badge className="mb-1">{clinic.type}</Badge>

          <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5" />
              <span className="break-words">
                {clinic.address}, {clinic.city}, {clinic.state} {clinic.zipCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>{clinic.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span>{clinic.petCount} pets</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-muted p-4 border-t mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm sm:text-base"
          onClick={onView}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};

export default ClinicCard;