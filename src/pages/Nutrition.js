// src/pages/Nutrition.js
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import "../styles/Nutrition.css";

const DAYS_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

const MACRO_CONFIG = [
  { key: "glucides",  label: "Glucides",  color: "#639922", border: "#3B6D11" },
  { key: "proteines", label: "Protéines", color: "#378ADD", border: "#185FA5" },
  { key: "lipides",   label: "Lipides",   color: "#BA7517", border: "#633806" },
];

// ─────────────────────────────────────────────
// MacroDonut — donut Chart.js + barres détaillées
// Remplace l'ancienne MacroBar
// ─────────────────────────────────────────────
function MacroDonut({ today, goals }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const values = MACRO_CONFIG.map(m => today[m.key] ?? 0);
  const total  = values.reduce((s, v) => s + v, 0);
  const hasData = total > 0;

  useEffect(() => {
    // Charge Chart.js dynamiquement si pas encore présent
    if (!window.Chart) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = () => buildChart();
      document.head.appendChild(script);
    } else {
      buildChart();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function buildChart() {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const emptyColor = "#E8E3DA";
    const data    = hasData ? values       : [1, 1, 1];
    const colors  = hasData ? MACRO_CONFIG.map(m => m.color)  : [emptyColor, emptyColor, emptyColor];
    const borders = hasData ? MACRO_CONFIG.map(m => m.border) : [emptyColor, emptyColor, emptyColor];

    chartRef.current = new window.Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: MACRO_CONFIG.map(m => m.label),
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: hasData ? 1.5 : 0,
          hoverOffset: hasData ? 6 : 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: (ctx) => {
                const pct = Math.round((values[ctx.dataIndex] / total) * 100);
                return ` ${values[ctx.dataIndex]}g (${pct}%)`;
              },
            },
          },
        },
      },
      plugins: [{
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea: { width, height, left, top } } = chart;
          const cx = left + width / 2;
          const cy = top + height / 2;
          ctx.save();
          if (hasData) {
            ctx.font = "500 20px DM Sans, sans-serif";
            ctx.fillStyle = "#3B2A1A";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${total}g`, cx, cy - 8);
            ctx.font = "400 11px DM Sans, sans-serif";
            ctx.fillStyle = "#8C7355";
            ctx.fillText("total", cx, cy + 10);
          } else {
            ctx.font = "400 12px DM Sans, sans-serif";
            ctx.fillStyle = "#8C7355";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Aucune donnée", cx, cy);
          }
          ctx.restore();
        },
      }],
    });
  }

  return (
    <div className="nt-donut-wrap">
      {/* Légende */}
      <div className="nt-donut-legend">
        {MACRO_CONFIG.map(m => (
          <span key={m.key} className="nt-donut-legend__item">
            <span className="nt-donut-legend__swatch" style={{ background: m.color }} />
            {m.label}
            <strong>{today[m.key] ?? 0}g</strong>
          </span>
        ))}
      </div>

      {/* Donut + barres */}
      <div className="nt-donut-body">
        <div className="nt-donut-canvas-wrap">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Donut macronutriments — Glucides ${today.glucides ?? 0}g, Protéines ${today.proteines ?? 0}g, Lipides ${today.lipides ?? 0}g`}
          >
            {MACRO_CONFIG.map(m => `${m.label} : ${today[m.key] ?? 0}g / ${goals[m.key]}g`).join(" — ")}
          </canvas>
        </div>

        {/* Barres détaillées */}
        <div className="nt-donut-bars">
          {MACRO_CONFIG.map(m => {
            const val = today[m.key] ?? 0;
            const max = goals[m.key];
            const pct = max > 0 ? Math.min(Math.round((val / max) * 100), 100) : 0;
            return (
              <div key={m.key} className="nt-macro-row">
                <div className="nt-macro-row__header">
                  <span className="nt-macro-row__label">{m.label}</span>
                  <span className="nt-macro-row__val">{val}g <span className="nt-macro-row__max">/ {max}g</span></span>
                </div>
                <div className="nt-macro-row__track">
                  <div className="nt-macro-row__fill" style={{ width: `${pct}%`, background: m.color }} />
                </div>
                <div className="nt-macro-row__hint">{pct}% · reste {Math.max(max - val, 0)}g</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalorieRing({ current, goal }) {
  const pct  = goal > 0 ? Math.min(current / goal, 1) : 0;
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="nt-ring">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(140,115,85,0.12)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="#A8C57A" strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="nt-ring__center">
        <span className="nt-ring__val">{current ?? 0}</span>
        <span className="nt-ring__label">kcal</span>
      </div>
    </div>
  );
}

function WeekChart({ data }) {
  const max = Math.max(...data.map(d => d.calories || 0), 1);
  return (
    <div className="nt-week-chart">
      {DAYS_SHORT.map((day, i) => {
        const val = data[i]?.calories || 0;
        const pct = (val / max) * 100;
        const today = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
        return (
          <div key={day} className="nt-week-chart__col">
            <span className="nt-week-chart__val">{val > 0 ? val : ""}</span>
            <div className="nt-week-chart__bar-wrap">
              <div
                className={`nt-week-chart__bar ${today ? "nt-week-chart__bar--today" : ""}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`nt-week-chart__day ${today ? "nt-week-chart__day--today" : ""}`}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Nutrition() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  useEffect(() => {
    async function fetchNutrition() {
      setLoading(true);
      setError(null);
      try {
        // TODO (API) : décommenter quand l'endpoint est prêt
        // const res  = await fetch("/api/nutrition/today", {
        //   headers: { Authorization: `Bearer ${user?.token}` }
        // });
        // const json = await res.json();
        // setData(json);

        // Pour l'instant : données vides
        setData(null);
      } catch (err) {
        setError("Impossible de charger les données nutritionnelles.");
      } finally {
        setLoading(false);
      }
    }
    fetchNutrition();
  }, [user]);

  const today = data?.today || {};
  const goals = data?.goals || { calories: 2000, glucides: 250, proteines: 60, lipides: 70 };
  const week  = data?.week  || Array(7).fill({ calories: 0 });

  return (
    <div className="nt-page">

      <div className="nt-header">
        <h1>Nutrition</h1>
        <p>Suivi de la journée</p>
      </div>

      {error && <div className="nt-error"><i className="ti ti-wifi-off" /> {error}</div>}

      <div className="nt-top-grid">

        {/* ── Anneau calories ── */}
        <div className="nt-card">
          <div className="nt-card__title"><i className="ti ti-flame" aria-hidden="true" />Calories du jour</div>
          <div className="nt-calories">
            <CalorieRing current={today.calories ?? 0} goal={goals.calories} />
            <div className="nt-calories__info">
              <div className="nt-calories__row">
                <span className="nt-calories__label">Consommées</span>
                <span className="nt-calories__val">{today.calories ?? 0} kcal</span>
              </div>
              <div className="nt-calories__row">
                <span className="nt-calories__label">Objectif</span>
                <span className="nt-calories__val">{goals.calories} kcal</span>
              </div>
              <div className="nt-calories__row">
                <span className="nt-calories__label">Restantes</span>
                <span className="nt-calories__val nt-calories__val--remain">
                  {Math.max(goals.calories - (today.calories ?? 0), 0)} kcal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Macros ── */}
        <div className="nt-card">
          <div className="nt-card__title"><i className="ti ti-chart-pie" aria-hidden="true" />Macronutriments</div>
          <MacroDonut today={today} goals={goals} />
        </div>
      </div>

      {/* ── Graphique semaine ── */}
      <div className="nt-card nt-card--full">
        <div className="nt-card__title"><i className="ti ti-chart-bar" aria-hidden="true" />Calories cette semaine</div>
        {loading
          ? <div className="nt-skeleton" style={{height:120}} />
          : <WeekChart data={week} />
        }
      </div>

      {/* ── Repas du jour ── */}
      <div className="nt-card nt-card--full">
        <div className="nt-card__title"><i className="ti ti-list" aria-hidden="true" />Repas enregistrés</div>
        {loading
          ? <div className="nt-skeleton-list"><div className="nt-skeleton" /><div className="nt-skeleton" /></div>
          : (!data?.meals || data.meals.length === 0)
            ? <div className="nt-empty"><i className="ti ti-salad" aria-hidden="true" /><p>Aucun repas enregistré aujourd'hui</p></div>
            : <ul className="nt-meal-list">
                {data.meals.map((m, i) => (
                  <li key={i} className="nt-meal-item">
                    <span className="nt-meal-emoji" aria-hidden="true">{m.emoji || "🍽️"}</span>
                    <div className="nt-meal-info">
                      <span className="nt-meal-name">{m.name}</span>
                      <span className="nt-meal-meta">{m.slot}</span>
                    </div>
                    <div className="nt-meal-macros">
                      <span>{m.calories} kcal</span>
                      <span>G {m.glucides}g</span>
                      <span>P {m.proteines}g</span>
                      <span>L {m.lipides}g</span>
                    </div>
                  </li>
                ))}
              </ul>
        }
      </div>

    </div>
  );
}
