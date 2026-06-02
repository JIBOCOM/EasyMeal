// src/pages/CookMode.js
// Page plein écran — mode cuisine, pas de navbar
// Affiche les étapes d'une recette avec timer intégré

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "../styles/CookMode.css";

// ─────────────────────────────────────────────
// Timer — hook
// ─────────────────────────────────────────────
function useTimer(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining(r => r - 1), 1000);
    } else {
      clearInterval(ref.current);
      if (remaining === 0) setRunning(false);
    }
    return () => clearInterval(ref.current);
  }, [running, remaining]);

  const toggle = () => setRunning(r => !r);
  const reset  = () => { setRunning(false); setRemaining(seconds); };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return { display: `${mm}:${ss}`, running, toggle, reset, done: remaining === 0 };
}

// ─────────────────────────────────────────────
// Sous-composant — une étape
// ─────────────────────────────────────────────
function Step({ step, index, total, active, done, onCheck }) {
  const timer = useTimer(step.timerSeconds || 0);
  const hasTimer = !!step.timerSeconds;

  return (
    <div className={`ck-step ${active ? "ck-step--active" : ""} ${done ? "ck-step--done" : ""}`}>
      <div className="ck-step__num">
        {done
          ? <i className="ti ti-check" aria-hidden="true" />
          : index + 1
        }
      </div>
      <div className="ck-step__content">
        <p className="ck-step__text">{step.instruction}</p>

        {hasTimer && active && (
          <div className={`ck-timer ${timer.done ? "ck-timer--done" : ""}`}>
            <span className="ck-timer__display">{timer.display}</span>
            <button className="ck-timer__btn" onClick={timer.toggle} aria-label={timer.running ? "Pause" : "Démarrer"}>
              <i className={`ti ${timer.running ? "ti-player-pause" : "ti-player-play"}`} aria-hidden="true" />
              {timer.running ? "Pause" : timer.done ? "Terminé !" : "Démarrer"}
            </button>
            <button className="ck-timer__reset" onClick={timer.reset} aria-label="Réinitialiser">
              <i className="ti ti-refresh" aria-hidden="true" />
            </button>
          </div>
        )}

        {active && (
          <button className="ck-step__next" onClick={onCheck}>
            {index + 1 === total ? "Terminer la recette" : "Étape suivante"}
            <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page CookMode
// ─────────────────────────────────────────────
export default function CookMode() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [recipe, setRecipe]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true);
      setError(null);
      try {
        // TODO (API) : décommenter quand l'endpoint est prêt
        // const res  = await fetch(`/api/recipes/${id}`, {
        //   headers: { Authorization: `Bearer ${user?.token}` }
        // });
        // const data = await res.json();
        // setRecipe(data);

        // Pour l'instant : recette vide
        setRecipe(null);
      } catch (err) {
        setError("Impossible de charger la recette.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecipe();
  }, [id, user]);

  const handleNext = () => {
    if (!recipe) return;
    if (currentStep + 1 >= recipe.steps.length) {
      setCompleted(true);
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  if (loading) return (
    <div className="ck-page ck-page--center">
      <i className="ti ti-loader-2 ck-spinner" aria-hidden="true" />
    </div>
  );

  if (error) return (
    <div className="ck-page ck-page--center">
      <i className="ti ti-wifi-off" style={{fontSize:32,color:"#C47A2A"}} />
      <p style={{marginTop:12,color:"#8C7355"}}>{error}</p>
      <button className="ck-back-btn" onClick={() => navigate(-1)}>Retour</button>
    </div>
  );

  if (!recipe) return (
    <div className="ck-page ck-page--center">
      <span style={{fontSize:48}}>🍽️</span>
      <p style={{marginTop:16,color:"#8C7355",fontSize:15}}>Aucune recette chargée pour l'instant.</p>
      <p style={{color:"#8C7355",fontSize:13,marginTop:6}}>Les données arriveront via <code>/api/recipes/{id}</code></p>
      <button className="ck-back-btn" onClick={() => navigate(-1)}>Retour</button>
    </div>
  );

  if (completed) return (
    <div className="ck-page ck-page--center">
      <span style={{fontSize:64}}>🎉</span>
      <h2 className="ck-done__title">Bravo !</h2>
      <p className="ck-done__sub">Vous avez terminé <strong>{recipe.name}</strong></p>
      <button className="ck-back-btn" onClick={() => navigate("/")}>Retour à l'accueil</button>
    </div>
  );

  return (
    <div className="ck-page">

      {/* ── Header ── */}
      <div className="ck-header">
        <button className="ck-close" onClick={() => navigate(-1)} aria-label="Quitter le mode cuisine">
          <i className="ti ti-x" aria-hidden="true" />
        </button>
        <div className="ck-header__info">
          <span className="ck-header__emoji" aria-hidden="true">{recipe.emoji || "🍽️"}</span>
          <div>
            <h1 className="ck-header__title">{recipe.name}</h1>
            <p className="ck-header__meta">{recipe.duration} min · {recipe.servings} personnes</p>
          </div>
        </div>
        <div className="ck-progress-label">
          Étape {currentStep + 1} / {recipe.steps.length}
        </div>
      </div>

      {/* ── Barre de progression ── */}
      <div className="ck-progress-bar">
        <div
          className="ck-progress-bar__fill"
          style={{ width: `${((currentStep) / recipe.steps.length) * 100}%` }}
        />
      </div>

      {/* ── Étapes ── */}
      <div className="ck-steps">
        {recipe.steps.map((step, i) => (
          <Step
            key={i}
            step={step}
            index={i}
            total={recipe.steps.length}
            active={i === currentStep}
            done={i < currentStep}
            onCheck={handleNext}
          />
        ))}
      </div>

    </div>
  );
}
