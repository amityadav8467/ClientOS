import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { setLoading(false); return; }
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password, captchaId, captchaAnswer) => {
    const res = await api.post("/api/auth/login", { email, password, captchaId, captchaAnswer });
    localStorage.setItem("accessToken", res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, inviteCode, emailOtp, captchaId, captchaAnswer) => {
    const res = await api.post("/api/auth/register", { name, email, password, inviteCode, emailOtp, captchaId, captchaAnswer });
    localStorage.setItem("accessToken", res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  // Called after password is changed to clear the first-login flag locally
  const clearFirstLogin = () => {
    setUser(prev => prev ? { ...prev, isFirstLogin: false } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchMe, clearFirstLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
