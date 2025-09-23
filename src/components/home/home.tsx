// Home.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { quickAccessCardData } from "./data/quickAccessCards";
import QuickAccessCard from "./components/QuickAccessCard";
import { useAuth } from "@/context/AuthContext";
import TranscriptionCard from "./components/TranscriptionCard";
import StatCard from "./components/StatCard";
import { recentTranscriptions } from "./data/recentTranscriptions";

const Home = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [displayUser, setDisplayUser] = useState<{name: string, email?: string} | null>(null);
  
  useEffect(() => {
    // Get user from multiple sources with priority
    const getDisplayUser = () => {
      // 1. First try context user
      if (user) {
        return user;
      }
      
      // 2. Try localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
        }
      }
      
      // 3. Try to get from Auth0 if available
      if (window.auth0 && isAuthenticated) {
        // This would need proper Auth0 client implementation
        return { name: "Authenticated User" };
      }
      
      return null;
    };
    
    setDisplayUser(getDisplayUser());
  }, [user, isAuthenticated]);

  // Get the best available display name
  const getDisplayName = () => {
    if (!displayUser) return "Guest";
    
    // Prioritize name, then email, then fallback
    return displayUser.name || 
           displayUser.email || 
           "Guest";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const quickAccessCards = quickAccessCardData.map((item) => ({
    ...item,
    icon: <item.icon className="h-8 w-8 text-accent-purple-500" />,
    action: () => navigate(item.path),
  }));

  return (
    <div className="bg-background min-h-screen p-0 sm:p-4 bg-gradient-to-b from-white to-primary-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.section
          className="bg-gradient-to-r from-[#F0F4FF] to-[#E0ECFF] rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1
            className="text-3xl font-bold tracking-tight text-[#1E293B]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            Welcome, {getDisplayName()}
          </motion.h1>
          <motion.p
            className="text-[#64748B] mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Manage your veterinary transcriptions and patient records
          </motion.p>
        </motion.section>

        {/* Quick Access */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessCards.map((card, idx) => {
              const col = idx % 3;
              const borderColorClass =
                col === 0
                  ? "border-gray-250"
                  : col === 1
                  ? "border-gray-300"
                  : "border-gray-350";

              return <QuickAccessCard key={idx} card={card} borderColorClass={borderColorClass} />;
            })}
          </div>
        </section>

        {/* Recent Transcriptions */}
        <section className="space-y-4">
          <div className="flex flex-col [@media(min-width:400px)]:flex-row [@media(min-width:400px)]:justify-between [@media(min-width:400px)]:items-center items-center gap-2">
            <h2 className="text-xl font-semibold text-center [@media(min-width:400px)]:text-left">Recent Transcriptions</h2>
            <Button
              variant="outline"
              onClick={() => navigate("/history")}
              className="w-full max-w-[200px] [@media(min-width:400px)]:w-auto"
            >
              View All <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentTranscriptions.map((t) => (
              <TranscriptionCard key={t.id} transcription={t} navigate={navigate} />
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Transcriptions" value="128" />
          <StatCard title="Registered Pets" value="45" />
          <StatCard title="Active Clinics" value="3" />
        </section>
      </div>
    </div>
  );
};

export default Home;