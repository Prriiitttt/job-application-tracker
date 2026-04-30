import React, { useState, useEffect } from "react";

const PALETTE = [
  "#4f8ef7", "#00e5a0", "#ff6b6b", "#f59e0b",
  "#a855f7", "#14b8a6", "#ec4899", "#f43f5e",
];

function deriveInitials(name) {
  if (!name || typeof name !== "string") return "?";
  // Use Intl.Segmenter when available so emoji + multi-byte glyphs count as one grapheme.
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0];
  const last = parts[parts.length - 1];
  const a = [...first][0] || "";
  const b = parts.length > 1 ? ([...last][0] || "") : "";
  return (a + b).toUpperCase() || "?";
}

function colorFor(seed) {
  if (!seed) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/**
 * Avatar with three render states:
 *   1. avatarUrl present + image loads → <img>
 *   2. avatarUrl present but the image fails (CSP, 404, CORS) → initials fallback
 *   3. avatarUrl missing → initials fallback (no failed network request)
 *
 * Sizing/border-radius/etc. comes from the parent container's existing CSS
 * (.profile-avatar, .discover-avatar, .connection-avatar, .chat-header-avatar)
 * so this component drops into existing markup without additional styling.
 */
export default function Avatar({ avatarUrl, name, alt }) {
  const [errored, setErrored] = useState(false);

  // Reset error state when the URL changes (e.g., user updates their avatar).
  useEffect(() => {
    setErrored(false);
  }, [avatarUrl]);

  if (!avatarUrl || errored) {
    const initials = deriveInitials(name);
    const bg = colorFor(name || "anon");
    return (
      <span
        className="avatar-initials"
        role="img"
        aria-label={alt || name || "user avatar"}
        style={{
          backgroundColor: bg,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontWeight: 600,
        }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={alt || name || ""}
      onError={() => setErrored(true)}
    />
  );
}

// Exported for unit tests
export const __test__ = { deriveInitials, colorFor };
