// src/pages/Planning.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../App";
import "../styles/Planning.css";

const DAYS   = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS  = ["Petit-déjeuner","Déjeuner","Dîner"];
const SLOT_KEYS = ["breakfast","lunch","dinner"]; // correspondance avec la DB
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août",
                 "Septembre","Octobre","Novembre","Décembre"];

// ── Calcule le lundi ISO de la semaine (offset = nb semaines à décaler)
function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=lun … 6=dim
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

// ── Formate la date en YYYY-MM-DD (sans décalage UTC)
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isTodayDate(date) {
  const t = new Date();
  return date.getDate()     === t.getDate()  &&
         date.getMonth()    === t.getMonth() &&
         date.getFullYear() === t.getFullYear();
}

// ── Convertit le tableau plat de l'API en grille [dayIdx][slotIdx]
// Chaque ligne API : { day_of_week (1-7), meal_slot, title, recipe_id, id, calories, ... }
function apiToGrid(rows) {
  const grid = Array.from({ length: 7 }, () => Array(3).fill(null));
  rows.forEach(row => {
    const dayIdx  = row.day_of_week - 1;                    // 1-7 → 0-6
    const slotIdx = SLOT_KEYS.indexOf(row.meal_slot);       // breakfast→0 etc.
    if (dayIdx >= 0 && dayIdx < 7 && slotIdx >= 0) {
      grid[dayIdx][slotIdx] = {
        id:       row.id,
        name:     row.title,
        emoji:    row.emoji || "🍽️",
        calories: row.calories,
      };
    }
  });
  return grid;
}

// ── Sous-composants
function EmptySlot({ onAdd }) {
  return (
    <button className="pl-slot pl-slot--empty" onClick={onAdd} aria-label="Ajouter un repas">
      <i className="ti ti-plus" aria-hidden="true" />
    </button>
  );
}

function MealSlot({ meal, onRemove }) {
  return (
    <div className="pl-slot pl-slot--filled">
      <span className="pl-slot__emoji" aria-hidden="true">{meal.emoji}</span>
      <span className="pl-slot__name">{meal.name}</span>
      <button className="pl-slot__remove" onClick={onRemove} aria-label="Supprimer">
        <i className="ti ti-x" aria-hidden="true" />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════
export default function Planning() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [planning,   setPlanning]   = useState(
    Array.from({ length: 7 }, () => Array(3).fill(null))
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const weekDates = getWeekDates(weekOffset);
  const weekStart = toISO(weekDates[0]);
  const weekLabel = `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${MONTHS[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  // ── Fetch planning depuis /api/planning?week_start=YYYY-MM-DD
  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = user?.token || localStorage.getItem("token");
      const res   = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/planning?week_start=${weekStart}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const data = await res.json();

      // L'API peut renvoyer { meals: [...] } ou directement [...]
      const rows = Array.isArray(data) ? data : (data.meals || data.planning || []);
      setPlanning(apiToGrid(rows));
    } catch (err) {
      console.error("Planning fetch error:", err);
      setError("Impossible de charger le planning.");
      setPlanning(Array.from({ length: 7 }, () => Array(3).fill(null)));
    } finally {
      setLoading(false);
    }
  }, [weekStart, user]);

  useEffect(() => { fetchPlanning(); }, [fetchPlanning]);

  // ── Supprimer un créneau
  const handleRemove = async (dayIdx, slotIdx) => {
    const meal = planning[dayIdx][slotIdx];
    if (!meal) return;

    // Optimiste : vide la case immédiatement
    setPlanning(prev => {
      const next = prev.map(d => [...d]);
      next[dayIdx][slotIdx] = null;
      return next;
    });

    try {
      const token = user?.token || localStorage.getItem("token");
      await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/planning/${meal.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Suppression échouée:", err);
      fetchPlanning(); // rollback
    }
  };

  const handleAdd = (dayIdx, slotIdx) => {
    // TODO : ouvrir Modal de sélection de recette
    console.log("Ajouter →", DAYS[dayIdx], SLOTS[slotIdx]);
  };

  return (
    <div className="pl-page">

      {/* ── Header ── */}
      <div className="pl-header">
        <div>
          <h1>Planning</h1>
          <p>{weekLabel}</p>
        </div>
        <div className="pl-nav">
          <button className="pl-nav__btn" onClick={() => setWeekOffset(w => w - 1)} aria-label="Semaine précédente">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <button className="pl-nav__today" onClick={() => setWeekOffset(0)}>Aujourd'hui</button>
          <button className="pl-nav__btn" onClick={() => setWeekOffset(w => w + 1)} aria-label="Semaine suivante">
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div className="pl-error">
          <i className="ti ti-wifi-off" /> {error}
          <button onClick={fetchPlanning} style={{ marginLeft: "1rem", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      )}

      {/* ── Grille semaine ── */}
      <div className="pl-grid">

        {/* Labels slots */}
        <div className="pl-col pl-col--labels">
          <div className="pl-day-header pl-day-header--empty" />
          {SLOTS.map(s => (
            <div key={s} className="pl-slot-label">{s}</div>
          ))}
        </div>

        {/* Colonnes jours */}
        {weekDates.map((date, dayIdx) => (
          <div key={dayIdx} className={`pl-col ${isTodayDate(date) ? "pl-col--today" : ""}`}>
            <div className="pl-day-header">
              <span className="pl-day-header__name">{DAYS[dayIdx].slice(0, 3)}</span>
              <span className={`pl-day-header__num ${isTodayDate(date) ? "pl-day-header__num--today" : ""}`}>
                {date.getDate()}
              </span>
            </div>

            {SLOTS.map((_, slotIdx) =>
              loading
                ? <div key={slotIdx} className="pl-slot pl-slot--skeleton" />
                : planning[dayIdx][slotIdx]
                  ? <MealSlot
                      key={slotIdx}
                      meal={planning[dayIdx][slotIdx]}
                      onRemove={() => handleRemove(dayIdx, slotIdx)}
                    />
                  : <EmptySlot
                      key={slotIdx}
                      onAdd={() => handleAdd(dayIdx, slotIdx)}
                    />
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
