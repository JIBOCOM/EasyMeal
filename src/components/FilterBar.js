// FilterBar.js — Barre de filtres recettes (régime, temps, calories) — V2

import React, { useState } from "react";

const REGIMES = ["Tous", "Végétarien", "Vegan", "Sans gluten", "Sans lactose"];
const TEMPS = ["Tous", "< 15 min", "< 30 min", "< 1h", "> 1h"];
const CALORIES = ["Toutes", "< 300 kcal", "300–600 kcal", "> 600 kcal"];

/**
 * Props :
 *  - onFilterChange : fn({ regime, temps, calories }) — callback au changement
 *  - initialFilters : object — valeurs initiales optionnelles
 */
const FilterBar = ({ onFilterChange, initialFilters = {} }) => {
  const [regime, setRegime] = useState(initialFilters.regime || "Tous");
  const [temps, setTemps] = useState(initialFilters.temps || "Tous");
  const [calories, setCalories] = useState(initialFilters.calories || "Toutes");

  const handleChange = (key, value) => {
    const updated = { regime, temps, calories, [key]: value };
    if (key === "regime") setRegime(value);
    if (key === "temps") setTemps(value);
    if (key === "calories") setCalories(value);
    onFilterChange?.(updated);
  };

  const handleReset = () => {
    setRegime("Tous");
    setTemps("Tous");
    setCalories("Toutes");
    onFilterChange?.({ regime: "Tous", temps: "Tous", calories: "Toutes" });
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar__group">
        <label className="filter-bar__label">Régime</label>
        <div className="filter-bar__options">
          {REGIMES.map((r) => (
            <button
              key={r}
              className={`filter-bar__btn ${regime === r ? "active" : ""}`}
              onClick={() => handleChange("regime", r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__group">
        <label className="filter-bar__label">Temps</label>
        <div className="filter-bar__options">
          {TEMPS.map((t) => (
            <button
              key={t}
              className={`filter-bar__btn ${temps === t ? "active" : ""}`}
              onClick={() => handleChange("temps", t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__group">
        <label className="filter-bar__label">Calories</label>
        <div className="filter-bar__options">
          {CALORIES.map((c) => (
            <button
              key={c}
              className={`filter-bar__btn ${calories === c ? "active" : ""}`}
              onClick={() => handleChange("calories", c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button className="filter-bar__reset" onClick={handleReset}>
        Réinitialiser
      </button>
    </div>
  );
};

export default FilterBar;
