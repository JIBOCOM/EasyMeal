\// src/App.js
// Créé par P3 — Routeur React, layout global, routes protégées
// Point d'entrée de toute la navigation de l'app

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
import Home       from "./pages/Home";
import Planning   from "./pages/Planning";
import Recipes    from "./pages/Recipes";
import Fridge     from "./pages/Fridge";
import Shopping   from "./pages/Shopping";
import Nutrition  from "./pages/Nutrition";
import CookMode   from "./pages/CookMode";
import Profile    from "./pages/Profile";

import "./styles/global.css";

// ─────────────────────────────────────────────
// Contexte Auth — partagé dans toute l'app
// ─────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─────────────────────────────────────────────
// Route protégée — redirige si non connecté
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

  // CookMode = plein écran, pas de navbar
  const hideNavbar = location.pathname.startsWith("/cook");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className="app-main">{children}</main>
    </>
  );
}

// ─────────────────────────────────────────────
// App — Provider auth + Router + Routes
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Vérifie si un token est déjà stocké au démarrage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // TODO (P1) : valider le token via GET /api/profile
      // Pour l'instant on considère le token valide s'il existe
      setUser({ token });
    }
    setLoadingAuth(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("token", userData.token);
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

  // Évite un flash de redirection pendant la vérification du token
  if (loadingAuth) return null;

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <AppLayout>
          <Routes>

            {/* ── Routes publiques ── */}
            <Route path="/login"    element={<div>Page Login — à implémenter (P2)</div>} />
            <Route path="/register" element={<div>Page Register — à implémenter (P2)</div>} />

            {/* ── Routes protégées ── */}
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

            {/* CookMode reçoit l'id de la recette en param */}
            <Route path="/cook/:id" element={
              <ProtectedRoute><CookMode /></ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            {/* Fallback — toute URL inconnue → accueil */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AppLayout>
      </Router>
    </AuthContext.Provider>
  );
}
