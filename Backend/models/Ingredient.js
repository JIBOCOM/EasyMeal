// models/Ingredient.js
const db = require('../db');

const Ingredient = {
  async findAll({ category, search } = {}) {
    let query = `SELECT * FROM ingredients WHERE TRUE`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ` ORDER BY category, name`;
    const { rows } = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows: [row] } = await db.query(
      `SELECT * FROM ingredients WHERE id = $1`, [id]
    );
    return row || null;
  },
};

module.exports = Ingredient;