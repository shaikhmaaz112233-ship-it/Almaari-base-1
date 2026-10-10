import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { askQuestion, getDocuments } from "../api";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [docCount, setDocCount] = useState(0);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll down on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load document count for empty state awareness
  useEffect(() => {
    getDocuments()
      .then((data) => setDocCount((data.documents || []).length))
      .catch(() => {});
  }, []);

  // Keyboard shortcuts: '/' focuses input, 'Esc' closes chunk preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSelectedChunk(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || loading) return;

    // Add user message (slides in from right)
    const userMsgId = `user_${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const data = await askQuestion(query);

      // Add AI response placeholder that will animate word by word
      const aiMsgId = `ai_${Date.now()}`;
      const aiMessage = {
        id: aiMsgId,
        sender: "ai",
        fullText: data.answer || "No response recorded.",
        sources: data.sources || [],
        chunks: data.chunks || [],
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          fullText: `Could not retrieve an answer: ${err.message}`,
          sources: [],
          chunks: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "24px 16px 40px",
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 84px)",
      }}
    >
      {/* Top Archive Header */}
      <div
        style={{
          borderBottom: "1px dashed rgba(21, 26, 23, 0.25)",
          paddingBottom: "14px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px" }}>
            Ask Almaari
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "13px" }}>
            "Apni files se poochho." Answers are grounded strictly in your filed documents.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="stamp-tag mustard">
            Shortcut: press <strong className="mono" style={{ margin: "0 2px" }}>/</strong> to ask
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          marginBottom: "20px",
          minHeight: "320px",
        }}
      >
        {messages.length === 0 ? (
          <div
            className="archive-card"
            style={{
              margin: "auto 0",
              textAlign: "center",
              padding: "48px 24px",
              backgroundColor: "var(--paper-light)",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.6">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "22px",
                marginBottom: "8px",
              }}
            >
              Your files are put away. Ask me where things are.
            </h2>
            <p
              style={{
                color: "var(--ink-muted)",
                fontSize: "14px",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              {docCount === 0
                ? "The cupboard currently has no files. Visit the Documents tab to deposit handbook or notes first."
                : `Currently referencing ${docCount} filed documents. Type a question below or press '/' to begin.`}
            </p>
          </div>
        ) : (
          messages.map((msg) =>
            msg.sender === "user" ? (
              <UserMessageBubble key={msg.id} text={msg.text} />
            ) : (
              <AiMessageCard
                key={msg.id}
                message={msg}
                onSelectChunk={(chunk) => setSelectedChunk(chunk)}
              />
            )
          )
        )}

        {/* Searching Documents Indicator */}
        {loading && <SearchingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        style={{
          position: "sticky",
          bottom: "16px",
          backgroundColor: "var(--paper-card)",
          border: "var(--border-ink)",
          boxShadow: "var(--shadow-md)",
          padding: "8px 12px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "16px",
            color: "var(--ink-muted)",
            paddingLeft: "6px",
          }}
        >
          &gt;
        </span>

        <input
          ref={inputRef}
          type="text"
          className="mono"
          placeholder="Ask a question about your files... (or press /)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            fontSize: "15px",
            color: "var(--ink)",
            fontFamily: "var(--font-sans)",
            padding: "8px 4px",
          }}
        />

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!inputValue.trim() || loading}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
          }}
        >
          Ask
        </button>
      </form>

      {/* Chunk Preview Modal */}
      <AnimatePresence>
        {selectedChunk && (
          <ChunkPreviewModal
            chunk={selectedChunk}
            onClose={() => setSelectedChunk(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * User message sliding in smoothly from the right
 */
function UserMessageBubble({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        alignSelf: "flex-end",
        maxWidth: "80%",
        backgroundColor: "var(--paper-light)",
        border: "var(--border-ink)",
        boxShadow: "var(--shadow-sm)",
        padding: "12px 18px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-faint)",
          marginBottom: "4px",
          fontFamily: "var(--font-mono)",
        }}
      >
        Query
      </div>
      <div style={{ fontSize: "15px", color: "var(--ink)" }}>{text}</div>
    </motion.div>
  );
}

/**
 * AI Message Card with:
 * - Word-by-word animated typewriter answer
 * - Blinking cursor
 * - Stamped citation tags popping in after typewriter finishes
 * - Press & hold / click chunk preview trigger
 */
function AiMessageCard({ message, onSelectChunk }) {
  const [displayedWordsCount, setDisplayedWordsCount] = useState(0);
  const [isTypingDone, setIsTypingDone] = useState(false);

  const words = useRef(message.fullText.split(/\s+/)).current;

  useEffect(() => {
    if (words.length === 0) {
      setIsTypingDone(true);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setDisplayedWordsCount(count);
      if (count >= words.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 28); // 28ms word-by-word pacing

    return () => clearInterval(interval);
  }, [words]);

  const displayedText = words.slice(0, displayedWordsCount).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="archive-card"
      style={{
        alignSelf: "flex-start",
        width: "100%",
        backgroundColor: "var(--paper-card)",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px dashed rgba(21, 26, 23, 0.2)",
          paddingBottom: "8px",
          marginBottom: "14px",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "12px",
            color: "var(--verdigris)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Almaari Record
        </span>
        {message.createdAt && (
          <span className="mono" style={{ fontSize: "11px", color: "var(--ink-faint)" }}>
            {message.createdAt}
          </span>
        )}
      </div>

      {/* Answer with word-by-word typewriter effect & blinking cursor */}
      <div
        style={{
          fontSize: "16px",
          lineHeight: 1.65,
          color: "var(--ink)",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayedText}
        {!isTypingDone && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
            style={{
              display: "inline-block",
              width: "7px",
              height: "16px",
              backgroundColor: "var(--ink)",
              marginLeft: "4px",
              verticalAlign: "middle",
            }}
          />
        )}
      </div>

      {/* Source Citations popping in after answer finishes */}
      {isTypingDone && message.sources && message.sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            marginTop: "20px",
            paddingTop: "14px",
            borderTop: "1px solid rgba(21, 26, 23, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--ink-muted)",
              marginBottom: "8px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Cited Sources (hold or click to preview chunk):
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {message.sources.map((sourceName, idx) => {
              // Find matching chunk for this source
              const matchingChunk =
                message.chunks?.find((c) => c.source === sourceName) || {
                  source: sourceName,
                  text: "Full context chunk available in server index.",
                };

              return (
                <SourceTag
                  key={idx}
                  sourceName={sourceName}
                  onPreview={() => onSelectChunk(matchingChunk)}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Interactive Source Tag:
 * Supports click and press-and-hold to preview matching chunk text.
 */
function SourceTag({ sourceName, onPreview }) {
  const timerRef = useRef(null);

  const startHold = () => {
    timerRef.current = setTimeout(() => {
      onPreview();
    }, 450); // 450ms hold triggers preview
  };

  const clearHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <motion.button
      type="button"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -1, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onPreview}
      onMouseDown={startHold}
      onMouseUp={clearHold}
      onMouseLeave={clearHold}
      onTouchStart={startHold}
      onTouchEnd={clearHold}
      className="stamp-tag verdigris"
      style={{
        cursor: "pointer",
        padding: "5px 10px",
        fontSize: "12px",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span>{sourceName}</span>
    </motion.button>
  );
}

/**
 * Editorial "searching documents..." animated line (no spinner)
 */
function SearchingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="archive-card"
      style={{
        alignSelf: "flex-start",
        padding: "16px 20px",
        backgroundColor: "var(--paper-light)",
        fontFamily: "var(--font-mono)",
        fontSize: "14px",
        color: "var(--ink-muted)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          backgroundColor: "var(--verdigris)",
          borderRadius: "50%",
        }}
      />
      <span>searching documents in the cupboard...</span>
    </motion.div>
  );
}

/**
 * Tactile Modal for Chunk Inspection
 */
function ChunkPreviewModal({ chunk, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(21, 26, 23, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 100,
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="archive-card"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--paper-card)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "12px",
            borderBottom: "1px dashed rgba(21, 26, 23, 0.25)",
            marginBottom: "16px",
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: "14px", fontWeight: 600 }}>
              Source: {chunk.source}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
              Context Chunk Reference
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm" title="Press Esc or click to close">
            Esc
          </button>
        </div>

        {/* Chunk Text Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "var(--paper-light)",
            border: "1px solid rgba(21, 26, 23, 0.2)",
            padding: "16px",
            fontSize: "14px",
            lineHeight: 1.6,
            fontFamily: "var(--font-mono)",
            whiteSpace: "pre-wrap",
            color: "var(--ink)",
          }}
        >
          {chunk.text || "No preview text stored for this chunk."}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "var(--ink-faint)",
          }}
        >
          <span>Grounding Context retrieved by ChromaDB</span>
          <button onClick={onClose} className="btn btn-sm btn-primary">
            Close Preview
          </button>
        </div>
      </motion.div>
    </div>
  );
}
