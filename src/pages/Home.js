// src/pages/Home.js
// Dashboard principal — états vides par défaut
// Remplacer les appels fetch() par les vrais endpoints quand l'API sera prête

import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import "../styles/Home.css";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const DAYS_SHORT  = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const DAYS_LONG   = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS      = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function formatDate() {
  const now = new Date();
  return `${DAYS_LONG[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function getInitialPlanning() {
  const today = new Date().getDay();
  return DAYS_SHORT.map((day, i) => ({
    day,
    count: 0,
    today: i === today,
  }));
}

const STATUS_LABEL = { done: "Fait", next: "En cours", later: "Ce soir" };

// ─────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, hint }) {
  return (
    <div className="hm-stat-card">
      <i className={`ti ${icon} hm-stat-card__icon`} aria-hidden="true" />
      <div className="hm-stat-card__label">{label}</div>
      <div className="hm-stat-card__val">{value ?? "—"}</div>
      <div className="hm-stat-card__hint">{hint ?? "Aucune donnée"}</div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="hm-empty">
      <i className={`ti ${icon}`} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function MealsList({ meals }) {
  if (!meals || meals.length === 0) {
    return <EmptyState icon="ti-moon" text="Aucun repas planifié aujourd'hui" />;
  }
  return (
    <ul className="hm-meals">
      {meals.map((m, i) => (
        <li key={i} className="hm-meal-item">
          <span className={`hm-meal-dot hm-meal-dot--${m.status}`} />
          <div className="hm-meal-info">
            <span className="hm-meal-name">{m.name}</span>
            <span className="hm-meal-meta">{m.meta}</span>
          </div>
          <span className={`hm-meal-tag hm-meal-tag--${m.status}`}>
            {STATUS_LABEL[m.status] ?? m.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AlertsList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return <EmptyState icon="ti-check" text="Frigo vide ou tout est frais" />;
  }
  return (
    <ul className="hm-alerts">
      {alerts.map((a, i) => (
        <li key={i} className="hm-alert-item">
          <div className={`hm-alert-icon hm-alert-icon--${a.level}`}>
            <i className={`ti ti-${a.level === "warn" ? "alert-triangle" : "check"}`} aria-hidden="true" />
          </div>
          <div className="hm-alert-text">
            <span className="hm-alert-name">{a.name}</span>
            <span className="hm-alert-sub">{a.sub}</span>
          </div>
          <span className={`hm-alert-days hm-alert-days--${a.level}`}>{a.days}</span>
        </li>
      ))}
    </ul>
  );
}

function PlanningWeek({ planning }) {
  const days = planning || getInitialPlanning();
  return (
    <div className="hm-planning-grid">
      {days.map((p, i) => (
        <div key={i} className={`hm-plan-day ${p.today ? "hm-plan-day--today" : ""}`}>
          <span className="hm-plan-day__name">{p.day}</span>
          <span className={`hm-plan-day__dot ${p.count > 0 ? "hm-plan-day__dot--filled" : ""}`} />
          <span className="hm-plan-day__count">{p.count > 0 ? `${p.count} repas` : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function SuggestionsList({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return <EmptyState icon="ti-search" text="Ajoutez des ingrédients pour obtenir des suggestions" />;
  }
  return (
    <ul className="hm-suggestions">
      {suggestions.map((s, i) => (
        <li key={i} className="hm-suggestion-item">
          <div className="hm-suggestion-num">{i + 1}</div>
          <div className="hm-suggestion-info">
            <span className="hm-suggestion-name">{s.name}</span>
            <span className="hm-suggestion-meta">{s.meta}</span>
          </div>
          <span className="hm-suggestion-match">{s.match}</span>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────
// Page Home
// ─────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  // ── État global de la page ──
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [stats, setStats]           = useState(null);
  const [meals, setMeals]           = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [planning, setPlanning]     = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // ─────────────────────────────────────────────
  // Chargement des données — remplacer les URL
  // par les vrais endpoints quand l'API est prête
  // ─────────────────────────────────────────────
  useEffect(() => {
    const token = user?.token;

    async function fetchDashboard() {
      setLoading(true);
      setError(null);

      try {
        // ── TODO (API) : décommenter quand les endpoints sont prêts ──

        // const headers = { Authorization: `Bearer ${token}` };

        // const [statsRes, mealsRes, alertsRes, planningRes, suggestionsRes] = await Promise.all([
        //   fetch("/api/stats",           { headers }),
        //   fetch("/api/meals/today",     { headers }),
        //   fetch("/api/fridge/alerts",   { headers }),
        //   fetch("/api/planning/week",   { headers }),
        //   fetch("/api/suggestions",     { headers }),
        // ]);

        // const statsData       = await statsRes.json();
        // const mealsData       = await mealsRes.json();
        // const alertsData      = await alertsRes.json();
        // const planningData    = await planningRes.json();
        // const suggestionsData = await suggestionsRes.json();

        // setStats(statsData);
        // setMeals(mealsData);
        // setAlerts(alertsData);
        // setPlanning(planningData);
        // setSuggestions(suggestionsData);

        // ── Pour l'instant : états vides ──
        setStats(null);
        setMeals([]);
        setAlerts([]);
        setPlanning(null);
        setSuggestions([]);

      } catch (err) {
        console.error("Erreur chargement dashboard :", err);
        setError("Impossible de charger les données. Réessayez plus tard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [user]);

  // ─────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="hm-page">
        <div className="hm-error">
          <i className="ti ti-wifi-off" aria-hidden="true" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hm-page">

      {/* ── En-tête ── */}
      <div className="hm-header">
        <h1>Bonjour{user?.name ? `, ${user.name}` : ""} 👋</h1>
        <p>{formatDate()}</p>
      </div>

      {/* ── Stats ── */}
      <div className="hm-stats-grid">
        <StatCard
          icon="ti-calendar"
          label="Repas planifiés"
          value={stats?.planned?.value}
          hint={stats?.planned?.hint ?? "Aucun repas planifié"}
        />
        <StatCard
          icon="ti-book"
          label="Recettes sauvegardées"
          value={stats?.recipes?.value ?? "0"}
          hint={stats?.recipes?.hint ?? "Aucune recette"}
        />
        <StatCard
          icon="ti-snowflake"
          label="Ingrédients frigo"
          value={stats?.fridge?.value ?? "0"}
          hint={stats?.fridge?.hint ?? "Frigo vide"}
        />
        <StatCard
          icon="ti-shopping-cart"
          label="Articles à acheter"
          value={stats?.shopping?.value ?? "0"}
          hint={stats?.shopping?.hint ?? "Liste vide"}
        />
      </div>

      {/* ── Repas + Alertes ── */}
      <div className="hm-grid-3">
        <div className="hm-card">
          <div className="hm-card__title">
            <i className="ti ti-flame" aria-hidden="true" />
            Repas d'aujourd'hui
          </div>
          {loading
            ? <div className="hm-skeleton-list"><div className="hm-skeleton" /><div className="hm-skeleton" /><div className="hm-skeleton" /></div>
            : <MealsList meals={meals} />
          }
        </div>
        <div className="hm-card">
          <div className="hm-card__title">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            Alertes frigo
          </div>
          {loading
            ? <div className="hm-skeleton-list"><div className="hm-skeleton" /><div className="hm-skeleton" /></div>
            : <AlertsList alerts={alerts} />
          }
        </div>
      </div>

      {/* ── Planning + Suggestions ── */}
      <div className="hm-grid-2">
        <div className="hm-card">
          <div className="hm-card__title">
            <i className="ti ti-calendar" aria-hidden="true" />
            Planning de la semaine
          </div>
          <PlanningWeek planning={planning} />
        </div>
        <div className="hm-card">
          <div className="hm-card__title">
            <i className="ti ti-sparkles" aria-hidden="true" />
            Suggestions du frigo
          </div>
          {loading
            ? <div className="hm-skeleton-list"><div className="hm-skeleton" /><div className="hm-skeleton" /></div>
            : <SuggestionsList suggestions={suggestions} />
          }
        </div>
      </div>

    </div>
  );
}
