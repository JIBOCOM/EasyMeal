// Recipes.js — Bibliothèque recettes + filtres avancés + recommandations frigo (V2)
// P3 (Fullstack) : UI + logique recommandations / P1 : API backend

import React, { useState, useEffect } from "react";
import RecipeCard from "../components/RecipeCard";
import FilterBar from "../components/FilterBar";
import MissingBadge from "../components/MissingBadge";
import mockFridge from "../data/mockFridge";
import recipesData from "../data/recipes.json";
import "../styles/Recipes.css";

const API_URL = process.env.REACT_APP_API_URL;
const USE_MOCK = !API_URL;

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [filters, setFilters] = useState({ regime: "Tous", temps: "Tous", calories: "Toutes" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "recommended"

  // ── Chargement recettes + frigo ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (USE_MOCK) {
        setRecipes(recipesData);
        setFridgeItems(mockFridge);
        setLoading(false);
        return;
      }
      try {
        const [recRes, fridgeRes] = await Promise.all([
          fetch(`${API_URL}/recipes`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          fetch(`${API_URL}/fridge`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);
        const [recData, fridgeData] = await Promise.all([recRes.json(), fridgeRes.json()]);
        setRecipes(recData);
        setFridgeItems(fridgeData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Calcul ingrédients manquants par recette ─────────────────
  const fridgeNames = fridgeItems.map((f) => f.name.toLowerCase());

  const withMissing = recipes.map((recipe) => {
    const missing = (recipe.ingredients || []).filter(
      (ing) => !fridgeNames.includes(ing.toLowerCase())
    );
    return { ...recipe, missing };
  });

  // ── Recommandations = recettes réalisables (0–2 manquants) ──
  const recommended = withMissing.filter((r) => r.missing.length <= 2);

  // ── Filtrage ─────────────────────────────────────────────────
  const applyFilters = (list) => {
    return list.filter((r) => {
      const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase());
      const matchRegime =
        filters.regime === "Tous" ||
        (r.tags || []).includes(filters.regime);
      const matchTemps = (() => {
        if (filters.temps === "Tous") return true;
        const t = r.prepTime || 0;
        if (filters.temps === "< 15 min") return t < 15;
        if (filters.temps === "< 30 min") return t < 30;
        if (filters.temps === "< 1h") return t < 60;
        if (filters.temps === "> 1h") return t >= 60;
        return true;
      })();
      const matchCal = (() => {
        if (filters.calories === "Toutes") return true;
        const c = r.calories || 0;
        if (filters.calories === "< 300 kcal") return c < 300;
        if (filters.calories === "300–600 kcal") return c >= 300 && c <= 600;
        if (filters.calories === "> 600 kcal") return c > 600;
        return true;
      })();
      return matchSearch && matchRegime && matchTemps && matchCal;
    });
  };

  const displayList = applyFilters(activeTab === "recommended" ? recommended : withMissing);

  if (loading) return <div className="recipes__loading">Chargement des recettes…</div>;

  return (
    <div className="recipes">
      <div className="recipes__header">
        <h1 className="recipes__title">📖 Recettes</h1>
        <input
          className="recipes__search"
          placeholder="Rechercher une recette…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="recipes__tabs">
        <button
          className={`recipes__tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Toutes ({withMissing.length})
        </button>
        <button
          className={`recipes__tab ${activeTab === "recommended" ? "active" : ""}`}
          onClick={() => setActiveTab("recommended")}
        >
          🧊 Avec mon frigo ({recommended.length})
        </button>
      </div>

      {/* Filtres */}
      <FilterBar onFilterChange={setFilters} />

      {/* Grille */}
      <div className="recipes__grid">
        {displayList.length === 0 ? (
          <p className="recipes__empty">Aucune recette ne correspond à tes critères.</p>
        ) : (
          displayList.map((recipe) => (
            <div className="recipes__card-wrapper" key={recipe.id}>
              <RecipeCard recipe={recipe} />
              {recipe.missing?.length > 0 && (
                <MissingBadge
                  missing={recipe.missing}
                  total={recipe.ingredients?.length || 0}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Recipes;
