// src/api.js
// Créé par P3 — Centralise tous les appels fetch vers le backend
// Toutes les pages et composants passent par ici, jamais de fetch direct ailleurs

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─────────────────────────────────────────────
// Utilitaire interne — fetch avec gestion token JWT
// ─────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Erreur ${response.status}`);
  }

  // 204 No Content — pas de body à parser
  if (response.status === 204) return null;

  return response.json();
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const auth = {
  login: (credentials) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),

  register: (userData) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(userData) }),

  logout: () => localStorage.removeItem("token"),
};

// ─────────────────────────────────────────────
// RECETTES — routes/recipes.js (P1)
// ─────────────────────────────────────────────
export const recipes = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/recipes${params ? `?${params}` : ""}`);
  },

  getById: (id) => apiFetch(`/recipes/${id}`),

  create: (data) =>
    apiFetch("/recipes", { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    apiFetch(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id) =>
    apiFetch(`/recipes/${id}`, { method: "DELETE" }),

  // V2 — recommandations basées sur le frigo (services/recommender.js)
  getRecommended: () => apiFetch("/recipes/recommended"),
};

// ─────────────────────────────────────────────
// FRIGO — routes/fridge.js (P1)
// ─────────────────────────────────────────────
export const fridge = {
  getAll: () => apiFetch("/fridge"),

  addIngredient: (ingredient) =>
    apiFetch("/fridge", { method: "POST", body: JSON.stringify(ingredient) }),

  updateIngredient: (id, data) =>
    apiFetch(`/fridge/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteIngredient: (id) =>
    apiFetch(`/fridge/${id}`, { method: "DELETE" }),

  // V2 — alertes anti-gaspi (services/antiGaspi.js)
  getExpiringSoon: () => apiFetch("/fridge/expiring"),
};

// ─────────────────────────────────────────────
// PLANNING — routes/planning.js (P1)
// ─────────────────────────────────────────────
export const planning = {
  getWeek: () => apiFetch("/planning"),

  setMeal: (day, mealType, recipeId) =>
    apiFetch("/planning", {
      method: "POST",
      body: JSON.stringify({ day, mealType, recipeId }),
    }),

  removeMeal: (day, mealType) =>
    apiFetch(`/planning/${day}/${mealType}`, { method: "DELETE" }),

  // V2 — Surprise me ! (services/surprise.js)
  surpriseMe: () => apiFetch("/planning/surprise", { method: "POST" }),
};

// ─────────────────────────────────────────────
// LISTE DE COURSES — routes/shopping.js (P1)
// ─────────────────────────────────────────────
export const shopping = {
  getList: () => apiFetch("/shopping"),

  // Regenère la liste depuis le planning courant
  generateList: () => apiFetch("/shopping/generate", { method: "POST" }),

  toggleItem: (id) =>
    apiFetch(`/shopping/${id}/toggle`, { method: "PATCH" }),
};

// ─────────────────────────────────────────────
// PROFIL UTILISATEUR
// ─────────────────────────────────────────────
export const profile = {
  get: () => apiFetch("/profile"),

  update: (data) =>
    apiFetch("/profile", { method: "PUT", body: JSON.stringify(data) }),
};
