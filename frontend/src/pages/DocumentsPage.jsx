import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDocuments, uploadDocument, deleteDocument } from "../api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      showNotice("Could not load cupboard files.", "vermilion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const showNotice = (text, type = "verdigris") => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "pdf"].includes(ext)) {
      showNotice("Only .pdf and .txt files can be kept in Almaari.", "vermilion");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadDocument(file);
      showNotice(`Filed away: ${file.name} (${res.chunk_count} chunks)`, "verdigris");
      fetchDocs();
    } catch (err) {
      showNotice(err.message || "Upload failed.", "vermilion");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docId, docName) => {
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      showNotice(`Removed '${docName}' from the cupboard.`, "mustard");
    } catch (err) {
      showNotice(err.message || "Failed to remove document.", "vermilion");
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "36px 20px" }}>
      {/* Header section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
          borderBottom: "1px dashed rgba(21, 26, 23, 0.25)",
          paddingBottom: "18px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "34px",
              lineHeight: 1.1,
            }}
          >
            The Filing Shelves
          </h1>
          <p
            style={{
              color: "var(--ink-muted)",
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
            Your private cupboard for company papers. Documents are read, chunked, and indexed.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="stamp-tag verdigris">
            {documents.length} {documents.length === 1 ? "file" : "files"} filed
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`stamp-tag ${notification.type}`}
            style={{
              display: "block",
              marginBottom: "20px",
              padding: "10px 16px",
              fontSize: "14px",
            }}
          >
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & Drop Upload Zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          scale: isDragOver ? 1.02 : 1,
          backgroundColor: isDragOver ? "var(--verdigris-light)" : "var(--paper-light)",
          borderColor: isDragOver ? "var(--verdigris)" : "var(--ink)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          border: "2px dashed var(--ink)",
          padding: "36px 20px",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: "36px",
          boxShadow: isDragOver ? "4px 4px 0px var(--verdigris)" : "var(--shadow-sm)",
          position: "relative",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        {/* Tactile Paper Icon */}
        <div style={{ marginBottom: "12px" }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "inline-block" }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>

        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "19px",
            fontWeight: 500,
            marginBottom: "6px",
          }}
        >
          {uploading
            ? "Reading and filing document into Almaari..."
            : isDragOver
            ? "Release to deposit document into the cupboard"
            : "Drop a file here, or click to browse"}
        </div>
        <p style={{ color: "var(--ink-muted)", fontSize: "13px" }}>
          Accepts <strong className="mono">.pdf</strong> and <strong className="mono">.txt</strong> files (~500 words per chunk indexed)
        </p>
      </motion.div>

      {/* Documents List */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "20px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>Filed Documents</span>
          <span style={{ fontSize: "12px", fontFamily: "var(--font-sans)", color: "var(--ink-muted)", fontWeight: 400 }}>
            (Swipe card left or click Remove to delete)
          </span>
        </h2>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)", fontStyle: "italic" }}>
            Searching the shelves...
          </div>
        ) : documents.length === 0 ? (
          <div
            className="archive-card"
            style={{
              textAlign: "center",
              padding: "48px 20px",
              backgroundColor: "var(--paper-light)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "18px",
                color: "var(--ink)",
                marginBottom: "6px",
              }}
            >
              The cupboard shelves are bare.
            </p>
            <p style={{ color: "var(--ink-muted)", fontSize: "14px" }}>
              Drop a company policy, handbook, or notes above to begin questioning your archive.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <AnimatePresence>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  formatBytes={formatBytes}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DocumentCard with:
 * - Slight tilt on hover/touch
 * - Swipe-left gesture to reveal Delete action (spring snap-back)
 * - Spring entrance animation
 */
function DocumentCard({ doc, formatBytes, onDelete }) {
  const [swiped, setSwiped] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--vermilion-light)",
        border: "var(--border-ink)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Background Delete Action revealed upon swiping left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingRight: "16px",
        }}
      >
        <button
          onClick={() => onDelete(doc.id, doc.original_name)}
          className="btn btn-accent btn-sm"
          style={{ width: "90px" }}
        >
          Delete
        </button>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(e, info) => {
          if (info.offset.x < -60) {
            setSwiped(true);
          } else {
            setSwiped(false);
          }
        }}
        whileHover={{ rotate: -0.3, y: -2 }}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "var(--paper-card)",
          padding: "16px 20px",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* File details */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
            {/* Archival Doc Icon */}
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "var(--paper-light)",
                border: "1px solid var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                className="mono"
                style={{
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={doc.original_name}
              >
                {doc.original_name}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--ink-muted)",
                  marginTop: "3px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span>Filed: {doc.uploaded_at || "Recent"}</span>
                <span>•</span>
                <span>{formatBytes(doc.file_size)}</span>
              </div>
            </div>
          </div>

          {/* Stamped metadata tags & Delete button */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="stamp-tag verdigris">
              {doc.chunk_count} {doc.chunk_count === 1 ? "chunk" : "chunks"}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id, doc.original_name);
              }}
              className="btn btn-sm"
              title="Remove file from cupboard"
              style={{
                backgroundColor: "transparent",
                color: "var(--vermilion)",
                borderColor: "rgba(21, 26, 23, 0.3)",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
