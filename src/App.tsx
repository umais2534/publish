import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./components/auth/AuthCallback";

// Auth Pages
import LoginPage from "./components/auth/LoginPage02";
import RegisterPage from "./components/auth/RegisterPage";
import PaywallPage from "./components/auth/PaywallPage";

// Dashboard Pages
import Dashboard from "./components/dashboard/Dashboard";
import TranscribePage from "./components/transcription/TranscribePage";
import HistoryPage from "./components/transcription/HistoryPage";
import PetsPage from "./components/pets/PetsPage";
import ClinicsPage from "./components/clinics/ClinicsPage";
import ProfilePage from "./components/profile/ProfilePage";
import FilesPage from "./components/files/FilesPage";
import CallsPage from "./components/calls/CallsPage";
import VisitTypeTemplatesPage from "./components/transcription/VisitTypeTemplatesPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AudioFiles from "./components/transcription/components/AudioFiles";

function App() {
  return (
    <AuthProvider>
      {/* <UserProvider> */}
        <Suspense fallback={<p className="p-4">Loading...</p>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/paywall"
              element={
                <ProtectedRoute>
                  <PaywallPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
            <Route path="/auth-callback" element={<AuthCallbackPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transcribe" element={<TranscribePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/clinics" element={<ClinicsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/calls" element={<CallsPage />} />
              <Route path="/templates" element={<VisitTypeTemplatesPage />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
              // Add this route to your routing configuration
<Route path="/audio-files" element={<AudioFiles />} />
            </Route>

            {/* Root Redirect */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      {/* </UserProvider> */}
    </AuthProvider>
  );
}

export default App;