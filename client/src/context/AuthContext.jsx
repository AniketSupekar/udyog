import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as logoutApi } from "../services/auth.api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getMe();
        setUser(res.data.data);
      } catch {
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Call this after login or verifyEmail to store token
  const saveToken = (token) => {
    if (token) localStorage.setItem("token", token);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, saveToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);