// models/Planning.js
const db = require('../db');

const Planning = {
  // Récupère le planning d'une semaine pour un utilisateur
  async findByWeek(userId, weekStart) {
    const { rows } = await db.query(
      `SELECT p.*,
              r.title, r.prep_time_min, r.cook_time_min,
              r.calories, r.image_url
       FROM planning p
       JOIN recipes r ON r.id = p.recipe_id
       WHERE p.user_id = $1 AND p.week_start = $2
       ORDER BY p.day_of_week, p.meal_slot`,
      [userId, weekStart]
    );
    return rows;
  },

  async upsert({ user_id, recipe_id, week_start, day_of_week, meal_slot, servings, is_surprise = false }) {
    const { rows: [row] } = await db.query(
      `INSERT INTO planning
         (user_id, recipe_id, week_start, day_of_week, meal_slot, servings, is_surprise)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, week_start, day_of_week, meal_slot)
       DO UPDATE SET recipe_id = EXCLUDED.recipe_id,
                     servings  = EXCLUDED.servings,
                     is_surprise = EXCLUDED.is_surprise
       RETURNING *`,
      [user_id, recipe_id, week_start, day_of_week, meal_slot, servings, is_surprise]
    );
    return row;
  },

  async delete(id, userId) {
    const { rowCount } = await db.query(
      `DELETE FROM planning WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  },
};

module.exports = Planning;