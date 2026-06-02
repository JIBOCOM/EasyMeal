// routes/shopping.js — Génération liste de courses
const express = require('express');
const db      = require('../db');

const router = express.Router();

// POST /api/shopping/generate — génère une liste depuis un planning
router.post('/generate', async (req, res, next) => {
  try {
    const { planning_id, week_start } = req.body;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Créer la liste
      const { rows: [list] } = await client.query(
        `INSERT INTO shopping_lists (user_id, planning_id)
         VALUES ($1, $2) RETURNING *`,
        [req.user.id, planning_id || null]
      );

      // Agréger les ingrédients nécessaires depuis le planning de la semaine
      const { rows: needed } = await client.query(
        `SELECT ri.ingredient_id, i.name, i.unit_default AS unit,
                SUM(ri.quantity * p.servings / r.servings) AS quantity_needed
         FROM planning p
         JOIN recipes r             ON r.id = p.recipe_id
         JOIN recipe_ingredients ri ON ri.recipe_id = r.id
         JOIN ingredients i         ON i.id = ri.ingredient_id
         WHERE p.user_id = $1 AND p.week_start = $2
         GROUP BY ri.ingredient_id, i.name, i.unit_default`,
        [req.user.id, week_start]
      );

      // Soustraire ce qui est déjà dans le frigo
      const { rows: owned } = await client.query(
        `SELECT ingredient_id, quantity, unit
         FROM fridge_items WHERE user_id = $1`,
        [req.user.id]
      );
      const ownedMap = Object.fromEntries(owned.map(o => [o.ingredient_id, o.quantity]));

      for (const item of needed) {
        const qty_owned = ownedMap[item.ingredient_id] || 0;
        await client.query(
          `INSERT INTO shopping_list_items
             (shopping_list_id, ingredient_id, quantity_needed, quantity_owned, unit)
           VALUES ($1,$2,$3,$4,$5)`,
          [list.id, item.ingredient_id, item.quantity_needed, qty_owned, item.unit]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ list_id: list.id });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

// GET /api/shopping/:listId — récupérer une liste
router.get('/:listId', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT sli.id, sli.quantity_needed, sli.quantity_owned,
              sli.unit, sli.is_checked,
              i.id AS ingredient_id, i.name, i.category
       FROM shopping_list_items sli
       JOIN ingredients i ON i.id = sli.ingredient_id
       WHERE sli.shopping_list_id = $1
       ORDER BY i.category, i.name`,
      [req.params.listId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/shopping/item/:itemId — cocher/décocher un article
router.patch('/item/:itemId', async (req, res, next) => {
  try {
    const { is_checked } = req.body;
    const { rows: [item] } = await db.query(
      `UPDATE shopping_list_items SET is_checked = $1
       WHERE id = $2 RETURNING *`,
      [is_checked, req.params.itemId]
    );
    if (!item) return res.status(404).json({ error: 'Article introuvable' });
    res.json(item);
  } catch (err) { next(err); }
});

module.exports = router;