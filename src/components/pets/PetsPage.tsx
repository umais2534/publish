import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PetManagement from "@/components/pets/PetManagement";

const PetsPage = () => {
  return (
    <DashboardLayout>
      <PetManagement />
    </DashboardLayout>
  );
};

export default PetsPage;
