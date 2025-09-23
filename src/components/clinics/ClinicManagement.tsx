// components/clinics/ClinicManagement.tsx
import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Users, MapPin, Trash2, Phone, Mail, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ClinicCard from "./ClinicCard";
import ClinicForm from "./ClinicForm";
import ClinicDetails from "./ClinicDetails";
import { Clinic, ClinicFormValues } from "./types/clinic";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface ClinicManagementProps {
  initialClinics?: Clinic[];
}

const ClinicManagement: React.FC<ClinicManagementProps> = ({ initialClinics = [] }) => {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isAddClinicDialogOpen, setIsAddClinicDialogOpen] = useState(false);
  const [isViewClinicDialogOpen, setIsViewClinicDialogOpen] = useState(false);
  const [isEditClinicDialogOpen, setIsEditClinicDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, getToken } = useAuth();
  const { toast } = useToast();

  const [newClinic, setNewClinic] = useState<ClinicFormValues>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    manager: "",
    logoUrl: "",
    type: "",
    notes: "",
  });
  const fetchClinics = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const token = getToken();
      const response = await fetch('/api/clinics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      } else {
        throw new Error('Failed to fetch clinics');
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast({
        title: "Error",
        description: "Failed to load clinics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [user]);

  const filteredClinics = clinics.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.manager.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === "all" || clinic.type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleInputChange = (field: keyof ClinicFormValues, value: string) => {
    setNewClinic({ ...newClinic, [field]: value });
  };

  const handleAddClinic = async () => {
    if (!user) return;
    
    if (
      newClinic.name &&
      newClinic.address &&
      newClinic.city &&
      newClinic.manager
    ) {
      try {
        setIsUploading(true);
        const token = getToken();
        const response = await fetch('/api/clinics', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newClinic,
            logoUrl: newClinic.logoUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${newClinic.name.substring(0, 3)}&backgroundColor=4f46e5`,
          }),
        });

        if (response.ok) {
          const addedClinic = await response.json();
          setClinics([...clinics, addedClinic]);
          setNewClinic({
            name: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            phone: "",
            email: "",
            manager: "",
            logoUrl: "",
            type: "",
            notes: "",
          });
          setIsAddClinicDialogOpen(false);
          toast({
            title: "Success",
            description: "Clinic added successfully.",
          });
        } else {
          throw new Error('Failed to add clinic');
        }
      } catch (error) {
        console.error('Error adding clinic:', error);
        toast({
          title: "Error",
          description: "Failed to add clinic. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleViewClinic = (clinic: Clinic) => {
    try {
      setSelectedClinic(clinic);
      setIsViewClinicDialogOpen(true);
    } catch (error) {
      console.error("Error opening view dialog:", error);
    }
  };

  const openDeleteConfirmation = (id: string) => {
    setSelectedClinic(clinics.find((clinic) => clinic.id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClinic = async () => {
    if (!user || !selectedClinic) return;
    
    try {
      const token = getToken();
      const response = await fetch(`/api/clinics/${selectedClinic.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setClinics(clinics.filter((clinic) => clinic.id !== selectedClinic.id));
        setIsViewClinicDialogOpen(false);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Success",
          description: "Clinic deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete clinic');
      }
    } catch (error) {
      console.error('Error deleting clinic:', error);
      toast({
        title: "Error",
        description: "Failed to delete clinic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClinic = () => {
    if (selectedClinic) {
      setNewClinic({
        name: selectedClinic.name,
        address: selectedClinic.address,
        city: selectedClinic.city,
        state: selectedClinic.state,
        zipCode: selectedClinic.zipCode,
        phone: selectedClinic.phone,
        email: selectedClinic.email,
        manager: selectedClinic.manager,
        logoUrl: selectedClinic.logoUrl,
        type: selectedClinic.type,
        notes: selectedClinic.notes || "",
      });
      setIsEditClinicDialogOpen(true);
      setIsViewClinicDialogOpen(false);
    }
  };

  const saveEditedClinic = async () => {
    if (!user || !selectedClinic) return;
    
    if (
      selectedClinic &&
      newClinic.name &&
      newClinic.address &&
      newClinic.city &&
      newClinic.manager
    ) {
      try {
        setIsUploading(true);
        const token = getToken();
        const response = await fetch(`/api/clinics/${selectedClinic.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newClinic),
        });

        if (response.ok) {
          const updatedClinic = await response.json();
          setClinics(clinics.map((clinic) => 
            clinic.id === selectedClinic.id ? updatedClinic : clinic
          ));
          setIsEditClinicDialogOpen(false);
          setNewClinic({
            name: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            phone: "",
            email: "",
            manager: "",
            logoUrl: "",
            type: "",
            notes: "",
          });
          toast({
            title: "Success",
            description: "Clinic updated successfully.",
          });
        } else {
          throw new Error('Failed to update clinic');
        }
      } catch (error) {
        console.error('Error updating clinic:', error);
        toast({
          title: "Error",
          description: "Failed to update clinic. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background p-6 rounded-lg w-full">
     <div className="flex flex-col gap-4 items-start sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-[#F0F4FF] to-[#E0ECFF] rounded-xl w-fullp-0 sm:p-5 shadow-sm mb-8">
  <h1 className="text-2xl font-bold">Clinic Management</h1>
  <Dialog open={isAddClinicDialogOpen} onOpenChange={setIsAddClinicDialogOpen}>
  <DialogTrigger asChild>
    <Button className="flex items-center gap-2">
      <Plus size={16} />
      Add Clinic
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4">
      <DialogTitle>
        <div className="relative -mt-6 bg-[#272E3F] text-white text-center pt-0 pb-0 rounded-b-[110px] overflow-hidden w-[40%] mx-auto">
          <h2 className="text-lg font-semibold z-10 relative">Add New Clinic</h2>
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 500 50"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C125,50 375,50 500,0 L500,50 L0,50 Z" fill="#272E3F" />
          </svg>
        </div>
      </DialogTitle>
      <DialogDescription className="pt-2">
        Enter the details of the new clinic to add to your records.
      </DialogDescription>
    </DialogHeader>
    
    <div className="overflow-y-auto px-6 flex-1">
      <ClinicForm 
        clinic={newClinic} 
        onInputChange={handleInputChange} 
        isUploading={isUploading} 
      />
    </div>
    
    <DialogFooter className="px-6 py-4 border-t bg-background mt-auto">
      <Button
        variant="outline"
        onClick={() => setIsAddClinicDialogOpen(false)}
      >
        Cancel
      </Button>
      <Button onClick={handleAddClinic} disabled={isUploading}>
        {isUploading ? "Adding..." : "Add Clinic"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</div>


      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search clinics by name, city, or manager"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <SelectValue placeholder="All Types" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Small Animal">Small Animal</SelectItem>
            <SelectItem value="Large Animal">Large Animal</SelectItem>
            <SelectItem value="Mixed Practice">Mixed Practice</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
            <SelectItem value="Specialty">Specialty</SelectItem>
            <SelectItem value="Full Service">Full Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredClinics.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            No clinics found. Try adjusting your search or add a new clinic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClinics.map((clinic) => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              onView={() => handleViewClinic(clinic)}
              onEdit={() => {
                setSelectedClinic(clinic);
                handleEditClinic();
              }}
              onDelete={() => openDeleteConfirmation(clinic.id)}
            />
          ))}
        </div>
      )}
       <Dialog
        open={isViewClinicDialogOpen}
        onOpenChange={(open) => {
          setIsViewClinicDialogOpen(open);
          if (!open) setSelectedClinic(null); 
        }}
      >
        <DialogContent className="w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedClinic ? (
            <div className="p-4">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedClinic.logoUrl}
                  alt={`${selectedClinic.name} logo`}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-xl font-bold">{selectedClinic.name}</h2>
                  <Badge>{selectedClinic.type}</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p>{selectedClinic.address}</p>
                        <p>{selectedClinic.city}, {selectedClinic.state} {selectedClinic.zipCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <p>{selectedClinic.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <p>{selectedClinic.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <p>Manager: {selectedClinic.manager}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Clinic Details</h3>
                  <p className="text-muted-foreground">
                    {selectedClinic.notes || "No additional details available."}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
              <Card className="bg-[#F6F8FA] transition-transform duration-300 hover:scale-105">
  <CardContent className="p-4">
    <p className="text-sm text-muted-foreground">Pets</p>
    <p className="text-2xl font-bold">{selectedClinic.petCount}</p>
  </CardContent>
</Card>
                     <Card className="bg-[#F6F8FA] transition-transform duration-300 hover:scale-105">
  <CardContent className="p-4">
    <p className="text-sm text-muted-foreground">Pets</p>
    <p className="text-2xl font-bold">{selectedClinic.petCount}</p>
  </CardContent>
</Card>
                     <Card className="bg-[#F6F8FA] transition-transform duration-300 hover:scale-105">
  <CardContent className="p-4">
    <p className="text-sm text-muted-foreground">Pets</p>
    <p className="text-2xl font-bold">{selectedClinic.petCount}</p>
  </CardContent>
</Card>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-6">
                <Button
                  variant="outline"
                  onClick={() => openDeleteConfirmation(selectedClinic.id)}
                  className="gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewClinicDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={handleEditClinic} className="gap-2">
                    <Edit size={16} />
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">No clinic selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Clinic Dialog */}
      <Dialog open={isEditClinicDialogOpen} onOpenChange={setIsEditClinicDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="relative -mt-6 bg-[#272E3F] text-white text-center pt-0 pb-0 rounded-b-[110px] overflow-hidden w-[40%] mx-auto">
                <h2 className="text-lg font-semibold z-10 relative">Edit Clinic</h2>
                <svg
                  className="absolute bottom-0 left-0 w-full"
                  viewBox="0 0 500 50"
                  preserveAspectRatio="none"
                >
                  <path d="M0,0 C125,50 375,50 500,0 L500,50 L0,50 Z" fill="#272E3F" />
                </svg>
              </div>
            </DialogTitle>
            <DialogDescription>
              Update the details of {selectedClinic?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1">
            <ClinicForm
              clinic={newClinic}
              onInputChange={handleInputChange}
              isUploading={isUploading}
            />
          </div>
          <DialogFooter className="pt-4 bottom-0 bg-white border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditClinicDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedClinic} disabled={isUploading}>
              {isUploading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedClinic?.name} from your
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClinic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClinicManagement;