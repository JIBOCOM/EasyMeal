// src/components/Navbar.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "../styles/Navbar.css";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { to: "/",         icon: "ti-home",          label: "Accueil"  },
      { to: "/planning", icon: "ti-calendar",       label: "Planning" },
      { to: "/recipes",  icon: "ti-book",           label: "Recettes" },
    ],
  },
  {
    label: "Cuisine",
    items: [
      { to: "/fridge",    icon: "ti-snowflake",     label: "Mon frigo", badgeKey: "fridge"   },
      { to: "/shopping",  icon: "ti-shopping-cart", label: "Courses",   badgeKey: "shopping" },
      { to: "/nutrition", icon: "ti-chart-bar",     label: "Nutrition" },
    ],
  },
];

const DEFAULT_BADGES = { fridge: 0, shopping: 0 };

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Navbar({ badges = DEFAULT_BADGES }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || "Utilisateur";
  const initials    = getInitials(displayName);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="em-nav" aria-label="Navigation principale">

      <div className="em-nav__logo">
        <span className="em-nav__logo-title">EasyMeal</span>
        <span className="em-nav__logo-sub">Planificateur de repas</span>
      </div>

      <div className="em-nav__links">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="em-nav__section">
            <span className="em-nav__section-label">{section.label}</span>
            {section.items.map(({ to, icon, label, badgeKey }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  isActive ? "em-nav__item em-nav__item--active" : "em-nav__item"
                }
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                <span className="em-nav__item-label">{label}</span>
                {badgeKey && badges[badgeKey] > 0 && (
                  <span className="em-nav__badge">{badges[badgeKey]}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="em-nav__bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "em-nav__user em-nav__user--active" : "em-nav__user"
          }
        >
          <div className="em-nav__avatar">{initials}</div>
          <div className="em-nav__user-info">
            <span className="em-nav__user-name">{displayName}</span>
            <span className="em-nav__user-role">Mon profil</span>
          </div>
          <i className="ti ti-settings em-nav__settings-icon" aria-hidden="true" />
        </NavLink>

        <button className="em-nav__logout" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          <span>Déconnexion</span>
        </button>
      </div>

    </nav>
  );
}
