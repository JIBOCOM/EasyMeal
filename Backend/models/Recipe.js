// models/Recipe.js
const db = require('../db');

const Recipe = {
  // Récupère toutes les recettes avec leurs tags
  async findAll({ diet_type, tag, search } = {}) {
    let query = `
      SELECT r.*,
             COALESCE(array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '{}') AS tags
      FROM recipes r
      LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
      WHERE r.is_public = TRUE
    `;
    const params = [];

    if (diet_type) {
      params.push(diet_type);
      query += ` AND r.diet_type = $${params.length}`;
    }
    if (tag) {
      params.push(tag);
      query += ` AND EXISTS (
        SELECT 1 FROM recipe_tags t2
        WHERE t2.recipe_id = r.id AND t2.tag = $${params.length}
      )`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND r.title ILIKE $${params.length}`;
    }

    query += ` GROUP BY r.id ORDER BY r.created_at DESC`;
    const { rows } = await db.query(query, params);
    return rows;
  },

  // Récupère une recette complète (tags + étapes + ingrédients)
  async findById(id) {
    const { rows: [recipe] } = await db.query(
      `SELECT r.*,
              COALESCE(array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), '{}') AS tags
       FROM recipes r
       LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );
    if (!recipe) return null;

    const { rows: steps } = await db.query(
      `SELECT * FROM recipe_steps WHERE recipe_id = $1 ORDER BY step_number`,
      [id]
    );
    const { rows: ingredients } = await db.query(
      `SELECT ri.quantity, ri.unit, ri.is_optional,
              i.id AS ingredient_id, i.name, i.category
       FROM recipe_ingredients ri
       JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = $1`,
      [id]
    );

    return { ...recipe, steps, ingredients };
  },

  // Crée une recette + ses tags
  async create({ author_id, title, prep_time_min, cook_time_min, servings,
                 diet_type, calories, proteins_g, carbs_g, fats_g,
                 image_url, is_public = true, tags = [] }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { rows: [recipe] } = await client.query(
        `INSERT INTO recipes
           (author_id, title, prep_time_min, cook_time_min, servings,
            diet_type, calories, proteins_g, carbs_g, fats_g, image_url, is_public)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [author_id, title, prep_time_min, cook_time_min, servings,
         diet_type, calories, proteins_g, carbs_g, fats_g, image_url, is_public]
      );

      for (const tag of tags) {
        await client.query(
          `INSERT INTO recipe_tags (recipe_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [recipe.id, tag]
        );
      }

      await client.query('COMMIT');
      return { ...recipe, tags };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Met à jour une recette (uniquement si l'utilisateur en est l'auteur)
  async update(id, authorId, fields) {
    const { tags, ...rest } = fields;
    const allowed = ['title','prep_time_min','cook_time_min','servings',
                     'diet_type','calories','proteins_g','carbs_g','fats_g',
                     'image_url','is_public'];
    const sets   = [];
    const params = [];

    for (const key of allowed) {
      if (rest[key] !== undefined) {
        params.push(rest[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if (!sets.length && !tags) return this.findById(id);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      let recipe;
      if (sets.length) {
        params.push(id, authorId);
        const { rows: [r] } = await client.query(
          `UPDATE recipes SET ${sets.join(', ')}
           WHERE id = $${params.length - 1} AND author_id = $${params.length}
           RETURNING *`,
          params
        );
        recipe = r;
      }

      if (tags) {
        await client.query(`DELETE FROM recipe_tags WHERE recipe_id = $1`, [id]);
        for (const tag of tags) {
          await client.query(
            `INSERT INTO recipe_tags (recipe_id, tag) VALUES ($1, $2)`,
            [id, tag]
          );
        }
      }

      await client.query('COMMIT');
      return this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async delete(id, authorId) {
    const { rowCount } = await db.query(
      `DELETE FROM recipes WHERE id = $1 AND author_id = $2`,
      [id, authorId]
    );
    return rowCount > 0;
  },
};

module.exports = Recipe;