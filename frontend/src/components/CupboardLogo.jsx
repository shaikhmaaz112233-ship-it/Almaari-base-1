import React from "react";
import { motion } from "framer-motion";

/**
 * CupboardLogo:
 * Inline SVG of an archival cupboard door with a keyhole.
 * When `isOpen` is true (e.g. login success or authenticated),
 * the door swings slightly open on its left hinge.
 */
export default function CupboardLogo({ isOpen = false, size = 32, className = "" }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: "600px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className={className}
      aria-label="Almaari Cupboard Door Logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* Outer Cupboard Cabinet Frame */}
        <rect
          x="3"
          y="3"
          width="34"
          height="40"
          rx="1"
          fill="var(--paper-dark, #DECDB0)"
          stroke="var(--ink, #151A17)"
          strokeWidth="2.5"
        />

        {/* Interior Shelf Shadow visible when open */}
        <line
          x1="5"
          y1="22"
          x2="35"
          y2="22"
          stroke="var(--ink-muted, #535C56)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />

        {/* Animated Cupboard Door (Hinged on the left side) */}
        <motion.g
          initial={false}
          animate={{
            rotateY: isOpen ? -38 : 0,
            x: isOpen ? -2 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 18,
          }}
          style={{
            transformOrigin: "4px 23px",
            transformBox: "view-box",
          }}
        >
          {/* Door panel */}
          <rect
            x="4"
            y="4"
            width="32"
            height="38"
            rx="1"
            fill="var(--paper-card, #FAF8F2)"
            stroke="var(--ink, #151A17)"
            strokeWidth="2"
          />

          {/* Door Inset Molding Frame */}
          <rect
            x="8"
            y="8"
            width="24"
            height="30"
            rx="0.5"
            fill="none"
            stroke="var(--ink, #151A17)"
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* Keyhole Escutcheon */}
          <rect
            x="24"
            y="20"
            width="6"
            height="8"
            rx="1"
            fill="var(--mustard, #D8A23A)"
            stroke="var(--ink, #151A17)"
            strokeWidth="1"
          />

          {/* Keyhole Opening */}
          <circle cx="27" cy="23" r="1.2" fill="var(--ink, #151A17)" />
          <polygon points="26.3,23.5 27.7,23.5 27.4,26.2 26.6,26.2" fill="var(--ink, #151A17)" />

          {/* Door Knob/Handle */}
          <circle
            cx="31"
            cy="24"
            r="1.8"
            fill="var(--ink, #151A17)"
          />
        </motion.g>

        {/* Small Hinges on the Left Edge */}
        <rect x="2" y="9" width="3" height="4" fill="var(--ink, #151A17)" rx="0.5" />
        <rect x="2" y="33" width="3" height="4" fill="var(--ink, #151A17)" rx="0.5" />
      </svg>
    </div>
  );
}
