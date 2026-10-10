import React from "react";
import { Link, useLocation } from "react-router-dom";
import CupboardLogo from "./CupboardLogo";

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <header
      style={{
        borderBottom: "var(--border-ink)",
        backgroundColor: "var(--paper-light)",
        padding: "16px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Brand: Wordmark + Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            color: "var(--ink)",
          }}
        >
          <CupboardLogo isOpen={Boolean(user)} size={34} />
          <div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "26px",
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              Almaari
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--ink-muted)",
                marginTop: "2px",
              }}
            >
              <span style={{ fontWeight: 600 }}>Apni files se poochho.</span>{" "}
              <span style={{ fontStyle: "italic", opacity: 0.85 }}>
                (Ask your files anything.)
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation & Controls */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <nav style={{ display: "flex", gap: "8px" }}>
              <Link
                to="/documents"
                className={`btn btn-sm ${
                  location.pathname === "/documents" ? "btn-primary" : ""
                }`}
                style={{
                  borderBottom:
                    location.pathname === "/documents"
                      ? "2px solid var(--ink)"
                      : undefined,
                }}
              >
                Documents
              </Link>
              <Link
                to="/chat"
                className={`btn btn-sm ${
                  location.pathname === "/chat" ? "btn-primary" : ""
                }`}
              >
                Chat
              </Link>
            </nav>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingLeft: "12px",
                borderLeft: "1px solid rgba(21,26,23,0.2)",
              }}
            >
              <span className="stamp-tag mustard">
                keeper: {user.username}
              </span>
              <button
                onClick={onLogout}
                className="btn btn-sm"
                title="Lock the cupboard and log out"
                style={{ color: "var(--vermilion)" }}
              >
                Lock Cupboard
              </button>
            </div>
          </div>
        ) : (
          <div className="stamp-tag verdigris">
            Cupboard Closed
          </div>
        )}
      </div>
    </header>
  );
}
