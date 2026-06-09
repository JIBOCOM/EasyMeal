// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../App";
import { auth } from "../api";
import "../styles/Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // api.js → POST /api/auth/login → { token, user: { id, name, email } }
      const data = await auth.login({ email: form.email, password: form.password });
      login(data);               // stocke le token dans App.js + localStorage
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* ── Panneau gauche – branding ── */}
      <div className="login-brand" aria-hidden="true">
        <div className="login-brand__inner">
          <div className="login-brand__logo">
            <i className="ti ti-bowl-spoon" />
          </div>
          <h1 className="login-brand__title">EasyMeal</h1>
          <p className="login-brand__tagline">
            Planifiez vos repas,<br />
            simplifiez votre quotidien.
          </p>
          <ul className="login-brand__features">
            <li><i className="ti ti-check" /> Suggestions basées sur votre frigo</li>
            <li><i className="ti ti-check" /> Planning hebdomadaire en 1 clic</li>
            <li><i className="ti ti-check" /> Liste de courses auto-générée</li>
          </ul>
        </div>
        <div className="login-brand__bg" />
      </div>

      {/* ── Panneau droit – formulaire ── */}
      <div className="login-panel">
        <div className="login-card">

          {/* En-tête */}
          <div className="login-card__header">
            <span className="login-card__logo-sm">
              <i className="ti ti-bowl-spoon" />
            </span>
            <h2 className="login-card__title">Connexion</h2>
            <p className="login-card__sub">Bon retour parmi nous&nbsp;👋</p>
          </div>

          {/* Formulaire */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="login-field">
              <label htmlFor="email" className="login-field__label">
                Adresse e-mail
              </label>
              <div className="login-field__wrap">
                <i className="ti ti-mail login-field__icon" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="vous@exemple.fr"
                  className="login-field__input"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  aria-required="true"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="login-field">
              <label htmlFor="password" className="login-field__label">
                Mot de passe
              </label>
              <div className="login-field__wrap">
                <i className="ti ti-lock login-field__icon" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="login-field__input login-field__input--pwd"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  aria-required="true"
                />
                <button
                  type="button"
                  className="login-field__toggle"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  tabIndex={0}
                >
                  <i className={`ti ${showPwd ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="login-error" role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="ti ti-loader-2 login-btn__spinner" aria-hidden="true" />
                  Connexion…
                </>
              ) : (
                <>
                  <i className="ti ti-login" aria-hidden="true" />
                  Se connecter
                </>
              )}
            </button>

          </form>

          {/* Pied de carte */}
          <p className="login-card__footer">
            Pas encore de compte ?{" "}
            <Link to="/register" className="login-card__link">
              Créer un compte
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
