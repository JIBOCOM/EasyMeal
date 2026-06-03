// src/App.js
// Routeur React, layout global
// Auth géré en dehors de ce projet — utilisateur toujours considéré connecté

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
// Pas de login/register dans ce projet.
// Le token est injecté par le système d'auth externe.
// TODO (P1) : remplacer setUser({ token: "dev" }) par
//             la validation du token via GET /api/profile
// ─────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─────────────────────────────────────────────
// Layout — Navbar + contenu
// CookMode = plein écran, pas de navbar
// ─────────────────────────────────────────────
function AppLayout({ children }) {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/cook");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className="app-main">{children}</main>
    </>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          // TODO (P1) : valider le token via GET /api/profile
          // const res  = await fetch("/api/profile", {
          //   headers: { Authorization: `Bearer ${token}` }
          // });
          // const data = await res.json();
          // setUser({ token, ...data });

          // Pour l'instant : token accepté tel quel
          setUser({ token });
        } else {
          // Pas de token — on crée un utilisateur anonyme
          // pour que toutes les pages restent accessibles
          // TODO (P1) : remplacer par une vraie gestion du token
          setUser({ token: "anonymous" });
        }
      } catch (err) {
        // En cas d'erreur réseau, on reste accessible quand même
        setUser({ token: "anonymous" });
      } finally {
        setLoadingAuth(false);
      }
    }

    initAuth();
  }, []);

  const login = (userData) => {
    localStorage.setItem("token", userData.token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    // Pas de redirection vers /login — on remet un user anonyme
    setUser({ token: "anonymous" });
  };

  const authValue = {
    user,
    isAuthenticated: true, // toujours vrai — auth géré en externe
    login,
    logout,
  };

  // Évite un flash pendant l'init
  if (loadingAuth) return null;

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <AppLayout>
          <Routes>

            <Route path="/"          element={<Home />}      />
            <Route path="/planning"  element={<Planning />}  />
            <Route path="/recipes"   element={<Recipes />}   />
            <Route path="/fridge"    element={<Fridge />}    />
            <Route path="/shopping"  element={<Shopping />}  />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/profile"   element={<Profile />}   />

            {/* CookMode reçoit l'id de la recette en param */}
            <Route path="/cook/:id"  element={<CookMode />}  />

            {/* Fallback — toute URL inconnue → accueil */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AppLayout>
      </Router>
    </AuthContext.Provider>
  );
}
