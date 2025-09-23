import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FileManager from "@/components/files/FileManager";

const FilesPage = () => {
  return (
    <DashboardLayout>
      <FileManager />
    </DashboardLayout>
  );
};

export default FilesPage;
