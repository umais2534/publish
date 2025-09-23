import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { User, Lock, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { auth0Config } from "@/config/auth0Config";


const { domain, clientId, redirectUri, audience } = auth0Config;
const AUTH0_DOMAIN = auth0Config.domain;
const AUTH0_CLIENT_ID = auth0Config.clientId; 
const AUTH0_CALLBACK_URL = window.location.origin + "/dashboard"; 

const Auth0Integration = () => {
  const [auth0, setAuth0] = useState<any | null>(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null); 
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    const initAuth0 = async () => {
      try {
        const auth0Instance = new (window as any).auth0.WebAuth({
       
          domain: AUTH0_DOMAIN,
          clientID: AUTH0_CLIENT_ID,
          redirectUri: AUTH0_CALLBACK_URL,
          responseType: "token id_token", 
          scope: "openid profile email", 
        });
        setAuth0(auth0Instance);
        auth0Instance.checkSession({}, (err: any, authResult: any) => {
          if (err) {
            console.error("Check Session Error:", err);
            
            setLoading(false); 
          } else if (authResult) {
            handleAuthentication(authResult);
          } else {
            setLoading(false); 
          }
        });
      } catch (error) {
        console.error("Failed to initialize Auth0:", error);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize authentication.",
        });
      }
    };

    initAuth0();
  }, []);


  const handleAuthentication = useCallback(
    (authResult: any) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        localStorage.setItem("access_token", authResult.accessToken);
        localStorage.setItem("id_token", authResult.idToken);
        auth0.client.userInfo(
          authResult.accessToken,
          (err: any, profile: any) => {
            if (err) {
              console.error("Error fetching user profile:", err);
              toast({
                variant: "destructive",
                title: "Error",
                description: `Error fetching user profile: ${err.message}`,
              });
            } else {
              setUserProfile(profile);
              setIsLoggedIn(true);
              toast({
                title: "Logged In",
                description: `, ${profile.name || profile.email || "User"}!`,
              });
            }
            setLoading(false);
          },
        );
      } else if (authResult && authResult.error) {
        console.error("Authentication error:", authResult.error);
        toast({
          variant: "destructive",
          title: "Login Error",
          description: `Authentication error: ${authResult.error_description || authResult.error}`,
        });
        setLoading(false);
      }
    },
    [auth0, toast],
  );
  const login = () => {
    if (auth0) {
      setLoading(true); 
      auth0.authorize(); 
    } else {
      console.warn("Auth0 not initialized.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication service is not available.",
      });
    }
  };
  const logout = () => {
    if (auth0) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("id_token");
      setIsLoggedIn(false);
      setUserProfile(null);
      auth0.logout({
        returnTo: window.location.origin, 
      });
      toast({
        title: "Logged Out",
        description: "You have been logged out.",
      });
    } else {
      console.warn("Auth0 not initialized.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication service is not available.",
      });
    }
  };
  const getProfile = useCallback(() => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken && auth0) {
      auth0.client.userInfo(accessToken, (err: any, profile: any) => {
        if (err) {
          console.error("Error fetching user profile:", err);
          toast({
            variant: "destructive",
            title: "Error",
            description: `Error fetching user profile: ${err.message}`,
          });
        } else {
          setUserProfile(profile);
        }
      });
    }
  }, [auth0, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-4xl text-blue-500" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Auth0 Authentication
        </h1>

        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <User className="w-10 h-10 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  , {userProfile?.name || userProfile?.email || "User"}!
                </h2>
                <p className="text-gray-500">
                  Logged in with {userProfile?.email || "Unknown Provider"}
                </p>
              </div>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                User Profile:
              </h3>
              <pre className="text-sm text-gray-600 overflow-auto max-h-48">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </div>

            <Button
              onClick={logout}
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Please log in to access your profile.
            </p>
            <Button
              onClick={login}
              variant="default"
              className="w-full flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Login with Auth0
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth0Integration;
