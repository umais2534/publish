import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CallHistory from "@/components/calls/CallHistory";

const CallsPage = () => {
  return (
    <DashboardLayout>
      <CallHistory />
    </DashboardLayout>
  );
};

export default CallsPage;
