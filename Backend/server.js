// server.js — Point d'entrée Express
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const recipesRouter  = require('./routes/recipes');
const fridgeRouter   = require('./routes/fridge');
const planningRouter = require('./routes/planning');
const shoppingRouter = require('./routes/shopping');
const authMiddleware = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware global ──────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes publiques ───────────────────────────────────────
app.post('/api/auth/register', require('./routes/auth').register);
app.post('/api/auth/login',    require('./routes/auth').login);

// ── Routes protégées (JWT requis) ──────────────────────────
app.use('/api/recipes',  authMiddleware, recipesRouter);
app.use('/api/fridge',   authMiddleware, fridgeRouter);
app.use('/api/planning', authMiddleware, planningRouter);
app.use('/api/shopping', authMiddleware, shoppingRouter);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Gestion d'erreurs globale ──────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erreur serveur' });
});

app.listen(PORT, () => console.log(`EasyMeal API démarré sur le port ${PORT}`));

module.exports = app;