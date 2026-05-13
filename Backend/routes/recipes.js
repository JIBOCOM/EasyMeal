// routes/recipes.js — CRUD recettes
const express = require('express');
const Recipe  = require('../models/Recipe');

const router = express.Router();

// GET /api/recipes — liste (avec filtres optionnels)
router.get('/', async (req, res, next) => {
  try {
    const { diet_type, tag, search } = req.query;
    const recipes = await Recipe.findAll({ diet_type, tag, search });
    res.json(recipes);
  } catch (err) { next(err); }
});

// GET /api/recipes/:id — détail complet
router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recette introuvable' });
    res.json(recipe);
  } catch (err) { next(err); }
});

// POST /api/recipes — créer une recette
router.post('/', async (req, res, next) => {
  try {
    const recipe = await Recipe.create({ ...req.body, author_id: req.user.id });
    res.status(201).json(recipe);
  } catch (err) { next(err); }
});

// PUT /api/recipes/:id — modifier une recette
router.put('/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.update(req.params.id, req.user.id, req.body);
    if (!recipe) return res.status(404).json({ error: 'Recette introuvable ou non autorisée' });
    res.json(recipe);
  } catch (err) { next(err); }
});

// DELETE /api/recipes/:id — supprimer une recette
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await Recipe.delete(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ error: 'Recette introuvable ou non autorisée' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;