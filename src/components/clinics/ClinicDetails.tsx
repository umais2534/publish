import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Users, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ClinicDetailsProps {
  clinic: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    manager: string;
    logoUrl: string;
    type: string;
    notes?: string;
    petCount: number;
  };
  onDelete: () => void;
  onEdit: () => void;
  onClose: () => void;
}

const ClinicDetails: React.FC<ClinicDetailsProps> = ({ clinic, onDelete, onEdit, onClose }) => {
  return (
    <>
      <div className="flex items-center gap-4">
        <motion.div
          whileHover="hover"
          initial="initial"
          animate="initial"
          variants={{
            initial: { scale: 1, rotate: 0, y: 0, boxShadow: "none" },
            hover: {
              scale: 1.1,
              rotate: [0, 2, -2, 2, -2, 0],
              y: -4,
              boxShadow: "0 0 12px rgba(0, 120, 255, 0.5)",
              transition: {
                duration: 0.6,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
              },
            },
          }}
          className="rounded-full"
        >
          <Avatar className="h-16 w-16">
            <AvatarImage src={clinic.logoUrl} alt={clinic.name} />
            <AvatarFallback>
              {clinic.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div>
          <h2 className="text-xl font-semibold">{clinic.name}</h2>
          <Badge className="mt-1">{clinic.type}</Badge>
        </div>
      </div>

      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPin size={14} className="mr-2 mt-0.5 text-muted-foreground" />
                <span>
                  {clinic.address}, {clinic.city}, {clinic.state} {clinic.zipCode}
                </span>
              </div>
              <div className="flex items-center">
                <Phone size={14} className="mr-2 text-muted-foreground" />
                <span>{clinic.phone}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail size={14} className="mr-2 text-muted-foreground" />
                <span>{clinic.email}</span>
              </div>
              <div className="flex items-center">
                <Users size={14} className="mr-2 text-muted-foreground" />
                <span>Manager: {clinic.manager}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Clinic </h4>
          <p className="text-sm text-muted-foreground">
            {clinic.notes || "No additional details available for this clinic."}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="transition-transform duration-300 hover:scale-105 text-center p-4 rounded shadow-md bg-[linear-gradient(270deg,#EAF1FF,#d4e4ff,#EAF1FF)] bg-[length:200%_200%] animate-[gradientMove_6s_linear_infinite]">
              <CardContent>
                <p className="text-sm text-muted-foreground">Registered Pets</p>
                <p className="text-2xl font-bold">{clinic.petCount}</p>
              </CardContent>
            </Card>

            <Card className="transition-transform duration-300 hover:scale-105 text-center p-4 rounded shadow-md bg-[linear-gradient(270deg,#EAF1FF,#d4e4ff,#EAF1FF)] bg-[length:200%_200%] animate-[gradientMove_6s_linear_infinite]">
              <CardContent>
                <p className="text-sm text-muted-foreground">Transcriptions</p>
                <p className="text-2xl font-bold">24</p>
              </CardContent>
            </Card>

            <Card className="transition-transform duration-300 hover:scale-105 text-center p-4 rounded shadow-md bg-[linear-gradient(270deg,#EAF1FF,#d4e4ff,#EAF1FF)] bg-[length:200%_200%] animate-[gradientMove_6s_linear_infinite]">
              <CardContent>
                <p className="text-sm text-muted-foreground">Last Visit</p>
                <p className="text-lg font-medium">2 days ago</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
        <Button
          variant="outline"
          onClick={onDelete}
          className="gap-2 w-full sm:w-auto"
        >
          <Trash2 size={16} />
          Delete Clinic
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button className="gap-2 w-full sm:w-auto" onClick={onEdit}>
            <Edit size={16} />
            Edit Clinic
          </Button>
        </div>
      </div>
    </>
  );
};

export default ClinicDetails;