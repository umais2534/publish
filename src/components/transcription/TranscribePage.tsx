import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RecordingInterface from "@/components/transcription/RecordingInterface";
// import AudioTranscriber from "@/components/transcription/AudioTranscriber"
const TranscribePage = () => {
  return (
    <DashboardLayout>
      <RecordingInterface />
   
    </DashboardLayout>
  );
};

export default TranscribePage;
