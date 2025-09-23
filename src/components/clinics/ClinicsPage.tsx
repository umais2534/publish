import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClinicManagement from "@/components/clinics/ClinicManagement";

const ClinicsPage = () => {
  return (
    <DashboardLayout>
      <ClinicManagement />
    </DashboardLayout>
  );
};

export default ClinicsPage;
