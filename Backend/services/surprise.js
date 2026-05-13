// services/surprise.js ■ Cœur V2
// Remplissage automatique du planning de la semaine
const db          = require('../db');
const Planning    = require('../models/Planning');
const recommender = require('./recommender');

const SLOTS = [
  { day: 1, slot: 'lunch' }, { day: 1, slot: 'dinner' },
  { day: 2, slot: 'lunch' }, { day: 2, slot: 'dinner' },
  { day: 3, slot: 'lunch' }, { day: 3, slot: 'dinner' },
  { day: 4, slot: 'lunch' }, { day: 4, slot: 'dinner' },
  { day: 5, slot: 'lunch' }, { day: 5, slot: 'dinner' },
  { day: 6, slot: 'lunch' }, { day: 6, slot: 'dinner' },
  { day: 7, slot: 'lunch' }, { day: 7, slot: 'dinner' },
];

/**
 * Remplit tous les créneaux vides de la semaine avec des recettes adaptées.
 * Priorise les recettes réalisables avec le frigo, puis complète aléatoirement.
 */
async function fillWeek(userId, weekStart) {
  // Récupérer les créneaux déjà remplis
  const existing = await Planning.findByWeek(userId, weekStart);
  const filledKeys = new Set(existing.map(e => `${e.day_of_week}_${e.meal_slot}`));

  const emptySlots = SLOTS.filter(s => !filledKeys.has(`${s.day}_${s.slot}`));
  if (!emptySlots.length) return existing;

  // Récupérer les recommandations du frigo
  const recommendations = await recommender.getRecommendations(userId, { minCoveragePercent: 0, limit: 50 });
  const recipePool = recommendations.length
    ? recommendations
    : await getFallbackRecipes(userId);

  if (!recipePool.length) return existing;

  // Remplir les créneaux vides de manière variée (pas 2x la même recette en 2 jours)
  const usedRecent = new Set();
  const newEntries = [];

  for (const { day, slot } of emptySlots) {
    // Choisir une recette non utilisée récemment
    const available = recipePool.filter(r => !usedRecent.has(r.id));
    const pool = available.length ? available : recipePool;
    const recipe = pool[Math.floor(Math.random() * pool.length)];

    const entry = await Planning.upsert({
      user_id: userId,
      recipe_id: recipe.id,
      week_start: weekStart,
      day_of_week: day,
      meal_slot: slot,
      servings: 2,
      is_surprise: true,
    });
    newEntries.push(entry);

    usedRecent.add(recipe.id);
    if (usedRecent.size > 3) {
      const first = usedRecent.values().next().value;
      usedRecent.delete(first);
    }
  }

  return Planning.findByWeek(userId, weekStart);
}

async function getFallbackRecipes(userId) {
  // Récupérer les préférences alimentaires de l'utilisateur
  const { rows: prefs } = await db.query(
    `SELECT preference FROM user_dietary_preferences WHERE user_id = $1`,
    [userId]
  );
  const dietTypes = prefs.map(p => p.preference);

  let query = `SELECT id, title, prep_time_min, cook_time_min, diet_type, calories, image_url
               FROM recipes WHERE is_public = TRUE`;
  const params = [];

  if (dietTypes.length) {
    params.push(dietTypes);
    query += ` AND diet_type = ANY($1)`;
  }

  query += ` ORDER BY RANDOM() LIMIT 30`;
  const { rows } = await db.query(query, params);
  return rows;
}

module.exports = { fillWeek };