// routes/planning.js — Planning semaine + Surprise me
const express     = require('express');
const Planning    = require('../models/Planning');
const surpriseSvc = require('../services/surprise');

const router = express.Router();

// GET /api/planning?week=2025-05-12
router.get('/', async (req, res, next) => {
  try {
    const weekStart = req.query.week || getMondayOfCurrentWeek();
    const rows = await Planning.findByWeek(req.user.id, weekStart);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/planning — ajouter/déplacer une recette dans le planning
router.post('/', async (req, res, next) => {
  try {
    const entry = await Planning.upsert({ ...req.body, user_id: req.user.id });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// POST /api/planning/surprise — remplir automatiquement la semaine
router.post('/surprise', async (req, res, next) => {
  try {
    const weekStart = req.body.week || getMondayOfCurrentWeek();
    const plan = await surpriseSvc.fillWeek(req.user.id, weekStart);
    res.json(plan);
  } catch (err) { next(err); }
});

// DELETE /api/planning/:id — retirer une entrée du planning
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await Planning.delete(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ error: 'Entrée introuvable' });
    res.status(204).end();
  } catch (err) { next(err); }
});

function getMondayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split('T')[0];
}

module.exports = router;