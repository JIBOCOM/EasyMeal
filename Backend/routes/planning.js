// backend/routes/planning.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

// GET /api/planning?week_start=YYYY-MM-DD
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Calcule le lundi de la semaine courante si non fourni
    let weekStart = req.query.week_start;
    if (!weekStart) {
      const now = new Date();
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const mon = new Date(now);
      mon.setDate(now.getDate() - day);
      weekStart = mon.toISOString().split("T")[0];
    }

    const result = await db.query(
      `SELECT
         p.id,
         p.day_of_week,
         p.meal_slot,
         p.servings,
         p.is_surprise,
         r.id          AS recipe_id,
         r.title,
         r.calories,
         r.prep_time_min,
         r.cook_time_min,
         r.image_url
       FROM   planning p
       JOIN   recipes  r ON r.id = p.recipe_id
       WHERE  p.user_id    = $1
         AND  p.week_start = $2
       ORDER  BY p.day_of_week,
                 CASE p.meal_slot
                   WHEN 'breakfast' THEN 1
                   WHEN 'lunch'     THEN 2
                   WHEN 'dinner'    THEN 3
                 END`,
      [userId, weekStart]
    );

    res.json(result.rows); // tableau plat — le front le convertit en grille
  } catch (err) {
    console.error("GET /planning error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/planning/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM planning WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /planning error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/planning
router.post("/", auth, async (req, res) => {
  try {
    const { recipe_id, week_start, day_of_week, meal_slot, servings = 2 } = req.body;

    const result = await db.query(
      `INSERT INTO planning (user_id, recipe_id, week_start, day_of_week, meal_slot, servings)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, week_start, day_of_week, meal_slot)
       DO UPDATE SET recipe_id = $2, servings = $6
       RETURNING *`,
      [req.user.id, recipe_id, week_start, day_of_week, meal_slot, servings]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /planning error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
