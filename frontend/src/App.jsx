import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DocumentsPage from "./pages/DocumentsPage";
import ChatPage from "./pages/ChatPage";

function AnimatedRoutes({ user, onLoginSuccess, onLogout }) {
  const location = useLocation();

  const pageTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.25, ease: "easeInOut" },
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/documents" replace />
            ) : (
              <motion.div {...pageTransition}>
                <LoginPage onLoginSuccess={onLoginSuccess} />
              </motion.div>
            )
          }
        />

        <Route
          path="/documents"
          element={
            user ? (
              <motion.div {...pageTransition}>
                <DocumentsPage />
              </motion.div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/chat"
          element={
            user ? (
              <motion.div {...pageTransition}>
                <ChatPage />
              </motion.div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default route */}
        <Route
          path="*"
          element={<Navigate to={user ? "/documents" : "/login"} replace />}
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("almaari_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("almaari_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("almaari_user");
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar user={user} onLogout={handleLogout} />
        <main style={{ flex: 1 }}>
          <AnimatedRoutes
            user={user}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        </main>
      </div>
    </BrowserRouter>
  );
}
