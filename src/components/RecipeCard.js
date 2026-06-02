// src/components/RecipeCard.js
import React from "react";
import "../styles/RecipeCard.css";

const DIFFICULTY_CLASS = {
  Facile:    "rc-tag--green",
  Moyen:     "rc-tag--amber",
  Difficile: "rc-tag--red",
};

const MEAL_TYPE_CLASS = {
  Déjeuner: "rc-tag--amber",
  Dîner:    "rc-tag--gray",
  default:  "rc-tag--gray",
};

export default function RecipeCard({ recipe, onClick }) {
  if (!recipe) return null;

  const {
    name       = "Recette sans nom",
    emoji      = "🍽️",
    imageUrl   = null,
    duration   = null,
    servings   = null,
    difficulty = null,
    mealType   = null,
    matchPct   = null,
    missing    = 0,
  } = recipe;

  const diffClass = DIFFICULTY_CLASS[difficulty] ?? "rc-tag--gray";
  const mealClass = MEAL_TYPE_CLASS[mealType]    ?? MEAL_TYPE_CLASS.default;

  const matchLabel = matchPct !== null ? `${matchPct}% dispo` : null;
  const allAvail   = missing === 0 && matchPct !== null;

  return (
    <article
      className="rc"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`Recette : ${name}`}
    >
      {/* ── Miniature ── */}
      <div className="rc__thumb">
        {imageUrl
          ? <img src={imageUrl} alt={name} className="rc__thumb-img" />
          : <span className="rc__thumb-emoji" aria-hidden="true">{emoji}</span>
        }
      </div>

      {/* ── Corps ── */}
      <div className="rc__body">
        <h3 className="rc__title" title={name}>{name}</h3>

        {/* Méta — durée + portions */}
        <div className="rc__meta">
          {duration  != null && (
            <span>
              <i className="ti ti-clock" aria-hidden="true" />
              {duration} min
            </span>
          )}
          {servings  != null && (
            <span>
              <i className="ti ti-users" aria-hidden="true" />
              {servings} pers.
            </span>
          )}
        </div>

        {/* Tags — difficulté + type de repas */}
        {(difficulty || mealType) && (
          <div className="rc__tags">
            {difficulty && (
              <span className={`rc-tag ${diffClass}`}>{difficulty}</span>
            )}
            {mealType && (
              <span className={`rc-tag ${mealClass}`}>{mealType}</span>
            )}
          </div>
        )}

        {/* Footer — disponibilité ingrédients */}
        {matchLabel && (
          <div className="rc__footer">
            <span className="rc__match">{matchLabel}</span>
            {allAvail
              ? <span className="rc__badge rc__badge--ok">Tout dispo</span>
              : <span className="rc__badge rc__badge--warn">
                  {missing} manquant{missing > 1 ? "s" : ""}
                </span>
            }
          </div>
        )}
      </div>
    </article>
  );
}
