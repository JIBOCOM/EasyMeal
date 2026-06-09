// Shopping.js — Liste de courses auto-générée depuis le planning, triée par rayon
// P3 (Fullstack) : UI connectée à l'API backend (routes/shopping.js — P1)

import React, { useState, useEffect } from "react";
import "../styles/Shopping.css";

const API_URL = process.env.REACT_APP_API_URL;

// Mock fallback
const MOCK_SHOPPING = [
  { id: 1, name: "Poulet", category: "Viandes & Poissons", quantity: 400, unit: "g", checked: false },
  { id: 2, name: "Carottes", category: "Fruits & Légumes", quantity: 3, unit: "pièces", checked: false },
  { id: 3, name: "Oignons", category: "Fruits & Légumes", quantity: 2, unit: "pièces", checked: false },
  { id: 4, name: "Pâtes", category: "Épicerie", quantity: 500, unit: "g", checked: false },
  { id: 5, name: "Parmesan", category: "Produits laitiers", quantity: 100, unit: "g", checked: false },
  { id: 6, name: "Lait", category: "Produits laitiers", quantity: 1, unit: "L", checked: false },
  { id: 7, name: "Pain de mie", category: "Boulangerie", quantity: 1, unit: "paquet", checked: false },
  { id: 8, name: "Huile d'olive", category: "Épicerie", quantity: 1, unit: "bouteille", checked: false },
];

const Shopping = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchList = async () => {
      if (!API_URL) {
        setItems(MOCK_SHOPPING);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/shopping`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error("Erreur chargement liste de courses");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const toggleCheck = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const clearChecked = () => setItems((prev) => prev.filter((i) => !i.checked));

  // Grouper par rayon/catégorie
  const byCategory = items.reduce((acc, item) => {
    const cat = item.category || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const checkedCount = items.filter((i) => i.checked).length;
  const progress = items.length ? Math.round((checkedCount / items.length) * 100) : 0;

  if (loading) return <div className="shopping__loading">Génération de la liste…</div>;
  if (error) return <div className="shopping__error">Erreur : {error}</div>;

  return (
    <div className="shopping">
      <div className="shopping__header">
        <h1 className="shopping__title">🛒 Liste de courses</h1>
        {checkedCount > 0 && (
          <button className="shopping__clear" onClick={clearChecked}>
            Supprimer cochés ({checkedCount})
          </button>
        )}
      </div>

      {/* Barre de progression */}
      <div className="shopping__progress-bar">
        <div className="shopping__progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="shopping__progress-label">
        {checkedCount} / {items.length} articles ({progress}%)
      </p>

      {/* Liste par rayon */}
      {Object.entries(byCategory).map(([category, categoryItems]) => (
        <div className="shopping__category" key={category}>
          <h2 className="shopping__category-title">{category}</h2>
          <ul className="shopping__list">
            {categoryItems.map((item) => (
              <li
                key={item.id}
                className={`shopping__item ${item.checked ? "checked" : ""}`}
                onClick={() => toggleCheck(item.id)}
              >
                <span className="shopping__checkbox">{item.checked ? "✅" : "⬜"}</span>
                <span className="shopping__item-name">{item.name}</span>
                <span className="shopping__item-qty">
                  {item.quantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Shopping;
