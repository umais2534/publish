import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ClinicFormProps {
  clinic: {
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
  };
  onInputChange: (field: string, value: string) => void;
  onFileUpload: (fileData: {imageData: string, imageType: string}) => void;
  isUploading: boolean;
}

// Add onFileUpload to the destructured parameters
const ClinicForm: React.FC<ClinicFormProps> = ({ 
  clinic, 
  onInputChange, 
  onFileUpload, // Add this line
  isUploading 
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Label htmlFor="name">Clinic Name</Label>
        <Input
          id="name"
          value={clinic.name}
          onChange={(e) => onInputChange("name", e.target.value)}
          placeholder="Main Street Veterinary Clinic"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={clinic.address}
            onChange={(e) => onInputChange("address", e.target.value)}
            placeholder="123 Main Street"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={clinic.city}
            onChange={(e) => onInputChange("city", e.target.value)}
            placeholder="Springfield"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={clinic.state}
            onChange={(e) => onInputChange("state", e.target.value)}
            placeholder="IL"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            value={clinic.zipCode}
            onChange={(e) => onInputChange("zipCode", e.target.value)}
            placeholder="62701"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Clinic Type</Label>
          <Select
            value={clinic.type}
            onValueChange={(value) => onInputChange("type", value)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Small Animal">Small Animal</SelectItem>
              <SelectItem value="Large Animal">Large Animal</SelectItem>
              <SelectItem value="Mixed Practice">Mixed Practice</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="Specialty">Specialty</SelectItem>
              <SelectItem value="Full Service">Full Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={clinic.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={clinic.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            placeholder="info@clinic.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="manager">Clinic Manager</Label>
        <Input
          id="manager"
          value={clinic.manager}
          onChange={(e) => onInputChange("manager", e.target.value)}
          placeholder="Dr. Sarah Johnson"
        />
      </div>

      <div className="flex flex-col gap-2">
        <ImageUploader
          imageUrl={clinic.logoUrl}
          onFileUpload={onFileUpload} // This should work now
          onImageChange={(url) => onInputChange("logoUrl", url)}
          label="Clinic Logo"
          placeholder="Upload a logo image or enter URL"
          disabled={isUploading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={clinic.notes || ""}
          onChange={(e) => onInputChange("notes", e.target.value)}
          placeholder="Additional information about the clinic"
        />
      </div>
    </div>
  );
};

export default ClinicForm;