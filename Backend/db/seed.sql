-- ============================================================
--  EasyMeal V2 — Seed Data (dev / démo)
-- ============================================================

-- Ingrédients
INSERT INTO ingredients (name, category, unit_default, calories_per_100g, proteins_per_100g, carbs_per_100g, fats_per_100g) VALUES
  ('Poulet (blanc)', 'viandes',          'g',      165, 31.0,  0.0,  3.6),
  ('Saumon',         'poissons',         'g',      208, 20.0,  0.0, 13.0),
  ('Pâtes (sèches)', 'féculents',        'g',      357, 12.5, 71.0,  1.8),
  ('Riz basmati',    'féculents',        'g',      349,  7.5, 78.0,  0.5),
  ('Tomate',         'légumes',          'g',       18,  0.9,  3.5,  0.2),
  ('Courgette',      'légumes',          'g',       17,  1.2,  3.1,  0.3),
  ('Oeuf',           'produits laitiers','unité',   78,  6.0,  0.6,  5.0),
  ('Lait entier',    'produits laitiers','ml',       61,  3.2,  4.7,  3.3),
  ('Huile d''olive', 'matières grasses', 'ml',      884,  0.0,  0.0,100.0),
  ('Sel',            'épices',           'pincée',    0,  0.0,  0.0,  0.0),
  ('Ail',            'épices',           'g',       149,  6.4, 33.1,  0.5),
  ('Oignon',         'légumes',          'g',        40,  1.1,  9.3,  0.1),
  ('Carotte',        'légumes',          'g',        41,  0.9,  9.6,  0.2),
  ('Parmesan',       'produits laitiers','g',       431, 38.5,  3.2, 29.0),
  ('Citron',         'fruits',           'unité',    17,  0.6,  5.4,  0.3);

-- Utilisateur démo
INSERT INTO users (id, email, password_hash, name) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'demo@easymeal.app',
   '$2b$12$demo_hash_placeholder',
   'Alice Demo');

-- Préférences alimentaires démo (table séparée)
INSERT INTO user_dietary_preferences (user_id, preference) VALUES
  ('00000000-0000-0000-0000-000000000001', 'vegetarian');

-- Allergènes démo (table séparée)
INSERT INTO user_allergens (user_id, allergen) VALUES
  ('00000000-0000-0000-0000-000000000001', 'gluten');

-- Recette démo
INSERT INTO recipes (id, author_id, title, prep_time_min, cook_time_min, servings, diet_type, calories, proteins_g, carbs_g, fats_g) VALUES
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'Pâtes courgette & tomates cerises',
   10, 15, 2, 'vegetarian', 480, 14, 72, 12);

-- Tags recette (table séparée)
INSERT INTO recipe_tags (recipe_id, tag) VALUES
  ('00000000-0000-0000-0000-000000000010', 'rapide'),
  ('00000000-0000-0000-0000-000000000010', 'végétarien'),
  ('00000000-0000-0000-0000-000000000010', 'pâtes');

-- Étapes recette démo
INSERT INTO recipe_steps (recipe_id, step_number, description, timer_seconds) VALUES
  ('00000000-0000-0000-0000-000000000010', 1, 'Faire bouillir une grande casserole d''eau salée.', NULL),
  ('00000000-0000-0000-0000-000000000010', 2, 'Cuire les pâtes al dente selon les indications.', 600),
  ('00000000-0000-0000-0000-000000000010', 3, 'Faire revenir l''ail et la courgette en dés dans l''huile d''olive, 5 min.', 300),
  ('00000000-0000-0000-0000-000000000010', 4, 'Ajouter les tomates coupées en deux, sel, poivre. Laisser compoter 3 min.', 180),
  ('00000000-0000-0000-0000-000000000010', 5, 'Égoutter les pâtes, mélanger à la sauce. Servir avec parmesan.', NULL);

-- Ingrédients recette démo
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
SELECT '00000000-0000-0000-0000-000000000010', i.id, qty, u, opt
FROM (VALUES
  ('Pâtes (sèches)',  160, 'g',      FALSE),
  ('Courgette',       200, 'g',      FALSE),
  ('Tomate',          150, 'g',      FALSE),
  ('Ail',              10, 'g',      FALSE),
  ('Huile d''olive',   20, 'ml',     FALSE),
  ('Parmesan',         30, 'g',      TRUE),
  ('Sel',               1, 'pincée', FALSE)
) AS v(name, qty, u, opt)
JOIN ingredients i ON i.name = v.name;

-- Frigo démo
INSERT INTO fridge_items (user_id, ingredient_id, quantity, unit, expiry_date)
SELECT '00000000-0000-0000-0000-000000000001', i.id, qty, u, exp
FROM (VALUES
  ('Courgette',       3,   'unité', CURRENT_DATE + 2),
  ('Tomate',        500,   'g',     CURRENT_DATE + 5),
  ('Parmesan',       80,   'g',     CURRENT_DATE + 20),
  ('Huile d''olive',500,   'ml',    NULL)
) AS v(name, qty, u, exp)
JOIN ingredients i ON i.name = v.name;

-- Planning démo
INSERT INTO planning (user_id, recipe_id, week_start, day_of_week, meal_slot, servings, is_surprise) VALUES
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000010',
   DATE_TRUNC('week', CURRENT_DATE)::DATE,
   1, 'dinner', 2, FALSE);