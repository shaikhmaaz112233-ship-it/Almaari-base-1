import React, { useState } from "react";
import { motion } from "framer-motion";
import CupboardLogo from "../components/CupboardLogo";
import { loginUser } from "../api";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("almaari123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDoorOpen, setIsDoorOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(username.trim(), password);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      // Successful login: cupboard door swings slightly open!
      setIsDoorOpen(true);

      // Brief tactile pause to enjoy the cupboard door opening animation
      setTimeout(() => {
        onLoginSuccess(data);
      }, 700);

    } catch (err) {
      console.error("Login submission error:", err);
      setError(err.message || "Could not reach backend server at http://127.0.0.1:8000.");
      setLoading(false);
    }
  };

  // Staggered motion variants for form elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
        }}
      >
        {/* Archival Container Card */}
        <motion.div
          className="archive-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "relative",
            border: "var(--border-ink)",
            boxShadow: "var(--shadow-lg)",
            backgroundColor: "var(--paper-card)",
          }}
        >
          {/* Top Brass / Ink Plate */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              paddingBottom: "20px",
              borderBottom: "1px dashed rgba(21, 26, 23, 0.25)",
              marginBottom: "24px",
            }}
          >
            <CupboardLogo isOpen={isDoorOpen} size={48} />
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "30px",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                }}
              >
                Almaari
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--ink-muted)",
                  marginTop: "3px",
                }}
              >
                Apni files se poochho. (Ask your files anything.)
              </p>
            </div>
          </div>

          {/* Quiet, careful archival copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: "14px",
              color: "var(--ink-muted)",
              marginBottom: "24px",
              lineHeight: 1.5,
            }}
          >
            A private cupboard for your company's papers. Please unlock the
            door to search through filed documents.
          </motion.p>

          {/* Animated Form Fields */}
          <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Username Field */}
            <motion.div variants={itemVariants} style={{ marginBottom: "18px" }}>
              <label className="input-label" htmlFor="username">
                Keeper Identity
              </label>
              <input
                id="username"
                type="text"
                className="input-field mono"
                placeholder="Username (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} style={{ marginBottom: "22px" }}>
              <label className="input-label" htmlFor="password">
                Cupboard Key
              </label>
              <input
                id="password"
                type="password"
                className="input-field mono"
                placeholder="Password (e.g. almaari123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="stamp-tag vermilion"
                style={{
                  display: "block",
                  marginBottom: "18px",
                  padding: "8px 12px",
                  fontSize: "13px",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Success state notice */}
            {isDoorOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="stamp-tag verdigris"
                style={{
                  display: "block",
                  marginBottom: "18px",
                  padding: "8px 12px",
                  fontSize: "13px",
                }}
              >
                The cupboard unlocks... Welcome, {username}.
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                className="btn btn-primary"
                disabled={loading || isDoorOpen}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: "16px",
                  cursor: loading || isDoorOpen ? "wait" : "pointer",
                }}
              >
                {loading
                  ? "Turning the key..."
                  : isDoorOpen
                  ? "Cupboard Unlocked"
                  : "Open Almaari"}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
