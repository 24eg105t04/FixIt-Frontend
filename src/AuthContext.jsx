
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const ACCOUNTS_KEY = "fixit_demo_accounts";
const USER_KEY = "fixit_user";

function readAccounts() {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  function register({ name, email, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readAccounts();

    if (accounts.some((account) => account.email === normalizedEmail)) {
      return {
        success: false,
        message: "An account with this email already exists. Please log in.",
      };
    }

    // Demo only: passwords are stored in browser storage.
    // Replace this with secure backend registration before real deployment.
    const account = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    };

    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));

    const authenticatedUser = {
      name: account.name,
      email: account.email,
      role: account.role,
    };

    sessionStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);

    return { success: true, user: authenticatedUser };
  }

  function login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts().find(
      (item) => item.email === normalizedEmail
    );

    if (!account) {
      return {
        success: false,
        message: "No account found with this email. Please sign up first.",
      };
    }

    if (account.password !== password) {
      return {
        success: false,
        message: "Incorrect password. Please try again.",
      };
    }

    const authenticatedUser = {
      name: account.name,
      email: account.email,
      role: account.role,
    };

    sessionStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);

    return { success: true, user: authenticatedUser };
  }

  function logout() {
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
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
