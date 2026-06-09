// src/pages/Fridge.js
// P3 Fullstack — UI + connexion API
// P1 Backend — routes /api/fridge (GET, POST, PUT, DELETE, /expiring)

import React, { useState, useEffect } from "react";
import { fridge as fridgeApi } from "../api";
import IngredientTag from "../components/IngredientTag";
import Button from "../components/Button";
import Modal from "../components/Modal";

// ─────────────────────────────────────────────
// Fridge.js — Mon Frigo
// Affiche les ingrédients, leurs dates d'expiration,
// et les alertes anti-gaspi (V2)
// ─────────────────────────────────────────────
export default function Fridge() {
  const [ingredients, setIngredients]   = useState([]);
  const [expiring, setExpiring]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showModal, setShowModal]       = useState(false);

  // Formulaire ajout ingrédient
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "",
    expirationDate: "",
  });

  // ── Chargement initial ──
  useEffect(() => {
    loadFridge();
  }, []);

  async function loadFridge() {
    setLoading(true);
    setError(null);
    try {
      const [allIngredients, expiringSoon] = await Promise.all([
        fridgeApi.getAll(),
        fridgeApi.getExpiringSoon(), // V2 anti-gaspi
      ]);
      setIngredients(allIngredients);
      setExpiring(expiringSoon);
    } catch (err) {
      setError("Impossible de charger le frigo. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  // ── Ajout d'un ingrédient ──
  async function handleAdd() {
    if (!newIngredient.name.trim()) return;
    try {
      const added = await fridgeApi.addIngredient(newIngredient);
      setIngredients((prev) => [...prev, added]);
      setShowModal(false);
      setNewIngredient({ name: "", quantity: "", unit: "", expirationDate: "" });
    } catch (err) {
      setError("Erreur lors de l'ajout.");
    }
  }

  // ── Suppression d'un ingrédient ──
  async function handleDelete(id) {
    try {
      await fridgeApi.deleteIngredient(id);
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression.");
    }
  }

  // ── Mise à jour quantité ──
  async function handleUpdate(id, data) {
    try {
      const updated = await fridgeApi.updateIngredient(id, data);
      setIngredients((prev) =>
        prev.map((i) => (i.id === id ? updated : i))
      );
    } catch (err) {
      setError("Erreur lors de la mise à jour.");
    }
  }

  // ─────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────
  if (loading) return <p className="fridge-loading">Chargement du frigo...</p>;

  return (
    <div className="fridge-page">

      {/* ── Header ── */}
      <div className="fridge-header">
        <h1>Mon Frigo</h1>
        <Button onClick={() => setShowModal(true)}>+ Ajouter</Button>
      </div>

      {/* ── Alertes anti-gaspi V2 ── */}
      {expiring.length > 0 && (
        <div className="fridge-alert">
          <span>⚠️ {expiring.length} ingrédient(s) bientôt périmé(s) :</span>
          <ul>
            {expiring.map((item) => (
              <li key={item.id}>
                {item.name} — expire le {new Date(item.expirationDate).toLocaleDateString("fr-FR")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Erreur ── */}
      {error && <p className="fridge-error">{error}</p>}

      {/* ── Liste des ingrédients ── */}
      {ingredients.length === 0 ? (
        <p className="fridge-empty">Ton frigo est vide. Ajoute des ingrédients !</p>
      ) : (
        <ul className="fridge-list">
          {ingredients.map((ingredient) => (
            <li key={ingredient.id} className="fridge-item">
              {/* IngredientTag géré par P2 */}
              <IngredientTag
                name={ingredient.name}
                available={ingredient.quantity > 0}
              />
              <span className="fridge-item-qty">
                {ingredient.quantity} {ingredient.unit}
              </span>
              {ingredient.expirationDate && (
                <span className="fridge-item-date">
                  Exp. {new Date(ingredient.expirationDate).toLocaleDateString("fr-FR")}
                </span>
              )}
              <Button
                variant="danger"
                size="small"
                onClick={() => handleDelete(ingredient.id)}
              >
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Modal ajout ingrédient ── */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Ajouter un ingrédient">
          <div className="fridge-form">
            <input
              type="text"
              placeholder="Nom (ex: Tomates)"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Quantité"
              value={newIngredient.quantity}
              onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
            />
            <input
              type="text"
              placeholder="Unité (ex: g, ml, pièce)"
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
            />
            <input
              type="date"
              value={newIngredient.expirationDate}
              onChange={(e) => setNewIngredient({ ...newIngredient, expirationDate: e.target.value })}
            />
            <Button onClick={handleAdd}>Confirmer</Button>
          </div>
        </Modal>
      )}

    </div>
  );
}
