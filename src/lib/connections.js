export function findConnection(connections, currentUserId, otherUserId) {
  if (!Array.isArray(connections)) return null;
  return (
    connections.find(
      (c) =>
        c &&
        ((c.requester_id === currentUserId && c.receiver_id === otherUserId) ||
          (c.requester_id === otherUserId && c.receiver_id === currentUserId))
    ) || null
  );
}

export function deriveConnectionState(connection, currentUserId) {
  if (!connection) return "none";
  if (connection.status === "accepted") return "accepted";
  if (connection.status === "pending") {
    if (connection.requester_id === currentUserId) return "pending_outgoing";
    if (connection.receiver_id === currentUserId) return "pending_incoming";
  }
  return "none";
}

export function filterDiscoverUsers(users, connections, currentUserId, query = "") {
  if (!Array.isArray(users)) return [];
  const q = (query || "").toLowerCase();
  return users.filter((u) => {
    if (!u) return false;
    const conn = findConnection(connections, currentUserId, u.id);
    if (conn && conn.status === "accepted") return false;
    if (!q) return true;
    const username = (u.username || "").toLowerCase();
    const fullName = (u.full_name || "").toLowerCase();
    return username.includes(q) || fullName.includes(q);
  });
}
