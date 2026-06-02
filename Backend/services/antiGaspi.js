// services/antiGaspi.js ■ Cœur V2
// Alertes dates d'expiration + suggestion de recettes anti-gaspi
const db          = require('../db');
const recommender = require('./recommender');

/**
 * Retourne les ingrédients qui expirent bientôt ET les recettes qui les utilisent.
 * @param {string} userId
 * @param {number} daysThreshold - alerter si expiration dans ≤ n jours (défaut 3)
 */
async function getAlerts(userId, daysThreshold = 3) {
  // 1. Ingrédients qui expirent
  const { rows: expiring } = await db.query(
    `SELECT fi.id, fi.quantity, fi.unit, fi.expiry_date,
            (fi.expiry_date - CURRENT_DATE) AS days_left,
            i.id AS ingredient_id, i.name, i.category
     FROM fridge_items fi
     JOIN ingredients i ON i.id = fi.ingredient_id
     WHERE fi.user_id = $1
       AND fi.expiry_date IS NOT NULL
       AND fi.expiry_date <= CURRENT_DATE + ($2 * INTERVAL '1 day')
     ORDER BY fi.expiry_date ASC`,
    [userId, daysThreshold]
  );

  if (!expiring.length) return { expiring: [], suggestions: [] };

  // 2. Trouver des recettes qui utilisent ces ingrédients
  const expiringIds = expiring.map(e => e.ingredient_id);
  const { rows: suggestions } = await db.query(
    `SELECT DISTINCT r.id, r.title, r.prep_time_min, r.cook_time_min,
                     r.image_url, r.diet_type
     FROM recipes r
     JOIN recipe_ingredients ri ON ri.recipe_id = r.id
     WHERE ri.ingredient_id = ANY($1) AND r.is_public = TRUE
     LIMIT 10`,
    [expiringIds]
  );

  return { expiring, suggestions };
}

module.exports = { getAlerts };