// src/pages/Profile.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import Button from "../components/Button";
import "../styles/Profile.css";

export default function Profile() {
  const { user, logout } = useAuth();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  const [form, setForm] = useState({
    name:       "",
    email:      "",
    calories:   2000,
    glucides:   250,
    proteines:  60,
    lipides:    70,
    allergies:  [],
    regime:     "aucun",
  });

  const REGIMES    = ["aucun","végétarien","végétalien","sans gluten","sans lactose","halal","casher"];
  const ALLERGIES  = ["Gluten","Lactose","Arachides","Fruits à coque","Œufs","Poisson","Fruits de mer","Soja","Sésame"];

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        // TODO (API) : décommenter quand l'endpoint est prêt
        // const res  = await fetch("/api/profile", {
        //   headers: { Authorization: `Bearer ${user?.token}` }
        // });
        // const data = await res.json();
        // setForm(f => ({ ...f, ...data }));

        // Pour l'instant : valeurs vides
        setForm(f => ({ ...f, name: user?.name || "", email: user?.email || "" }));
      } catch (err) {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setSuccess(false);
  };

  const handleAllergyToggle = (allergy) => {
    setForm(f => ({
      ...f,
      allergies: f.allergies.includes(allergy)
        ? f.allergies.filter(a => a !== allergy)
        : [...f.allergies, allergy],
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // TODO (API) : décommenter quand l'endpoint est prêt
      // await fetch("/api/profile", {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${user?.token}`
      //   },
      //   body: JSON.stringify(form),
      // });
      await new Promise(r => setTimeout(r, 600)); // simulation
      setSuccess(true);
    } catch (err) {
      setError("Impossible de sauvegarder les modifications.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pf-page">

      <div className="pf-header">
        <h1>Mon profil</h1>
        <p>Gérez vos informations et préférences</p>
      </div>

      {error   && <div className="pf-banner pf-banner--error"><i className="ti ti-alert-circle" /> {error}</div>}
      {success && <div className="pf-banner pf-banner--success"><i className="ti ti-check" /> Profil mis à jour avec succès</div>}

      <div className="pf-grid">

        {/* ── Identité ── */}
        <div className="pf-card">
          <div className="pf-card__title"><i className="ti ti-user" aria-hidden="true" />Informations personnelles</div>

          <div className="pf-avatar-row">
            <div className="pf-avatar">
              {form.name ? form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "?"}
            </div>
            <div>
              <p className="pf-avatar__name">{form.name || "—"}</p>
              <p className="pf-avatar__email">{form.email || "—"}</p>
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label">Prénom et nom</label>
            <input
              className="pf-input"
              type="text"
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
              placeholder="Marie Dupont"
              disabled={loading}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">Adresse email</label>
            <input
              className="pf-input"
              type="email"
              value={form.email}
              onChange={e => handleChange("email", e.target.value)}
              placeholder="marie@exemple.fr"
              disabled={loading}
            />
          </div>
        </div>

        {/* ── Objectifs nutritionnels ── */}
        <div className="pf-card">
          <div className="pf-card__title"><i className="ti ti-target" aria-hidden="true" />Objectifs nutritionnels</div>

          {[
            { field: "calories",  label: "Calories",  unit: "kcal", min: 1000, max: 4000, step: 50  },
            { field: "glucides",  label: "Glucides",  unit: "g",    min: 50,   max: 500,  step: 5   },
            { field: "proteines", label: "Protéines", unit: "g",    min: 20,   max: 250,  step: 5   },
            { field: "lipides",   label: "Lipides",   unit: "g",    min: 20,   max: 200,  step: 5   },
          ].map(({ field, label, unit, min, max, step }) => (
            <div key={field} className="pf-field">
              <div className="pf-label-row">
                <label className="pf-label">{label}</label>
                <span className="pf-unit">{form[field]} {unit}</span>
              </div>
              <input
                className="pf-range"
                type="range"
                min={min} max={max} step={step}
                value={form[field]}
                onChange={e => handleChange(field, Number(e.target.value))}
                disabled={loading}
              />
              <div className="pf-range-hints"><span>{min} {unit}</span><span>{max} {unit}</span></div>
            </div>
          ))}
        </div>

        {/* ── Régime alimentaire ── */}
        <div className="pf-card">
          <div className="pf-card__title"><i className="ti ti-leaf" aria-hidden="true" />Régime alimentaire</div>
          <div className="pf-regime-grid">
            {REGIMES.map(r => (
              <button
                key={r}
                className={`pf-regime-btn ${form.regime === r ? "pf-regime-btn--active" : ""}`}
                onClick={() => handleChange("regime", r)}
                disabled={loading}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Allergies ── */}
        <div className="pf-card">
          <div className="pf-card__title"><i className="ti ti-alert-triangle" aria-hidden="true" />Allergies &amp; intolérances</div>
          <div className="pf-allergy-grid">
            {ALLERGIES.map(a => (
              <button
                key={a}
                className={`pf-allergy-btn ${form.allergies.includes(a) ? "pf-allergy-btn--active" : ""}`}
                onClick={() => handleAllergyToggle(a)}
                disabled={loading}
              >
                {form.allergies.includes(a) && <i className="ti ti-check" aria-hidden="true" />}
                {a}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Actions ── */}
      <div className="pf-actions">
        <Button variant="ghost" icon="ti-logout" onClick={logout}>
          Se déconnecter
        </Button>
        <Button variant="primary" icon="ti-device-floppy" loading={saving} onClick={handleSave}>
          Sauvegarder
        </Button>
      </div>

    </div>
  );
}
