-- ============================================================
--  EasyMeal V2 — Schéma PostgreSQL complet (FIXED)
--  TEXT[] remplacés par des tables de jointure propres
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ============================================================
-- 1a. USER_DIETARY_PREFERENCES  (remplace users.dietary_preferences TEXT[])
--     ex: 'vegetarian', 'vegan', 'gluten_free', 'halal', 'kosher'
-- ============================================================
CREATE TABLE user_dietary_preferences (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference VARCHAR(50) NOT NULL,
  UNIQUE (user_id, preference)
);

CREATE INDEX idx_udp_user_id ON user_dietary_preferences (user_id);

-- ============================================================
-- 1b. USER_ALLERGENS  (remplace users.allergens TEXT[])
--     ex: 'nuts', 'dairy', 'gluten', 'eggs', 'shellfish'
-- ============================================================
CREATE TABLE user_allergens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allergen   VARCHAR(50) NOT NULL,
  UNIQUE (user_id, allergen)
);

CREATE INDEX idx_ual_user_id ON user_allergens (user_id);

-- ============================================================
-- 2. INGREDIENTS
-- ============================================================
CREATE TABLE ingredients (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(150) NOT NULL UNIQUE,
  category          VARCHAR(80)  NOT NULL,
  unit_default      VARCHAR(20)  NOT NULL DEFAULT 'g',
  calories_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  proteins_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  carbs_per_100g    NUMERIC(7,2) NOT NULL DEFAULT 0,
  fats_per_100g     NUMERIC(7,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_ingredients_category  ON ingredients (category);
CREATE INDEX idx_ingredients_name_trgm ON ingredients USING GIN (name gin_trgm_ops);

-- ============================================================
-- 3. RECIPES
-- ============================================================
CREATE TABLE recipes (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  title         VARCHAR(200) NOT NULL,
  prep_time_min INT          NOT NULL DEFAULT 0  CHECK (prep_time_min >= 0),
  cook_time_min INT          NOT NULL DEFAULT 0  CHECK (cook_time_min >= 0),
  servings      INT          NOT NULL DEFAULT 4  CHECK (servings > 0),
  diet_type     VARCHAR(50)  NOT NULL DEFAULT 'omnivore',
  calories      NUMERIC(7,2),
  proteins_g    NUMERIC(7,2),
  carbs_g       NUMERIC(7,2),
  fats_g        NUMERIC(7,2),
  image_url     TEXT,
  is_public     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipes_author_id  ON recipes (author_id);
CREATE INDEX idx_recipes_diet_type  ON recipes (diet_type);
CREATE INDEX idx_recipes_title_trgm ON recipes USING GIN (title gin_trgm_ops);

-- ============================================================
-- 3a. RECIPE_TAGS  (remplace recipes.tags TEXT[])
--     ex: 'rapide', 'végétarien', 'batch_cook', 'dessert'
-- ============================================================
CREATE TABLE recipe_tags (
  id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag       VARCHAR(50) NOT NULL,
  UNIQUE (recipe_id, tag)
);

CREATE INDEX idx_rtags_recipe_id ON recipe_tags (recipe_id);
CREATE INDEX idx_rtags_tag       ON recipe_tags (tag);

-- ============================================================
-- 4. RECIPE_STEPS
-- ============================================================
CREATE TABLE recipe_steps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number   INT  NOT NULL CHECK (step_number > 0),
  description   TEXT NOT NULL,
  timer_seconds INT  CHECK (timer_seconds >= 0),
  UNIQUE (recipe_id, step_number)
);

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps (recipe_id, step_number);

-- ============================================================
-- 5. RECIPE_INGREDIENTS
-- ============================================================
CREATE TABLE recipe_ingredients (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     UUID         NOT NULL REFERENCES recipes(id)     ON DELETE CASCADE,
  ingredient_id UUID         NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity      NUMERIC(8,2) NOT NULL CHECK (quantity > 0),
  unit          VARCHAR(20)  NOT NULL,
  is_optional   BOOLEAN      NOT NULL DEFAULT FALSE,
  UNIQUE (recipe_id, ingredient_id)
);

CREATE INDEX idx_recipe_ing_recipe     ON recipe_ingredients (recipe_id);
CREATE INDEX idx_recipe_ing_ingredient ON recipe_ingredients (ingredient_id);

-- ============================================================
-- 6. FRIDGE_ITEMS
-- ============================================================
CREATE TABLE fridge_items (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  ingredient_id UUID         NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity      NUMERIC(8,2) NOT NULL CHECK (quantity >= 0),
  unit          VARCHAR(20)  NOT NULL,
  expiry_date   DATE,
  added_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ingredient_id)
);

CREATE INDEX idx_fridge_user_id     ON fridge_items (user_id);
CREATE INDEX idx_fridge_expiry_date ON fridge_items (expiry_date)
  WHERE expiry_date IS NOT NULL;

CREATE VIEW fridge_expiring_soon AS
  SELECT fi.*, i.name AS ingredient_name, i.category,
         (fi.expiry_date - CURRENT_DATE) AS days_left
  FROM   fridge_items fi
  JOIN   ingredients i ON i.id = fi.ingredient_id
  WHERE  fi.expiry_date IS NOT NULL
    AND  fi.expiry_date <= CURRENT_DATE + INTERVAL '3 days'
  ORDER  BY fi.expiry_date ASC;

-- ============================================================
-- 7. PLANNING
-- ============================================================
CREATE TABLE planning (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  recipe_id   UUID        NOT NULL REFERENCES recipes(id)  ON DELETE CASCADE,
  week_start  DATE        NOT NULL,
  day_of_week SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  meal_slot   VARCHAR(20) NOT NULL,
  servings    INT         NOT NULL DEFAULT 2 CHECK (servings > 0),
  is_surprise BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start, day_of_week, meal_slot)
);

CREATE INDEX idx_planning_user_week ON planning (user_id, week_start);
CREATE INDEX idx_planning_recipe_id ON planning (recipe_id);

-- ============================================================
-- 8. SHOPPING_LISTS
-- ============================================================
CREATE TABLE shopping_lists (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  planning_id  UUID        REFERENCES planning(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_archived  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_shopping_user ON shopping_lists (user_id, is_archived);

-- ============================================================
-- 9. SHOPPING_LIST_ITEMS
-- ============================================================
CREATE TABLE shopping_list_items (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID         NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id    UUID         NOT NULL REFERENCES ingredients(id)    ON DELETE RESTRICT,
  quantity_needed  NUMERIC(8,2) NOT NULL CHECK (quantity_needed > 0),
  quantity_owned   NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (quantity_owned >= 0),
  unit             VARCHAR(20)  NOT NULL,
  is_checked       BOOLEAN      NOT NULL DEFAULT FALSE,
  UNIQUE (shopping_list_id, ingredient_id)
);

CREATE INDEX idx_shopping_items_list ON shopping_list_items (shopping_list_id);

-- ============================================================
-- TRIGGER : updated_at sur users
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();