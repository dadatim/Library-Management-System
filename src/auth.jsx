// Demo-only auth. In production the server issues the session and enforces every permission;
// this file only decides what the interface shows.
import { createContext, useContext, useState } from "react";

export const ROLE_LABELS = { member: "Member", librarian: "Librarian", admin: "Admin" };
export const ROLE_BLURBS = {
  member: "Browse the catalog, see your own loans and fines, renew items.",
  librarian: "Check books out, process returns, see all loans and member fines.",
  admin: "Everything a librarian can do, plus managing the book collection.",
};

const STAFF = ["catalog:view", "catalog:checkout", "loans:view", "loans:all", "loans:return", "loans:renew", "members:view"];
const PERMISSIONS = {
  member: ["catalog:view", "loans:view", "loans:renew"],
  librarian: STAFF,
  admin: [...STAFF, "catalog:manage"],
};

// memberId links a member account to its borrower record in library.jsx
export const ACCOUNTS = [
  { id: "u1", name: "Amina Bello", role: "member", memberId: 1 },
  { id: "u2", name: "Ngozi Umeh", role: "librarian" },
  { id: "u3", name: "Bisi Adeyemi", role: "admin" },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const can = (permission) => !!user && PERMISSIONS[user.role].includes(permission);
  const login = (id) => setUser(ACCOUNTS.find((a) => a.id === id));
  const logout = () => setUser(null);
  return <AuthContext.Provider value={{ user, can, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
