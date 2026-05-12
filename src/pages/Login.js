// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import "./Login.css";

const API_URL = "http://localhost:5000/api";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Redirige vers la page demandée avant la déconnexion, sinon vers /
  const from = location.state?.from?.pathname || "/";

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email)    return setError("Veuillez saisir votre email.");
    if (!password) return setError("Veuillez saisir votre mot de passe.");

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Email ou mot de passe incorrect.");
        return;
      }

      // data doit contenir { token, user: { name, email, ... } }
      login(data);
      navigate(from, { replace: true });

    } catch (err) {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">EasyMeal</div>
        <div className="login-tagline">Planificateur de repas</div>

        <div className="login-feat">
          <div className="login-feat-icon">
            <i className="ti ti-snowflake" aria-hidden="true" />
          </div>
          <div>
            <div className="login-feat-title">Gérez votre frigo</div>
            <div className="login-feat-sub">Sachez toujours ce que vous avez en stock</div>
          </div>
        </div>

        <div className="login-feat">
          <div className="login-feat-icon">
            <i className="ti ti-calendar" aria-hidden="true" />
          </div>
          <div>
            <div className="login-feat-title">Planifiez vos repas</div>
            <div className="login-feat-sub">Organisez votre semaine sans effort</div>
          </div>
        </div>

        <div className="login-feat">
          <div className="login-feat-icon">
            <i className="ti ti-shopping-cart" aria-hidden="true" />
          </div>
          <div>
            <div className="login-feat-title">Optimisez vos courses</div>
            <div className="login-feat-sub">Réduisez le gaspillage et les dépenses</div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-title">Bon retour</div>
        <div className="login-sub">Connectez-vous à votre compte</div>

        {error && (
          <div className="login-error" role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label className="login-label" htmlFor="email">Adresse email</label>
          <input
            id="email"
            className="login-input"
            type="email"
            placeholder="marie@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />

          <label className="login-label" htmlFor="password">Mot de passe</label>
          <div className="login-input-wrap">
            <input
              id="password"
              className="login-input"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-eye-btn"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <i className={`ti ${showPwd ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
            </button>
          </div>

          <a href="/forgot-password" className="login-forgot">Mot de passe oublié ?</a>

          <button className="login-btn" type="submit" disabled={loading}>
            <span>{loading ? "Connexion…" : "Se connecter"}</span>
            <i className={`ti ${loading ? "ti-loader-2" : "ti-arrow-right"}`} aria-hidden="true" />
          </button>
        </form>

        <div className="login-register">
          Pas encore de compte ?{" "}
          <a href="/register">Créer un compte</a>
        </div>
      </div>
    </div>
  );
}
