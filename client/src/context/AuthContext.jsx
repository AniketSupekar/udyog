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
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ LOGOUT FUNCTION
  const logout = async () => {
    try {
      await logoutApi(); // backend logout
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      setUser(null); // frontend logout (critical)
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);