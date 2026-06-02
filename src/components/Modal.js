// src/components/Modal.js
import React, { useEffect, useRef } from "react";
import Button from "./Button";
import "../styles/Modal.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  confirmLabel = "Confirmer",
  cancelLabel  = "Annuler",
  onConfirm,
  danger = false,
  size   = "md",
}) {
  const modalRef = useRef(null);

  // Ferme sur Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Bloque le scroll du body quand ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus trap simple — focus le modal à l'ouverture
  useEffect(() => {
    if (isOpen) modalRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="em-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="em-modal-title"
    >
      <div
        className={`em-modal em-modal--${size}`}
        ref={modalRef}
        tabIndex={-1}
      >
        {/* ── Header ── */}
        <div className="em-modal__header">
          {title && (
            <h2 className="em-modal__title" id="em-modal-title">
              {title}
            </h2>
          )}
          <button
            className="em-modal__close"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* ── Corps ── */}
        <div className="em-modal__body">
          {children}
        </div>

        {/* ── Footer ── */}
        {(footer || onConfirm || cancelLabel) && (
          <>
            <div className="em-modal__divider" />
            <div className="em-modal__footer">
              {footer ?? (
                <>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    {cancelLabel}
                  </Button>
                  {onConfirm && (
                    <Button
                      variant={danger ? "danger" : "primary"}
                      size="sm"
                      icon="ti-check"
                      onClick={onConfirm}
                    >
                      {confirmLabel}
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
