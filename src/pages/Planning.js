// src/pages/Planning.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import "../styles/Planning.css";

const DAYS   = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SLOTS  = ["Petit-déjeuner","Déjeuner","Dîner"];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function getWeekDates(offset = 0) {
  const now  = new Date();
  const day  = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const mon  = new Date(now);
  mon.setDate(now.getDate() - day + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function isTodayDate(date) {
  const t = new Date();
  return date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear();
}

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
      <span className="pl-slot__emoji" aria-hidden="true">{meal.emoji || "🍽️"}</span>
      <span className="pl-slot__name">{meal.name}</span>
      <button className="pl-slot__remove" onClick={onRemove} aria-label="Supprimer">
        <i className="ti ti-x" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function Planning() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // planning[dayIndex][slotIndex] = meal | null
  const [planning, setPlanning] = useState(
    Array.from({ length: 7 }, () => Array(3).fill(null))
  );

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${MONTHS[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  useEffect(() => {
    const token = user?.token;
    async function fetchPlanning() {
      setLoading(true);
      setError(null);
      try {
        // TODO (API) : décommenter quand l'endpoint est prêt
        // const res  = await fetch(`/api/planning/week?offset=${weekOffset}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const data = await res.json();
        // setPlanning(data);

        // Pour l'instant : grille vide
        setPlanning(Array.from({ length: 7 }, () => Array(3).fill(null)));
      } catch (err) {
        setError("Impossible de charger le planning.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlanning();
  }, [weekOffset, user]);

  const handleAdd = (dayIdx, slotIdx) => {
    // TODO : ouvrir une Modal de sélection de recette
    console.log("Ajouter recette →", DAYS[dayIdx], SLOTS[slotIdx]);
  };

  const handleRemove = (dayIdx, slotIdx) => {
    // TODO (API) : DELETE /api/planning/:id
    setPlanning(prev => {
      const next = prev.map(d => [...d]);
      next[dayIdx][slotIdx] = null;
      return next;
    });
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

      {error && <div className="pl-error"><i className="ti ti-wifi-off" /> {error}</div>}

      {/* ── Grille semaine ── */}
      <div className="pl-grid">

        {/* Colonne labels slots */}
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
            {SLOTS.map((_, slotIdx) => (
              loading
                ? <div key={slotIdx} className="pl-slot pl-slot--skeleton" />
                : planning[dayIdx][slotIdx]
                  ? <MealSlot key={slotIdx} meal={planning[dayIdx][slotIdx]} onRemove={() => handleRemove(dayIdx, slotIdx)} />
                  : <EmptySlot key={slotIdx} onAdd={() => handleAdd(dayIdx, slotIdx)} />
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}
