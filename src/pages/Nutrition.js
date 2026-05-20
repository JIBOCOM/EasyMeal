// src/pages/Nutrition.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import "../styles/Nutrition.css";

const DAYS_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function MacroBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="nt-macro">
      <div className="nt-macro__header">
        <span className="nt-macro__label">{label}</span>
        <span className="nt-macro__val">{value ?? 0} <span className="nt-macro__unit">g</span></span>
      </div>
      <div className="nt-macro__track">
        <div className="nt-macro__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="nt-macro__footer">
        <span className="nt-macro__pct">{Math.round(pct)}%</span>
        <span className="nt-macro__max">/ {max}g</span>
      </div>
    </div>
  );
}

function CalorieRing({ current, goal }) {
  const pct  = goal > 0 ? Math.min(current / goal, 1) : 0;
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="nt-ring">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(140,115,85,0.12)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="#A8C57A" strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="nt-ring__center">
        <span className="nt-ring__val">{current ?? 0}</span>
        <span className="nt-ring__label">kcal</span>
      </div>
    </div>
  );
}

function WeekChart({ data }) {
  const max = Math.max(...data.map(d => d.calories || 0), 1);
  return (
    <div className="nt-week-chart">
      {DAYS_SHORT.map((day, i) => {
        const val = data[i]?.calories || 0;
        const pct = (val / max) * 100;
        const today = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
        return (
          <div key={day} className="nt-week-chart__col">
            <span className="nt-week-chart__val">{val > 0 ? val : ""}</span>
            <div className="nt-week-chart__bar-wrap">
              <div
                className={`nt-week-chart__bar ${today ? "nt-week-chart__bar--today" : ""}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`nt-week-chart__day ${today ? "nt-week-chart__day--today" : ""}`}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Nutrition() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  useEffect(() => {
    async function fetchNutrition() {
      setLoading(true);
      setError(null);
      try {
        // TODO (API) : décommenter quand l'endpoint est prêt
        // const res  = await fetch("/api/nutrition/today", {
        //   headers: { Authorization: `Bearer ${user?.token}` }
        // });
        // const json = await res.json();
        // setData(json);

        // Pour l'instant : données vides
        setData(null);
      } catch (err) {
        setError("Impossible de charger les données nutritionnelles.");
      } finally {
        setLoading(false);
      }
    }
    fetchNutrition();
  }, [user]);

  const today = data?.today || {};
  const goals = data?.goals || { calories: 2000, glucides: 250, proteines: 60, lipides: 70 };
  const week  = data?.week  || Array(7).fill({ calories: 0 });

  return (
    <div className="nt-page">

      <div className="nt-header">
        <h1>Nutrition</h1>
        <p>Suivi de la journée</p>
      </div>

      {error && <div className="nt-error"><i className="ti ti-wifi-off" /> {error}</div>}

      <div className="nt-top-grid">

        {/* ── Anneau calories ── */}
        <div className="nt-card">
          <div className="nt-card__title"><i className="ti ti-flame" aria-hidden="true" />Calories du jour</div>
          <div className="nt-calories">
            <CalorieRing current={today.calories ?? 0} goal={goals.calories} />
            <div className="nt-calories__info">
              <div className="nt-calories__row">
                <span className="nt-calories__label">Consommées</span>
                <span className="nt-calories__val">{today.calories ?? 0} kcal</span>
              </div>
              <div className="nt-calories__row">
                <span className="nt-calories__label">Objectif</span>
                <span className="nt-calories__val">{goals.calories} kcal</span>
              </div>
              <div className="nt-calories__row">
                <span className="nt-calories__label">Restantes</span>
                <span className="nt-calories__val nt-calories__val--remain">
                  {Math.max(goals.calories - (today.calories ?? 0), 0)} kcal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Macros ── */}
        <div className="nt-card">
          <div className="nt-card__title"><i className="ti ti-chart-pie" aria-hidden="true" />Macronutriments</div>
          <div className="nt-macros">
            <MacroBar label="Glucides"   value={today.glucides   ?? 0} max={goals.glucides}   color="#A8C57A" />
            <MacroBar label="Protéines"  value={today.proteines  ?? 0} max={goals.proteines}  color="#7A9E5C" />
            <MacroBar label="Lipides"    value={today.lipides    ?? 0} max={goals.lipides}    color="#C47A2A" />
          </div>
        </div>
      </div>

      {/* ── Graphique semaine ── */}
      <div className="nt-card nt-card--full">
        <div className="nt-card__title"><i className="ti ti-chart-bar" aria-hidden="true" />Calories cette semaine</div>
        {loading
          ? <div className="nt-skeleton" style={{height:120}} />
          : <WeekChart data={week} />
        }
      </div>

      {/* ── Repas du jour ── */}
      <div className="nt-card nt-card--full">
        <div className="nt-card__title"><i className="ti ti-list" aria-hidden="true" />Repas enregistrés</div>
        {loading
          ? <div className="nt-skeleton-list"><div className="nt-skeleton" /><div className="nt-skeleton" /></div>
          : (!data?.meals || data.meals.length === 0)
            ? <div className="nt-empty"><i className="ti ti-salad" aria-hidden="true" /><p>Aucun repas enregistré aujourd'hui</p></div>
            : <ul className="nt-meal-list">
                {data.meals.map((m, i) => (
                  <li key={i} className="nt-meal-item">
                    <span className="nt-meal-emoji" aria-hidden="true">{m.emoji || "🍽️"}</span>
                    <div className="nt-meal-info">
                      <span className="nt-meal-name">{m.name}</span>
                      <span className="nt-meal-meta">{m.slot}</span>
                    </div>
                    <div className="nt-meal-macros">
                      <span>{m.calories} kcal</span>
                      <span>G {m.glucides}g</span>
                      <span>P {m.proteines}g</span>
                      <span>L {m.lipides}g</span>
                    </div>
                  </li>
                ))}
              </ul>
        }
      </div>

    </div>
  );
}
