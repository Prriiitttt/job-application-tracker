export function buildUnreadMap(rows) {
  const map = {};
  if (!Array.isArray(rows)) return map;
  rows.forEach((r) => {
    if (!r || !r.other_user_id) return;
    map[r.other_user_id] = map[r.other_user_id] || !!r.has_unread;
  });
  return map;
}

export function hasAnyUnread(unreadMap) {
  if (!unreadMap || typeof unreadMap !== "object") return false;
  return Object.values(unreadMap).some(Boolean);
}

export function sanitizeFilename(name) {
  if (typeof name !== "string" || name.length === 0) return "file";
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function formatMessageTime(iso, now = new Date()) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  // Relative phrasing only for past messages within the last hour. Future
  // timestamps and very old timestamps fall through to absolute formatting.
  if (diffMin >= 0 && diffMin < 1) return "just now";
  if (diffMin >= 1 && diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  }

  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) {
    return time;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time}`;
  }

  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
