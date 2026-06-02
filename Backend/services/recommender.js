// services/recommender.js ■ Cœur V2
// Algo : frigo → recettes réalisables (triées par % d'ingrédients disponibles)
const db = require('../db');

/**
 * Retourne les recettes réalisables avec les ingrédients du frigo de l'utilisateur.
 * @param {string} userId
 * @param {object} options - { minCoveragePercent: 0–100, limit: n }
 * @returns {Array} recettes triées par couverture décroissante
 */
async function getRecommendations(userId, { minCoveragePercent = 50, limit = 20 } = {}) {
  // 1. Charger le contenu du frigo
  const { rows: fridgeItems } = await db.query(
    `SELECT ingredient_id, quantity, unit FROM fridge_items WHERE user_id = $1`,
    [userId]
  );
  if (!fridgeItems.length) return [];

  const fridgeMap = new Map(fridgeItems.map(f => [f.ingredient_id, f]));

  // 2. Charger toutes les recettes publiques avec leurs ingrédients obligatoires
  const { rows: recipeIngredients } = await db.query(
    `SELECT r.id AS recipe_id, r.title, r.prep_time_min, r.cook_time_min,
            r.diet_type, r.calories, r.image_url,
            ri.ingredient_id, ri.quantity AS needed, ri.unit, ri.is_optional
     FROM recipes r
     JOIN recipe_ingredients ri ON ri.recipe_id = r.id
     WHERE r.is_public = TRUE`
  );

  // 3. Regrouper par recette
  const recipesMap = new Map();
  for (const row of recipeIngredients) {
    if (!recipesMap.has(row.recipe_id)) {
      recipesMap.set(row.recipe_id, {
        id: row.recipe_id, title: row.title,
        prep_time_min: row.prep_time_min, cook_time_min: row.cook_time_min,
        diet_type: row.diet_type, calories: row.calories, image_url: row.image_url,
        required: [], optional: [],
      });
    }
    const recipe = recipesMap.get(row.recipe_id);
    (row.is_optional ? recipe.optional : recipe.required).push(row);
  }

  // 4. Calculer la couverture pour chaque recette
  const results = [];
  for (const recipe of recipesMap.values()) {
    const requiredTotal = recipe.required.length;
    if (!requiredTotal) continue;

    let covered = 0;
    const missing = [];

    for (const ing of recipe.required) {
      const inFridge = fridgeMap.get(ing.ingredient_id);
      if (inFridge && inFridge.quantity >= ing.needed) {
        covered++;
      } else {
        missing.push({ ingredient_id: ing.ingredient_id, needed: ing.needed, unit: ing.unit });
      }
    }

    const coveragePercent = Math.round((covered / requiredTotal) * 100);
    if (coveragePercent >= minCoveragePercent) {
      results.push({ ...recipe, coveragePercent, missingIngredients: missing });
    }
  }

  return results
    .sort((a, b) => b.coveragePercent - a.coveragePercent)
    .slice(0, limit);
}

module.exports = { getRecommendations };