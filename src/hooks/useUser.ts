// hooks/useUser.ts
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";

export interface UserData {
  Id: string;
  FullName: string;
  Email: string;
  Auth0Sub: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  ProfilePicture?: string;
}

export const useUser = () => {
  const { isAuthenticated, getToken } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async (auth0Sub: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/users/by-sub/${encodeURIComponent(auth0Sub)}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user_data", JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user_data");
    localStorage.removeItem("auth0_sub");
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      try {
        if (!isAuthenticated) {
          clearUser();
          return;
        }

        const auth0Sub = localStorage.getItem("auth0_sub");
        if (!auth0Sub) {
          return;
        }

        // Check localStorage first
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          
          // Refresh user data in background
          try {
            await fetchUser(auth0Sub);
          } catch {
            // Silently fail background refresh
          }
        } else {
          await fetchUser(auth0Sub);
        }
      } catch (err) {
        console.error("User data initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [isAuthenticated, fetchUser, clearUser]);

  // Function to manually update user data
  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/user/${user.Id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(err instanceof Error ? err : new Error("Failed to update user"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  return { 
    user, 
    loading, 
    error,
    fetchUser,
    updateUser,
    clearUser
  };
};