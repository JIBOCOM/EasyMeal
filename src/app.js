// src/App.js
import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";

// Pages
import Login     from "./pages/Login";
import Home      from "./pages/Home";
import Planning  from "./pages/Planning";
import Recipes   from "./pages/Recipes";
import Fridge    from "./pages/Fridge";
import Shopping  from "./pages/Shopping";
import Nutrition from "./pages/Nutrition";
import CookMode  from "./pages/CookMode";
import Profile   from "./pages/Profile";

import "./styles/global.css";

// ─────────────────────────────────────────────
// Contexte Auth
// ─────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─────────────────────────────────────────────
// Route protégée
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
// Layout principal — Navbar + contenu
// ─────────────────────────────────────────────
function AppLayout({ children }) {
  const location = useLocation();
  const noNavbar =
    location.pathname.startsWith("/cook") ||
    location.pathname === "/login"        ||
    location.pathname === "/register";

  return (
    <>
      {!noNavbar && <Navbar />}
      <main className={noNavbar ? "app-main app-main--full" : "app-main"}>
        {children}
      </main>
    </>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // TODO (P1) : valider le token via GET /api/profile
      setUser({ token });
    }
    setLoadingAuth(false);
  }, []);

  const login = (userData) => {
    // userData = { token, user: { id, name, email } }  ← format renvoyé par le backend
    const token = userData.token ?? userData;
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const authValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  if (loadingAuth) return null;

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <AppLayout>
          <Routes>

            {/* ── Publiques ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<div>Page Register — à implémenter</div>} />

            {/* ── Protégées ── */}
            <Route path="/" element={
              <ProtectedRoute><Home /></ProtectedRoute>
            } />
            <Route path="/planning" element={
              <ProtectedRoute><Planning /></ProtectedRoute>
            } />
            <Route path="/recipes" element={
              <ProtectedRoute><Recipes /></ProtectedRoute>
            } />
            <Route path="/fridge" element={
              <ProtectedRoute><Fridge /></ProtectedRoute>
            } />
            <Route path="/shopping" element={
              <ProtectedRoute><Shopping /></ProtectedRoute>
            } />
            <Route path="/nutrition" element={
              <ProtectedRoute><Nutrition /></ProtectedRoute>
            } />
            <Route path="/cook/:id" element={
              <ProtectedRoute><CookMode /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AppLayout>
      </Router>
    </AuthContext.Provider>
  );
}
