
import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, getAuthToken, saveAuthSession } from "./lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAuthToken()));

  useEffect(() => {
    if (!getAuthToken()) return;
    apiRequest("/api/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        saveAuthSession(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function register(credentials) {
    const result = await apiRequest("/api/auth/register", { method: "POST", body: credentials });
    saveAuthSession(result.token);
    setUser(result.user);
    return { success: true, user: result.user };
  }

  async function login(credentials) {
    const result = await apiRequest("/api/auth/login", { method: "POST", body: credentials });
    saveAuthSession(result.token);
    setUser(result.user);
    return { success: true, user: result.user };
  }

  async function logout() {
    try {
      if (getAuthToken()) await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      saveAuthSession(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
