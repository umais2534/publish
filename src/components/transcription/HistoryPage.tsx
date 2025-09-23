import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TranscriptionHistory from "@/components/transcription/TranscriptionHistory";

const HistoryPage = () => {
  return (
    <DashboardLayout>
      <TranscriptionHistory />
    </DashboardLayout>
  );
};

export default HistoryPage;
