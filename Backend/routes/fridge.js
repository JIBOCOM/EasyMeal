// routes/fridge.js — Gestion frigo connecté
const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/fridge — liste du frigo de l'utilisateur
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT fi.id, fi.quantity, fi.unit, fi.expiry_date, fi.added_at,
              i.id AS ingredient_id, i.name, i.category,
              (fi.expiry_date - CURRENT_DATE) AS days_left
       FROM fridge_items fi
       JOIN ingredients i ON i.id = fi.ingredient_id
       WHERE fi.user_id = $1
       ORDER BY fi.expiry_date ASC NULLS LAST, i.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/fridge/expiring — ingrédients qui expirent dans ≤3 jours
router.get('/expiring', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM fridge_expiring_soon WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/fridge — ajouter ou mettre à jour un ingrédient dans le frigo
router.post('/', async (req, res, next) => {
  try {
    const { ingredient_id, quantity, unit, expiry_date } = req.body;
    const { rows: [item] } = await db.query(
      `INSERT INTO fridge_items (user_id, ingredient_id, quantity, unit, expiry_date)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, ingredient_id)
       DO UPDATE SET quantity    = EXCLUDED.quantity,
                     unit        = EXCLUDED.unit,
                     expiry_date = EXCLUDED.expiry_date
       RETURNING *`,
      [req.user.id, ingredient_id, quantity, unit, expiry_date || null]
    );
    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PUT /api/fridge/:id — modifier la quantité / date
router.put('/:id', async (req, res, next) => {
  try {
    const { quantity, unit, expiry_date } = req.body;
    const { rows: [item] } = await db.query(
      `UPDATE fridge_items
       SET quantity = $1, unit = $2, expiry_date = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [quantity, unit, expiry_date || null, req.params.id, req.user.id]
    );
    if (!item) return res.status(404).json({ error: 'Élément introuvable' });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /api/fridge/:id — retirer du frigo
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM fridge_items WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Élément introuvable' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;