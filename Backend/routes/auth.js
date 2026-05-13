// routes/auth.js — Register & Login
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../db');

async function register(req, res, next) {
  try {
    const { email, password, name, dietary_preferences = [], allergens = [] } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: 'email, password et name sont requis' });

    const hash = await bcrypt.hash(password, 12);
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name`,
        [email, hash, name]
      );

      // Insérer les préférences alimentaires
      for (const pref of dietary_preferences) {
        await client.query(
          `INSERT INTO user_dietary_preferences (user_id, preference) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [user.id, pref]
        );
      }

      // Insérer les allergènes
      for (const allergen of allergens) {
        await client.query(
          `INSERT INTO user_allergens (user_id, allergen) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [user.id, allergen]
        );
      }

      await client.query('COMMIT');

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { ...user, dietary_preferences, allergens } });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { rows: [user] } = await db.query(
      `SELECT u.id, u.email, u.name, u.password_hash,
              COALESCE(array_agg(DISTINCT udp.preference) FILTER (WHERE udp.preference IS NOT NULL), '{}') AS dietary_preferences,
              COALESCE(array_agg(DISTINCT ua.allergen)   FILTER (WHERE ua.allergen IS NOT NULL), '{}')    AS allergens
       FROM users u
       LEFT JOIN user_dietary_preferences udp ON udp.user_id = u.id
       LEFT JOIN user_allergens           ua  ON ua.user_id  = u.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Identifiants incorrects' });

    const { password_hash, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser });
  } catch (err) { next(err); }
}

module.exports = { register, login };