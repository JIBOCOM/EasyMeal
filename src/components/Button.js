// src/components/Button.js
import React from "react";
import "../styles/Button.css";

// ─────────────────────────────────────────────
// Button
// Props:
//   variant  — "primary" | "secondary" | "ghost" | "danger"  (défaut: "primary")
//   size     — "sm" | "md" | "lg"                             (défaut: "md")
//   icon     — classe Tabler ex: "ti-plus"                    (optionnel)
//   iconPos  — "left" | "right"                               (défaut: "left")
//   disabled — boolean
//   loading  — boolean (remplace le contenu par un spinner)
//   onClick  — handler
//   type     — "button" | "submit" | "reset"                  (défaut: "button")
//   children — contenu textuel
// ─────────────────────────────────────────────
export default function Button({
  variant  = "primary",
  size     = "md",
  icon,
  iconPos  = "left",
  disabled = false,
  loading  = false,
  onClick,
  type     = "button",
  children,
  className = "",
  ...rest
}) {
  const classes = [
    "em-btn",
    `em-btn--${variant}`,
    `em-btn--${size}`,
    loading  ? "em-btn--loading"  : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <i className="ti ti-loader-2 em-btn__spinner" aria-hidden="true" />
      )}

      {!loading && icon && iconPos === "left" && (
        <i className={`ti ${icon}`} aria-hidden="true" />
      )}

      {children && <span>{children}</span>}

      {!loading && icon && iconPos === "right" && (
        <i className={`ti ${icon}`} aria-hidden="true" />
      )}
    </button>
  );
}
